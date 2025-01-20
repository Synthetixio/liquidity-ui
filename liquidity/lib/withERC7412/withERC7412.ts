/* eslint-disable no-console */
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { offchainMainnetEndpoint, offchainTestnetEndpoint } from '@snx-v3/constants';
import {
  importAccountProxy,
  importClosePosition,
  importCoreProxy,
  importPositionManager,
  importPositionManagerAndromedaStataUSDC,
  importPositionManagerAndromedaUSDC,
  importPythERC7412Wrapper,
  importPythVerifier,
  importSpotMarketProxy,
  importTrustedMulticallForwarder,
  importUSDProxy,
} from '@snx-v3/contracts';
import { extractErrorData } from '@snx-v3/parseContractError';
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

function dedupedFunctions(abi: string[]) {
  const deduped = new Set();
  const readableAbi: string[] = [];
  abi
    .filter((line: string) => line.startsWith('function '))
    .forEach((line: string) => {
      const fragment = ethers.utils.Fragment.from(line);
      if (fragment) {
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
  const AllInterface = new ethers.utils.Interface(
    dedupedFunctions(
      (
        await Promise.all([
          importCoreProxy(network.id, network.preset).catch(() => ({ abi: [] })),
          importSpotMarketProxy(network.id, network.preset).catch(() => ({ abi: [] })),
          importAccountProxy(network.id, network.preset).catch(() => ({ abi: [] })),
          importUSDProxy(network.id, network.preset).catch(() => ({ abi: [] })),
          importClosePosition(network.id, network.preset).catch(() => ({ abi: [] })),
          importPythERC7412Wrapper(network.id, network.preset).catch(() => ({ abi: [] })),
          importPythVerifier(network.id, network.preset).catch(() => ({ abi: [] })),
          importPositionManager(network.id, network.preset).catch(() => ({ abi: [] })),
          importPositionManagerAndromedaUSDC(network.id, network.preset).catch(() => ({ abi: [] })),
          importPositionManagerAndromedaStataUSDC(network.id, network.preset).catch(() => ({
            abi: [],
          })),
        ])
      ).flatMap((c) => (c ? c.abi : []))
    )
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

async function getMulticallTransaction(
  network: Network,
  calls: (ethers.PopulatedTransaction & { requireSuccess?: boolean })[],
  from: string,
  provider: ethers.providers.BaseProvider
) {
  const Multicall3Contract = await importTrustedMulticallForwarder(network.id, network.preset);
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

  const PythVerfier = await importPythVerifier(network.id, network.preset);

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

      // Collect all the price IDs that require updates
      const missingPriceUpdates: string[] = errorData
        // Signature of OracleDataRequired
        .split('cf2cabdf')
        // Skip all the data before the first signature of OracleDataRequired
        .slice(1)
        // Full OracleDataRequired without signature is 512 bytes
        .map((s: string) => s.slice(0, 512))
        // Price feed is the last and has 64 bytes, prefix with 0x
        .map((s: string) => `0x${s.slice(-64)}`);
      if (missingPriceUpdates.length < 1) {
        // some other kind of error that's not related to price
        throw error;
      }

      const missingPriceUpdatesUnique = Array.from(new Set(missingPriceUpdates));
      log('missingPriceUpdates', missingPriceUpdatesUnique);

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
  calls: (ethers.PopulatedTransaction & { requireSuccess?: boolean })[],
  decode: (x: { success: boolean; returnData: string }[]) => T,
  label: string
) {
  const log = debug(`snx:withERC7412:${label}`);

  const TrustedMulticallForwarder = await importTrustedMulticallForwarder(
    network.id,
    network.preset
  );

  const from = getDefaultFromAddress(network.name);

  const {
    _calls: newCalls,
    multicallTxn: erc7412Tx,
    gasLimit,
  } = await withERC7412(
    provider,
    network,
    calls.filter(notNil).map((call) => (call.from ? call : { ...call, from })), // fill missing "from"
    label,
    from
  );

  const res = await provider.call({
    ...erc7412Tx,
    gasLimit: gasLimit.mul(15).div(10),
  });
  if (res === '0x') {
    throw new Error(`[${label}] Call returned 0x`);
  }

  const decodedMulticall: { success: boolean; returnData: string }[] = new ethers.utils.Interface(
    TrustedMulticallForwarder.abi
  ).decodeFunctionResult('aggregate3Value', res)[0];
  log('multicall response', decodedMulticall);

  const PythVerifier = await importPythVerifier(network.id, network.preset);
  const decodedMulticallWithoutPriceUpdates = decodedMulticall
    // Remove the price updates
    .filter((_, i) => newCalls?.[i]?.to?.toLowerCase() !== PythVerifier.address?.toLowerCase());

  if (calls.length !== decodedMulticallWithoutPriceUpdates.length) {
    throw new Error(`[${label}] Unexpected multicall response`);
  }
  const decoded = decode(decodedMulticallWithoutPriceUpdates);
  log(`multicall decoded`, decoded);
  return decoded;
}
