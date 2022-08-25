export const address = '0x32e64F315815b3626c9CB8fE45C7DBfaAE5F8ff5';
export const abi = [
  'error EmptyVault(uint256 fundId, address collateralType)',
  'error FundAlreadyApproved(uint256 fundId)',
  'error FundAlreadyExists(uint256 fundId)',
  'error FundNotFound(uint256 fundId)',
  'error InsufficientAccountCollateral(uint256 accountId, address collateralType, uint256 requestedAmount)',
  'error InsufficientCollateralRatio(uint256 collateralValue, uint256 debt, uint256 ratio, uint256 minRatio)',
  'error InsufficientDebt(int256 currentDebt)',
  'error InvalidCollateralType(address collateralType)',
  'error InvalidLeverage(uint256 leverage)',
  'error InvalidParameters(string incorrectParameter, string help)',
  'error InvalidParameters(string incorrectParameter, string help)',
  'error MismatchAssociatedSystemKind(bytes32 expected, bytes32 actual)',
  'error OnlyTokenProxyAllowed(address origin)',
  'error RoleNotAuthorized(uint256 accountId, bytes32 role, address target)',
  'event DelegationUpdated(bytes32 liquidityItemId, uint256 accountId, uint256 fundId, address collateralType, uint256 amount, uint256 leverage)',
  'event FundApprovedAdded(uint256 fundId)',
  'event FundApprovedRemoved(uint256 fundId)',
  'event FundCreated(address owner, uint256 fundId)',
  'event FundPositionSet(uint256 fundId, uint256[] markets, uint256[] weights, address executedBy)',
  'event NominatedNewOwner(address nominatedOwner, uint256 fundId)',
  'event OwnershipAccepted(address newOwner, uint256 fundId)',
  'event OwnershipRenounced(address target, uint256 fundId)',
  'event PreferredFundSet(uint256 fundId)',
  'event RewardDistributionSet(uint256 indexed fundId, address indexed token, uint256 indexed index, address distributor, uint256 totalRewarded, uint256 start, uint256 duration)',
  'event RewardsClaimed(uint256 indexed fundId, address indexed token, uint256 indexed accountId, uint256 index, uint256 amountClaimed)',
  'function accountCollateralRatio(uint256 accountId, uint256 fundId, address collateralType) returns (uint256)',
  'function accountVaultCollateral(uint256 accountId, uint256 fundId, address collateralType) view returns (uint256 amount, uint256 value, uint256 shares)',
  'function accountVaultDebt(uint256 accountId, uint256 fundId, address collateralType) returns (int256)',
  'function burnUSD(uint256 accountId, uint256 fundId, address collateralType, uint256 amount)',
  'function debtPerShare(uint256 fundId, address collateralType) returns (int256)',
  'function delegateCollateral(uint256 accountId, uint256 fundId, address collateralType, uint256 collateralAmount, uint256 leverage)',
  'function getLiquidityItem(bytes32 liquidityItemId) view returns (tuple(uint128 usdMinted, int128 cumulativeDebt, uint128 leverage) liquidityItem)',
  'function mintUSD(uint256 accountId, uint256 fundId, address collateralType, uint256 amount)',
  'function totalVaultShares(uint256 fundId, address collateralType) view returns (uint256)',
  'function vaultCollateral(uint256 fundId, address collateralType) returns (uint256 amount, uint256 value)',
  'function vaultDebt(uint256 fundId, address collateralType) returns (int256)',
];
