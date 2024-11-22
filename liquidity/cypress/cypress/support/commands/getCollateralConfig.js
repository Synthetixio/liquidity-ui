import { importCollateralTokens } from '@snx-v3/contracts';

export async function getCollateralConfig({ symbol }) {
  const collateralConfigs = await importCollateralTokens(
    Cypress.env('chainId'),
    Cypress.env('preset')
  );
  const collateralConfig = collateralConfigs.find((c) => c.symbol === symbol);
  if (!collateralConfig) {
    throw new Error(`Collateral config for "${symbol}" does not exist`);
  }
  return collateralConfig;
}
