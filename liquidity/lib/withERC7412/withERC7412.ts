/* eslint-disable no-console */
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { offchainMainnetEndpoint, offchainTestnetEndpoint } from '@snx-v3/constants';
import {
  importAccountProxy,
  importAllErrors,
  importClosePosition,
  importCoreProxy,
  importMulticall3,
  importPythERC7412Wrapper,
  importPythVerfier,
  importSpotMarketProxy,
  importUSDProxy,
} from '@snx-v3/contracts';
import { extractErrorData, PYTH_ERRORS } from '@snx-v3/parseContractError';
import { notNil } from '@snx-v3/tsHelpers';
import { deploymentHasERC7412, Network } from '@snx-v3/useBlockchain';
import debug from 'debug';
import { ethers } from 'ethers';

async function fetchOffchainData({
  priceIds,
  isTestnet,
}: {
  priceIds: string[];
  isTestnet: boolean;
}) {
  const priceService = new EvmPriceServiceConnection(
    isTestnet ? offchainTestnetEndpoint : offchainMainnetEndpoint
  );
  const signedOffchainData = await priceService.getPriceFeedsUpdateData(priceIds);
  return signedOffchainData;
}

function parseError(
  errorData: any,
  AllErrors: { abi: string[] }
): { name: string; args: any } | undefined {
  if (`${errorData}`.startsWith('0x08c379a0')) {
    const content = `0x${errorData.substring(10)}`;
    // reason: string; for standard revert error string
    const reason = ethers.utils.defaultAbiCoder.decode(['string'], content);
    console.error(reason);
    return {
      name: `Revert ${reason[0]}`,
      args: [],
    };
  }

  let flatErrorsData = errorData;
  // let's cleanup nested Errors[]
  if (`${errorData}`.startsWith('0x0b42fd17')) {
    const [lastChunk] = errorData.split('0b42fd17').slice(-1);
    flatErrorsData = `0x0b42fd17${lastChunk}`;
  }
  try {
    const AllErrorsInterface = new ethers.utils.Interface(
      Array.from(new Set([...AllErrors.abi, ...PYTH_ERRORS]))
    );
    return AllErrorsInterface.parseError(flatErrorsData);
  } catch (error) {
    console.error(`Error parsing failure: ${error}`);
    return {
      name: 'Unknown',
      args: [],
    };
  }
}

// simulate w/ wETH contract because it will have eth balance
// This is useful when we do read/static calls but still need an balance for the price update
// TODO: this probably need to be network aware, maybe look into a different solution even.
export const getDefaultFromAddress = (chainName: string) => {
  switch (chainName) {
    case 'cannon':
      return '0x4200000000000000000000000000000000000006'; // TODO, unclear what to put here
    case 'mainnet':
      return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    case 'sepolia':
      return '0x7b79995e5f793a07bc00c21412e50ecae098e7f9';
    case 'arbitrum':
      return '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
    case 'arbitrum-sepolia':
      return '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73';
    case 'optimism-mainnet':
    case 'base':
    case 'base-sepolia':
      return '0x4200000000000000000000000000000000000006';

    default:
      throw new Error(`Unsupported chain ${chainName}`);
  }
};

function dedupedAbi(abi: string[]) {
  const deduped = new Set();
  const readableAbi: string[] = [];
  abi.forEach((line: string) => {
    const fragment = ethers.utils.Fragment.from(line);
    if (fragment && (fragment.type === 'error' || fragment.type === 'function')) {
      const minimal = fragment.format(ethers.utils.FormatTypes.sighash);
      if (!deduped.has(minimal)) {
        readableAbi.push(fragment.format(ethers.utils.FormatTypes.full));
        deduped.add(minimal);
      }
    }
  });
  return readableAbi;
}

export async function logMulticall({
  network,
  calls,
  label,
}: {
  network: Network;
  calls: (ethers.PopulatedTransaction & { requireSuccess?: boolean })[];
  label: string;
}) {
  const log = debug(`snx:withERC7412:${label}`);
  if (!log.enabled) {
    return;
  }
  const CoryProxyContract = await importCoreProxy(network.id, network.preset);
  const SpotMarketProxy = await importSpotMarketProxy(network.id, network.preset);
  const AccountProxyContract = await importAccountProxy(network.id, network.preset);
  const USDProxyContract = await importUSDProxy(network.id, network.preset);
  const ClosePositionContract = await importClosePosition(network.id, network.preset).catch(
    () => undefined
  );
  const PythERC7412Wrapper = await importPythERC7412Wrapper(network.id, network.preset).catch(
    () => undefined
  );
  const PythVerfier = await importPythVerfier(network.id, network.preset);
  const AllInterface = new ethers.utils.Interface(
    dedupedAbi([
      ...CoryProxyContract.abi,
      ...SpotMarketProxy.abi,
      ...AccountProxyContract.abi,
      ...USDProxyContract.abi,
      ...(ClosePositionContract ? ClosePositionContract.abi : []),
      ...(PythERC7412Wrapper ? PythERC7412Wrapper.abi : []),
      ...PythVerfier.abi,
    ])
  );
  log(
    'multicall calls',
    calls.map(({ data, value, ...rest }) => {
      try {
        // @ts-ignore
        const { name, args } = AllInterface.parseTransaction({ data, value });
        if (Object.keys(args).filter(([key]) => `${key}` !== `${parseInt(key)}`).length > 0) {
          const namedArgs = Object.fromEntries(
            Object.entries(args).filter(([key]) => `${key}` !== `${parseInt(key)}`)
          );
          return { $: name, ...namedArgs };
        }

        const unnamedArgs = Object.entries(args)
          .filter(([key]) => `${key}` === `${parseInt(key)}`)
          .map(([, value]) => value);
        return { $: name, ...unnamedArgs };
      } catch {
        return { $: 'unknown', data, value, ...rest };
      }
    })
  );
}

function extractPriceId(parsedError: { name: string; args: string[] }) {
  try {
    const [_oracleAddress, oracleQuery] = parsedError.args;
    const [_updateType, _stalenessTolerance, [priceId]] = ethers.utils.defaultAbiCoder.decode(
      ['uint8', 'uint64', 'bytes32[]'],
      oracleQuery
    );
    return priceId;
  } catch {
    // whatever
  }
}

async function getMulticallTransaction(
  network: Network,
  calls: (ethers.PopulatedTransaction & { requireSuccess?: boolean })[],
  from: string,
  provider: ethers.providers.BaseProvider
) {
  const Multicall3Contract = await importMulticall3(network.id, network.preset);
  const Multicall3Interface = new ethers.utils.Interface(Multicall3Contract.abi);

  const multicallTxn = {
    from: from ? from : getDefaultFromAddress(network.name),
    to: Multicall3Contract.address,
    data: Multicall3Interface.encodeFunctionData('aggregate3Value', [
      calls.map((call) => ({
        target: call.to,
        callData: call.data,
        value: call.value ? ethers.BigNumber.from(call.value) : ethers.BigNumber.from(0),
        requireSuccess: call.requireSuccess ?? true,
      })),
    ]),
    value: calls.reduce(
      (totalValue, call) => (call.value ? totalValue.add(call.value) : totalValue),
      ethers.BigNumber.from(0)
    ),
  };
  const gasLimit = await provider.estimateGas(multicallTxn);
  return { multicallTxn, gasLimit, _calls: calls };
}

/**
 * If a tx requires ERC7412 pattern, wrap your tx with this function.
 */
export const withERC7412 = async (
  provider: ethers.providers.BaseProvider,
  network: Network,
  calls: (ethers.PopulatedTransaction & { requireSuccess?: boolean })[],
  label: string,
  from: string
) => {
  const log = debug(`snx:withERC7412:${label}`);

  if (!(await deploymentHasERC7412(network.id, network.preset))) {
    await logMulticall({ network, calls, label });
    return await getMulticallTransaction(network, calls, from, provider);
  }

  const AllErrorsContract = await importAllErrors(network.id, network.preset);
  const ClosePositionContract = await importClosePosition(network.id, network.preset).catch(
    () => undefined
  );
  if (ClosePositionContract) {
    ClosePositionContract.abi.forEach((line) => AllErrorsContract.abi.push(line));
  }
  const PythVerfier = await importPythVerfier(network.id, network.preset);

  while (true) {
    try {
      await logMulticall({ network, calls, label });
      return await getMulticallTransaction(network, calls, from, provider);
    } catch (error: Error | any) {
      console.error(error);
      let errorData = extractErrorData(error);
      if (!errorData && error.transaction) {
        try {
          log('Error is missing revert data, trying provider.call, instead of estimate gas...');
          // Some wallets swallows the revert reason when calling estimate gas,try to get the error by using provider.call
          // provider.call wont actually revert, instead the error data is just returned
          const lookedUpError = await provider.call(error.transaction);
          errorData = lookedUpError;
        } catch (newError: any) {
          // console.error(newError);
          log('provider.call(error.transaction) failed, trying to extract error', newError);
          errorData = extractErrorData(error);
        }
      }
      if (!errorData) {
        throw error;
      }
      log('errorData', errorData);

      const parsedError = parseError(errorData, AllErrorsContract);
      if (!parsedError) {
        throw error;
      }
      log('parsedError', parsedError);

      // Collect all the price IDs that require updates
      const missingPriceUpdates = [];
      if (parsedError.name === 'OracleDataRequired') {
        missingPriceUpdates.push(extractPriceId(parsedError));
      }
      if (parsedError.name === 'Errors') {
        for (const err of parsedError?.args?.[0] ?? []) {
          try {
            const parsedErr = parseError(err, AllErrorsContract);
            if (parsedErr?.name === 'OracleDataRequired') {
              missingPriceUpdates.push(extractPriceId(parsedErr));
            }
          } catch {
            // whatever
          }
        }
      }
      const missingPriceUpdatesUnique = Array.from(new Set(missingPriceUpdates));
      log('missingPriceUpdates', missingPriceUpdatesUnique);
      if (missingPriceUpdatesUnique.length < 1) {
        // some other kind of error that's not related to price
        throw error;
      }

      const signedOffchainData = await fetchOffchainData({
        priceIds: missingPriceUpdatesUnique,
        isTestnet: network.isTestnet,
      });

      const extraPriceUpdateTxn = {
        from,
        to: PythVerfier.address,
        data: new ethers.utils.Interface(PythVerfier.abi).encodeFunctionData('updatePriceFeeds', [
          signedOffchainData,
        ]),
        value: ethers.BigNumber.from(missingPriceUpdatesUnique.length),
        requireSuccess: false,
      };
      log('extraPriceUpdateTxn', extraPriceUpdateTxn);

      // Update calls to include price update txn
      // And carry on with our while(true)
      calls = [extraPriceUpdateTxn, ...calls];
    }
  }
};

/**
 * This can be used to do reads plus decoding. The return type will be whatever the type of the decode function is. And the arguments passed will have the multicall decoded and price updates removed
 */
export async function erc7412Call<T>(
  network: Network,
  provider: ethers.providers.BaseProvider,
  calls: ethers.PopulatedTransaction[],
  decode: (x: string[] | string) => T,
  label: string
) {
  const log = debug(`snx:withERC7412:${label}`);

  const Multicall3Contract = await importMulticall3(network.id, network.preset);

  const from = getDefaultFromAddress(network.name);

  const {
    _calls: newCalls,
    multicallTxn,
    gasLimit,
  } = await withERC7412(
    provider,
    network,
    calls.filter(notNil).map((call) => (call.from ? call : { ...call, from })), // fill missing "from"
    label,
    from
  );

  const res = await provider.call({ ...multicallTxn, gasLimit: gasLimit.mul(15).div(10) });
  if (res === '0x') {
    throw new Error(`[${label}] Call returned 0x`);
  }

  if (multicallTxn.to?.toLowerCase() === Multicall3Contract.address.toLowerCase()) {
    // If this was a multicall, decode and remove price updates.
    const decodedMultiCall: { returnData: string }[] = new ethers.utils.Interface(
      Multicall3Contract.abi
    ).decodeFunctionResult('aggregate3Value', res)[0];
    log('multicall response', decodedMultiCall);

    // Remove the price updates
    const responseWithoutPriceUpdates: string[] = [];
    const PythVerfier = await importPythVerfier(network.id, network.preset);
    decodedMultiCall.forEach(({ returnData }, i) => {
      if (newCalls?.[i]?.to !== PythVerfier.address) {
        responseWithoutPriceUpdates.push(returnData);
      }
    });

    const decoded = decode(responseWithoutPriceUpdates);
    log(`multicall decoded`, decoded);
    return decoded;
  }

  const decoded = decode(res);
  log(`decoded`, decoded);
  return decoded;
}
