/* eslint-disable no-console */
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { offchainMainnetEndpoint, offchainTestnetEndpoint } from '@snx-v3/constants';
import {
  importAllErrors,
  importCoreProxy,
  importMulticall3,
  importPythERC7412Wrapper,
} from '@snx-v3/contracts';
import { Network, getMagicProvider } from '@snx-v3/useBlockchain';
import { ethers } from 'ethers';

export const ERC7412_ABI = [
  'error OracleDataRequired(address oracleContract, bytes oracleQuery)',
  'error OracleDataRequired(address oracleContract, bytes oracleQuery, uint256 feeRequired)',
  'error Errors(bytes[] errors)',
  'error FeeRequired(uint feeAmount)',
  'function oracleId() view external returns (bytes32)',
  'function fulfillOracleQuery(bytes calldata signedOffchainData) payable external',
];

export const PYTH_ERRORS = [
  // Function arguments are invalid (e.g., the arguments lengths mismatch)
  // Signature: 0xa9cb9e0d
  'error InvalidArgument()',
  // Update data is coming from an invalid data source.
  // Signature: 0xe60dce71
  'error InvalidUpdateDataSource()',
  // Update data is invalid (e.g., deserialization error)
  // Signature: 0xe69ffece
  'error InvalidUpdateData()',
  // Insufficient fee is paid to the method.
  // Signature: 0x025dbdd4
  'error InsufficientFee()',
  // There is no fresh update, whereas expected fresh updates.
  // Signature: 0xde2c57fa
  'error NoFreshUpdate()',
  // There is no price feed found within the given range or it does not exists.
  // Signature: 0x45805f5d
  'error PriceFeedNotFoundWithinRange()',
  // Price feed not found or it is not pushed on-chain yet.
  // Signature: 0x14aebe68
  'error PriceFeedNotFound()',
  // Requested price is stale.
  // Signature: 0x19abf40e
  'error StalePrice()',
  // Given message is not a valid Wormhole VAA.
  // Signature: 0x2acbe915
  'error InvalidWormholeVaa()',
  // Governance message is invalid (e.g., deserialization error).
  // Signature: 0x97363b35
  'error InvalidGovernanceMessage()',
  // Governance message is not for this contract.
  // Signature: 0x63daeb77
  'error InvalidGovernanceTarget()',
  // Governance message is coming from an invalid data source.
  // Signature: 0x360f2d87
  'error InvalidGovernanceDataSource()',
  // Governance message is old.
  // Signature: 0x88d1b847
  'error OldGovernanceMessage()',
  // The wormhole address to set in SetWormholeAddress governance is invalid.
  // Signature: 0x13d3ed82
  'error InvalidWormholeAddressToSet()',
];

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
  const updateType = 1;
  const stalenessTolerance = 3300;
  return ethers.utils.defaultAbiCoder.encode(
    ['uint8', 'uint64', 'bytes32[]', 'bytes[]'],
    [updateType, stalenessTolerance, priceIds, signedOffchainData]
  );
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
    const AllErrorsInterface = new ethers.utils.Interface([...AllErrors.abi, ...PYTH_ERRORS]);
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
  const PythERC7412Wrapper = await importPythERC7412Wrapper(network.id, network.preset);
  const AllInterface = new ethers.utils.Interface([
    ...CoryProxyContract.abi,
    ...PythERC7412Wrapper.abi,
  ]);
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

function extractErrorData(error: Error | any) {
  return (
    error?.error?.error?.error?.data ||
    error?.error?.error?.data ||
    error?.error?.data?.data ||
    error?.error?.data ||
    error?.data?.data ||
    error?.data
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

/**
 * If a tx requires ERC7412 pattern, wrap your tx with this function.
 */
export const withERC7412 = async (
  network: Network,
  calls: (ethers.PopulatedTransaction & { requireSuccess?: boolean })[],
  label: string,
  from: string
): Promise<ethers.PopulatedTransaction & { gasLimit: ethers.BigNumber }> => {
  // Make sure we're always using JSONRpcProvider, the web3 provider coming from the signer might have bugs causing errors to miss revert data
  const jsonRpcProvider =
    getMagicProvider() ?? new ethers.providers.JsonRpcProvider(network.rpcUrl());
  const Multicall3Contract = await importMulticall3(network.id, network.preset);
  const Multicall3Interface = new ethers.utils.Interface(Multicall3Contract.abi);
  const AllErrorsContract = await importAllErrors(network.id, network.preset);
  const PythERC7412Wrapper = await importPythERC7412Wrapper(network.id, network.preset);

  while (true) {
    try {
      if (window.localStorage.getItem('DEBUG') === 'true') {
        await logMulticall({ network, calls, label });
      }
      const multicallTxn = {
        from: from ? from : getDefaultFromAddress(network.name),
        to: Multicall3Contract.address,
        data: Multicall3Interface.encodeFunctionData('aggregate3Value', [
          calls.map((call) => ({
            target: call.to,
            callData: call.data,
            value: call.value ? ethers.BigNumber.from(call.value) : ethers.BigNumber.from(0),
            requireSuccess: call.requireSuccess ?? false,
          })),
        ]),
        value: calls.reduce(
          (totalValue, call) => (call.value ? totalValue.add(call.value) : totalValue),
          ethers.BigNumber.from(0)
        ),
      };
      const gasLimit = await jsonRpcProvider.estimateGas(multicallTxn);
      return { ...multicallTxn, gasLimit };
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
      console.log(`[${label}]`, { missingPriceUpdates });
      if (missingPriceUpdates.length < 1) {
        // some other kind of error that's not related to price
        throw error;
      }

      const signedOffchainData = await fetchOffchainData({
        priceIds: missingPriceUpdates,
        isTestnet: network.isTestnet,
      });

      const extraPriceUpdateTxn = {
        from,
        to: PythERC7412Wrapper.address,
        data: new ethers.utils.Interface(PythERC7412Wrapper.abi).encodeFunctionData(
          'fulfillOracleQuery',
          [signedOffchainData]
        ),
        value: ethers.BigNumber.from(missingPriceUpdates.length),
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
  const newCall = await withERC7412(
    network,
    calls.map((call) => (call.from ? call : { ...call, from })), // fill missing "from"
    label,
    from
  );

  const res = await provider.call(newCall);

  if (newCall.to?.toLowerCase() === Multicall3Contract.address.toLowerCase()) {
    // If this was a multicall, decode and remove price updates.
    const decodedMultiCall: { returnData: string }[] = new ethers.utils.Interface(
      Multicall3Contract.abi
    ).decodeFunctionResult('aggregate3Value', res)[0];

    // Remove the price updates
    const responseWithoutPriceUpdates = decodedMultiCall.filter(
      ({ returnData }) => returnData !== '0x' // price updates have 0x as return data
    );

    return decode(responseWithoutPriceUpdates.map(({ returnData }) => returnData));
  }

  return decode(res);
}
