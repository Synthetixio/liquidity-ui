const abi = [
  'constructor(address v3SystemAddress, address treasuryAddress, uint128 v3PoolId, address collateralTokenAddress)',
  'error ImplementationIsSterile(address implementation)',
  'error InsufficientCRatio(uint128 accountId, uint256 currentDebt, uint256 targetDebt)',
  'error InvalidParameter(string parameter, string reason)',
  'error MarketAlreadyRegistered(uint128 marketId)',
  'error NoChange()',
  'error NotAContract(address contr)',
  'error NotNominated(address addr)',
  'error OutstandingLoan(uint128 accountId, uint256 outstandingLoanAmount)',
  'error OverflowInt256ToUint256()',
  'error OverflowUint256ToInt256()',
  'error OverflowUint256ToUint128()',
  'error Unauthorized(address addr)',
  'error UpgradeSimulationFailed()',
  'error ZeroAddress()',
  'event AccountSaddled(uint128 indexed accountId, uint256 collateralAmount, uint256 debtAssigned)',
  'event AccountUnsaddled(uint128 indexed accountId, uint256 collateralAmount, uint256 debtUnassigned)',
  'event LoanAdjusted(uint128 indexed accountId, uint256 newLoanedAmount, uint256 previousLoanedAmount)',
  'event MarketRegistered(address indexed market, uint128 indexed marketId, address indexed sender)',
  'event OwnerChanged(address oldOwner, address newOwner)',
  'event OwnerNominated(address newOwner)',
  'event Rebalanced(int256 previousVaultDebt, int256 newVaultDebt)',
  'event TargetCRatioSet(uint256 newCRatio)',
  'event TreasuryBurned(uint256 amount)',
  'event TreasuryMinted(uint256 amount)',
  'event Upgraded(address indexed self, address implementation)',
  'function MIN_DELEGATION_TIME() view returns (uint32)',
  'function acceptOwnership()',
  'function adjustLoan(uint128 accountId, uint256 amount)',
  'function artificialDebt() view returns (int256)',
  'function burnTreasury(uint256 amount)',
  'function collateralToken() view returns (address)',
  'function debtDecayPenaltyEnd() view returns (uint128)',
  'function debtDecayPenaltyStart() view returns (uint128)',
  'function debtDecayPower() view returns (uint32)',
  'function debtDecayTime() view returns (uint32)',
  'function getImplementation() view returns (address)',
  'function loanedAmount(uint128 accountId) view returns (uint256)',
  'function loans(uint128) view returns (uint64 startTime, uint32 power, uint32 duration, uint128 loanAmount)',
  'function marketId() view returns (uint128)',
  'function minimumCredit(uint128) view returns (uint256 lockedAmount)',
  'function mintTreasury(uint256 amount)',
  'function name(uint128) pure returns (string)',
  'function nominateNewOwner(address newNominatedOwner)',
  'function nominatedOwner() view returns (address)',
  'function onERC721Received(address, address, uint256, bytes) pure returns (bytes4)',
  'function owner() view returns (address)',
  'function poolId() view returns (uint128)',
  'function rebalance()',
  'function registerMarket() returns (uint128 newMarketId)',
  'function renounceNomination()',
  'function repaymentPenalty(uint128 accountId, uint256 targetLoan) view returns (uint256)',
  'function reportedDebt(uint128) view returns (uint256 debt)',
  'function saddle(uint128 accountId)',
  'function saddledCollateral(uint128) view returns (uint256)',
  'function setDebtDecayFunction(uint32 power, uint32 time, uint128 startPenalty, uint128 endPenalty)',
  'function setTargetCRatio(uint256 ratio)',
  'function simulateUpgradeTo(address newImplementation)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  'function targetCratio() view returns (uint256)',
  'function totalSaddledCollateral() view returns (uint256)',
  'function treasury() view returns (address)',
  'function unsaddle(uint128 accountId)',
  'function upgradeTo(address to)',
  'function v3System() view returns (address)',
];

export async function importTreasuryMarketProxy(
  chainId?: number,
  preset?: string
): Promise<{ address: string; abi: string[] }> {
  if (!preset) {
    throw new Error(`Missing preset`);
  }
  const deployment = `${Number(chainId).toFixed(0)}-${preset}`;
  switch (deployment) {
    case '1-main': {
      return { address: '0x7b952507306E7D983bcFe6942Ac9F2f75C1332D8', abi };
    }
    default: {
      throw new Error(`Unsupported deployment ${deployment} for TreasuryMarketProxy`);
    }
  }
}
