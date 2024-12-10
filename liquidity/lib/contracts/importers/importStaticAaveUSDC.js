const abi = [
  'constructor(address pool, address rewardsController)',
  'error ECDSAInvalidSignature()',
  'error ECDSAInvalidSignatureLength(uint256 length)',
  'error ECDSAInvalidSignatureS(bytes32 s)',
  'error SafeERC20FailedOperation(address token)',
  'event Approval(address indexed owner, address indexed spender, uint256 amount)',
  'event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)',
  'event Initialized(uint8 version)',
  'event Initialized(address indexed aToken, string staticATokenName, string staticATokenSymbol)',
  'event RewardTokenRegistered(address indexed reward, uint256 startIndex)',
  'event Transfer(address indexed from, address indexed to, uint256 amount)',
  'event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
  'function INCENTIVES_CONTROLLER() view returns (address)',
  'function METADEPOSIT_TYPEHASH() view returns (bytes32)',
  'function METAWITHDRAWAL_TYPEHASH() view returns (bytes32)',
  'function PERMIT_TYPEHASH() view returns (bytes32)',
  'function POOL() view returns (address)',
  'function STATIC__ATOKEN_LM_REVISION() view returns (uint256)',
  'function aToken() view returns (address)',
  'function allowance(address, address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function asset() view returns (address)',
  'function balanceOf(address) view returns (uint256)',
  'function claimRewards(address receiver, address[] rewards)',
  'function claimRewardsOnBehalf(address onBehalfOf, address receiver, address[] rewards)',
  'function claimRewardsToSelf(address[] rewards)',
  'function collectAndUpdateRewards(address reward) returns (uint256)',
  'function convertToAssets(uint256 shares) view returns (uint256)',
  'function convertToShares(uint256 assets) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function deposit(uint256 assets, address receiver, uint16 referralCode, bool depositToAave) returns (uint256)',
  'function deposit(uint256 assets, address receiver) returns (uint256)',
  'function getClaimableRewards(address user, address reward) view returns (uint256)',
  'function getCurrentRewardsIndex(address reward) view returns (uint256)',
  'function getTotalClaimableRewards(address reward) view returns (uint256)',
  'function getUnclaimedRewards(address user, address reward) view returns (uint256)',
  'function initialize(address newAToken, string staticATokenName, string staticATokenSymbol)',
  'function isRegisteredRewardToken(address reward) view returns (bool)',
  'function maxDeposit(address) view returns (uint256)',
  'function maxMint(address) view returns (uint256)',
  'function maxRedeem(address owner) view returns (uint256)',
  'function maxWithdraw(address owner) view returns (uint256)',
  'function metaDeposit(address depositor, address receiver, uint256 assets, uint16 referralCode, bool depositToAave, uint256 deadline, tuple(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) permit, tuple(uint8 v, bytes32 r, bytes32 s) sigParams) returns (uint256)',
  'function metaWithdraw(address owner, address receiver, uint256 shares, uint256 assets, bool withdrawFromAave, uint256 deadline, tuple(uint8 v, bytes32 r, bytes32 s) sigParams) returns (uint256, uint256)',
  'function mint(uint256 shares, address receiver) returns (uint256)',
  'function name() view returns (string)',
  'function nonces(address) view returns (uint256)',
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'function previewDeposit(uint256 assets) view returns (uint256)',
  'function previewMint(uint256 shares) view returns (uint256)',
  'function previewRedeem(uint256 shares) view returns (uint256)',
  'function previewWithdraw(uint256 assets) view returns (uint256)',
  'function rate() view returns (uint256)',
  'function redeem(uint256 shares, address receiver, address owner) returns (uint256)',
  'function redeem(uint256 shares, address receiver, address owner, bool withdrawFromAave) returns (uint256, uint256)',
  'function refreshRewardTokens()',
  'function rewardTokens() view returns (address[])',
  'function symbol() view returns (string)',
  'function totalAssets() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function withdraw(uint256 assets, address receiver, address owner) returns (uint256)',
];

export async function importStaticAaveUSDC(chainId, preset) {
  if (!preset) {
    throw new Error(`Missing preset`);
  }
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '8453-andromeda': {
      const [{ default: meta }] = await Promise.all([
        import('@synthetixio/v3-contracts/8453-andromeda/meta.json'),
      ]);

      return {
        address: meta.contracts.CollateralToken_stataBasUSDC,
        abi,
      };
    }
    //    CollateralToken_stataBasUSDC.readable.json
    case '84532-andromeda': {
      const [{ default: meta }] = await Promise.all([
        import('@synthetixio/v3-contracts/84532-andromeda/meta.json'),
      ]);

      return {
        address: meta.contracts.CollateralToken_stataUSDC,
        abi,
      };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for Extras`);
    }
  }
}
