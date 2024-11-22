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
  importUSDProxy,
} from '@snx-v3/contracts';
import { extractErrorData, PYTH_ERRORS } from '@snx-v3/parseContractError';
import { notNil } from '@snx-v3/tsHelpers';
import { deploymentHasERC7412, getMagicProvider, Network } from '@snx-v3/useBlockchain';
import { ethers } from 'ethers';

const IS_DEBUG =
  window.localStorage.getItem('DEBUG') === 'true' ||
  window.localStorage.DEBUG?.slice(0, 3) === 'snx';

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
  AllErrors: { address: string; abi: string[] }
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

  try {
    const AllErrorsInterface = new ethers.utils.Interface(
      Array.from(new Set([...AllErrors.abi, ...PYTH_ERRORS]))
    );
    return AllErrorsInterface.parseError(errorData);
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

async function logMulticall({
  network,
  calls,
  label,
}: {
  network: Network;
  calls: (ethers.PopulatedTransaction & { requireSuccess?: boolean })[];
  label: string;
}) {
  const CoryProxyContract = await importCoreProxy(network.id, network.preset);
  const AccountProxyContract = await importAccountProxy(network.id, network.preset);
  const USDProxyContract = await importUSDProxy(network.id, network.preset);
  const ClosePositionContract = await importClosePosition(network.id, network.preset).catch(
    () => undefined
  );
  const PythERC7412Wrapper = await importPythERC7412Wrapper(network.id, network.preset);
  const PythVerfier = await importPythVerfier(network.id, network.preset);
  const AllInterface = new ethers.utils.Interface(
    Array.from(
      new Set([
        ...CoryProxyContract.abi,
        ...AccountProxyContract.abi,
        ...USDProxyContract.abi,
        ...(ClosePositionContract ? ClosePositionContract.abi : []),
        ...PythERC7412Wrapper.abi,
        ...PythVerfier.abi,
      ])
    )
  );
  console.log(
    `[${label}] calls`,
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
  provider: ethers.providers.JsonRpcProvider
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
  network: Network,
  calls: (ethers.PopulatedTransaction & { requireSuccess?: boolean })[],
  label: string,
  from: string
) => {
  // Make sure we're always using JSONRpcProvider, the web3 provider coming from the signer might have bugs causing errors to miss revert data
  const jsonRpcProvider =
    getMagicProvider() ?? new ethers.providers.JsonRpcProvider(network.rpcUrl());

  if (!(await deploymentHasERC7412(network.id, network.preset))) {
    return await getMulticallTransaction(network, calls, from, jsonRpcProvider);
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
      if (IS_DEBUG) {
        await logMulticall({ network, calls, label });
      }
      return await getMulticallTransaction(network, calls, from, jsonRpcProvider);
    } catch (error: Error | any) {
      console.error(error);
      let errorData = extractErrorData(error);
      if (!errorData && error.transaction) {
        try {
          console.log(
            'Error is missing revert data, trying provider.call, instead of estimate gas...'
          );
          // Some wallets swallows the revert reason when calling estimate gas,try to get the error by using provider.call
          // provider.call wont actually revert, instead the error data is just returned
          const lookedUpError = await jsonRpcProvider.call(error.transaction);
          errorData = lookedUpError;
        } catch (newError: any) {
          console.error(newError);
          console.log('provider.call(error.transaction) failed, trying to extract error');
          errorData = extractErrorData(error);
        }
      }
      if (!errorData) {
        throw error;
      }
      console.log(`[${label}]`, { errorData });

      const parsedError = parseError(errorData, AllErrorsContract);
      if (!parsedError) {
        throw error;
      }
      console.log(`[${label}]`, { parsedError });

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
      console.log(`[${label}]`, { missingPriceUpdates: missingPriceUpdatesUnique });
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
      // return [extraPriceUpdateTxn, ...calls.map()];
      console.log(`[${label}]`, { extraPriceUpdateTxn });

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
  provider: ethers.providers.Provider,
  calls: ethers.PopulatedTransaction[],
  decode: (x: string[] | string) => T,
  label: string
) {
  const Multicall3Contract = await importMulticall3(network.id, network.preset);

  const from = getDefaultFromAddress(network.name);

  const {
    _calls: newCalls,
    multicallTxn,
    gasLimit,
  } = await withERC7412(
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

    if (IS_DEBUG) {
      console.log(`[${label}] multicall`, decodedMultiCall);
    }

    // Remove the price updates
    const responseWithoutPriceUpdates: string[] = [];
    const PythVerfier = await importPythVerfier(network.id, network.preset);
    decodedMultiCall.forEach(({ returnData }, i) => {
      if (newCalls?.[i]?.to !== PythVerfier.address) {
        responseWithoutPriceUpdates.push(returnData);
      }
    });

    const decoded = decode(responseWithoutPriceUpdates);
    if (IS_DEBUG) {
      console.log(`[${label}] result`, decoded);
    }
    return decoded;
  }

  const decoded = decode(res);
  if (IS_DEBUG) {
    console.log(`[${label}] result`, decoded);
  }
  return decoded;
}
