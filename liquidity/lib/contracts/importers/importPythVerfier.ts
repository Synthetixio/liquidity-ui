// [
//   "constructor()",
//   "error InsufficientFee()",
//   "error InvalidArgument()",
//   "error InvalidGovernanceDataSource()",
//   "error InvalidGovernanceMessage()",
//   "error InvalidGovernanceTarget()",
//   "error InvalidUpdateData()",
//   "error InvalidUpdateDataSource()",
//   "error InvalidWormholeAddressToSet()",
//   "error InvalidWormholeVaa()",
//   "error NoFreshUpdate()",
//   "error OldGovernanceMessage()",
//   "error PriceFeedNotFound()",
//   "error PriceFeedNotFoundWithinRange()",
//   "error StalePrice()",
//   "event AdminChanged(address previousAdmin, address newAdmin)",
//   "event BatchPriceFeedUpdate(uint16 chainId, uint64 sequenceNumber)",
//   "event BeaconUpgraded(address indexed beacon)",
//   "event ContractUpgraded(address oldImplementation, address newImplementation)",
//   "event DataSourcesSet(tuple(uint16 chainId, bytes32 emitterAddress)[] oldDataSources, tuple(uint16 chainId, bytes32 emitterAddress)[] newDataSources)",
//   "event FeeSet(uint256 oldFee, uint256 newFee)",
//   "event GovernanceDataSourceSet(tuple(uint16 chainId, bytes32 emitterAddress) oldDataSource, tuple(uint16 chainId, bytes32 emitterAddress) newDataSource, uint64 initialSequence)",
//   "event Initialized(uint8 version)",
//   "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
//   "event PriceFeedUpdate(bytes32 indexed id, uint64 publishTime, int64 price, uint64 conf)",
//   "event Upgraded(address indexed implementation)",
//   "event ValidPeriodSet(uint256 oldValidPeriod, uint256 newValidPeriod)",
//   "event WormholeAddressSet(address oldWormholeAddress, address newWormholeAddress)",
//   "function chainId() view returns (uint16)",
//   "function executeGovernanceInstruction(bytes encodedVM)",
//   "function getEmaPrice(bytes32 id) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime) price)",
//   "function getEmaPriceNoOlderThan(bytes32 id, uint256 age) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime) price)",
//   "function getEmaPriceUnsafe(bytes32 id) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime) price)",
//   "function getPrice(bytes32 id) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime) price)",
//   "function getPriceNoOlderThan(bytes32 id, uint256 age) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime) price)",
//   "function getPriceUnsafe(bytes32 id) view returns (tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime) price)",
//   "function getUpdateFee(bytes[] updateData) view returns (uint256 feeAmount)",
//   "function getUpdateFee(uint256 updateDataSize) view returns (uint256 feeAmount)",
//   "function getValidTimePeriod() view returns (uint256)",
//   "function governanceDataSource() view returns (tuple(uint16 chainId, bytes32 emitterAddress))",
//   "function governanceDataSourceIndex() view returns (uint32)",
//   "function hashDataSource(tuple(uint16 chainId, bytes32 emitterAddress) ds) pure returns (bytes32)",
//   "function initialize(address wormhole, uint16[] dataSourceEmitterChainIds, bytes32[] dataSourceEmitterAddresses, uint16 governanceEmitterChainId, bytes32 governanceEmitterAddress, uint64 governanceInitialSequence, uint256 validTimePeriodSeconds, uint256 singleUpdateFeeInWei)",
//   "function isValidDataSource(uint16 dataSourceChainId, bytes32 dataSourceEmitterAddress) view returns (bool)",
//   "function isValidGovernanceDataSource(uint16 governanceChainId, bytes32 governanceEmitterAddress) view returns (bool)",
//   "function lastExecutedGovernanceSequence() view returns (uint64)",
//   "function latestPriceInfoPublishTime(bytes32 priceId) view returns (uint64)",
//   "function owner() view returns (address)",
//   "function parseAuthorizeGovernanceDataSourceTransferPayload(bytes encodedPayload) pure returns (tuple(bytes claimVaa) sgds)",
//   "function parseGovernanceInstruction(bytes encodedInstruction) pure returns (tuple(uint8 module, uint8 action, uint16 targetChainId, bytes payload) gi)",
//   "function parsePriceFeedUpdates(bytes[] updateData, bytes32[] priceIds, uint64 minPublishTime, uint64 maxPublishTime) payable returns (tuple(bytes32 id, tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime) price, tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime) emaPrice)[] priceFeeds)",
//   "function parsePriceFeedUpdatesUnique(bytes[] updateData, bytes32[] priceIds, uint64 minPublishTime, uint64 maxPublishTime) payable returns (tuple(bytes32 id, tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime) price, tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime) emaPrice)[] priceFeeds)",
//   "function parseRequestGovernanceDataSourceTransferPayload(bytes encodedPayload) pure returns (tuple(uint32 governanceDataSourceIndex) sgdsClaim)",
//   "function parseSetDataSourcesPayload(bytes encodedPayload) pure returns (tuple(tuple(uint16 chainId, bytes32 emitterAddress)[] dataSources) sds)",
//   "function parseSetFeePayload(bytes encodedPayload) pure returns (tuple(uint256 newFee) sf)",
//   "function parseSetValidPeriodPayload(bytes encodedPayload) pure returns (tuple(uint256 newValidPeriod) svp)",
//   "function parseSetWormholeAddressPayload(bytes encodedPayload) pure returns (tuple(address newWormholeAddress) sw)",
//   "function parseUpgradeContractPayload(bytes encodedPayload) pure returns (tuple(address newImplementation) uc)",
//   "function priceFeedExists(bytes32 id) view returns (bool)",
//   "function proxiableUUID() view returns (bytes32)",
//   "function pythUpgradableMagic() pure returns (uint32)",
//   "function queryPriceFeed(bytes32 id) view returns (tuple(bytes32 id, tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime) price, tuple(int64 price, uint64 conf, int32 expo, uint256 publishTime) emaPrice) priceFeed)",
//   "function renounceOwnership()",
//   "function singleUpdateFeeInWei() view returns (uint256)",
//   "function transferOwnership(address newOwner)",
//   "function updatePriceFeeds(bytes[] updateData) payable",
//   "function updatePriceFeedsIfNecessary(bytes[] updateData, bytes32[] priceIds, uint64[] publishTimes) payable",
//   "function upgradeTo(address newImplementation)",
//   "function upgradeToAndCall(address newImplementation, bytes data) payable",
//   "function validDataSources() view returns (tuple(uint16 chainId, bytes32 emitterAddress)[])",
//   "function validTimePeriodSeconds() view returns (uint256)",
//   "function version() pure returns (string)",
//   "function wormhole() view returns (address)"
// ]
const abi = ['function updatePriceFeeds(bytes[] updateData) payable'];

export async function importPythVerfier(
  chainId?: number,
  preset?: string
): Promise<{ address: string; abi: string[] }> {
  if (!preset) {
    throw new Error(`Missing preset`);
  }
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;

  switch (deployment) {
    case '1-main': {
      return {
        address: '0x4305FB66699C3B2702D4d05CF36551390A4c69C6',
        abi,
      };
    }
    case '11155111-main': {
      return {
        address: '0xDd24F84d36BF92C65F92307595335bdFab5Bbd21',
        abi,
      };
    }
    case '10-main': {
      return {
        address: '0xff1a0f4744e8582DF1aE09D5611b887B6a12925C',
        abi,
      };
    }
    case '8453-andromeda': {
      return {
        address: '0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a',
        abi,
      };
    }
    case '84532-andromeda': {
      return {
        address: '0xA2aa501b19aff244D90cc15a4Cf739D2725B5729',
        abi,
      };
    }
    case '42161-main': {
      return {
        address: '0xff1a0f4744e8582DF1aE09D5611b887B6a12925C',
        abi,
      };
    }
    case '421614-main': {
      return {
        address: '0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF',
        abi,
      };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for Extras`);
    }
  }
}
