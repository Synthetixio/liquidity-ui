const abi = [
  'function aggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes[] returnData)',
  'function blockAndAggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)',
  'function getBasefee() view returns (uint256 basefee)',
  'function getBlockHash(uint256 blockNumber) view returns (bytes32 blockHash)',
  'function getBlockNumber() view returns (uint256 blockNumber)',
  'function getChainId() view returns (uint256 chainid)',
  'function getCurrentBlockCoinbase() view returns (address coinbase)',
  'function getCurrentBlockDifficulty() view returns (uint256 difficulty)',
  'function getCurrentBlockGasLimit() view returns (uint256 gaslimit)',
  'function getCurrentBlockTimestamp() view returns (uint256 timestamp)',
  'function getEthBalance(address addr) view returns (uint256 balance)',
  'function getLastBlockHash() view returns (bytes32 blockHash)',
  'function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
  'function tryBlockAndAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)',
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
  'function aggregate3Value(tuple(address target, bool allowFailure, uint256 value, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
];

export async function importMulticall3(
  chainId?: number,
  preset?: string
): Promise<{ address: string; abi: string[] }> {
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/1-main/meta.json'),
        import('@synthetixio/v3-contracts/1-main/TrustedMulticallForwarder.readable.json'),
      ]);
      return { address: meta.contracts.TrustedMulticallForwarder, abi };
    }
    case '11155111-main': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/11155111-main/meta.json'),
        import('@synthetixio/v3-contracts/11155111-main/TrustedMulticallForwarder.readable.json'),
      ]);
      return { address: meta.contracts.TrustedMulticallForwarder, abi };
    }
    case '10-main': {
      const { optimism } = await import('viem/chains');
      return { address: optimism.contracts.multicall3.address, abi };
    }
    case '8453-andromeda': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/8453-andromeda/meta.json'),
        import('@synthetixio/v3-contracts/8453-andromeda/TrustedMulticallForwarder.readable.json'),
      ]);
      return { address: meta.contracts.TrustedMulticallForwarder, abi };
    }
    case '84532-andromeda': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/84532-andromeda/meta.json'),
        import('@synthetixio/v3-contracts/84532-andromeda/TrustedMulticallForwarder.readable.json'),
      ]);
      return { address: meta.contracts.TrustedMulticallForwarder, abi };
    }
    case '42161-main': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/42161-main/meta.json'),
        import('@synthetixio/v3-contracts/42161-main/TrustedMulticallForwarder.readable.json'),
      ]);
      return { address: meta.contracts.TrustedMulticallForwarder, abi };
    }
    case '421614-main': {
      const [{ default: meta }, { default: abi }] = await Promise.all([
        import('@synthetixio/v3-contracts/421614-main/meta.json'),
        import('@synthetixio/v3-contracts/421614-main/TrustedMulticallForwarder.readable.json'),
      ]);
      return { address: meta.contracts.TrustedMulticallForwarder, abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for Multicall3`);
    }
  }
}
