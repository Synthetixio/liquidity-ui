export const isBaseAndromeda = (id?: number | string, preset?: string) =>
  (id?.toString() === '8453' || '84532') && preset === 'andromeda';

export function getSpotMarketId(collateralSymbol?: string) {
  switch (collateralSymbol?.toLowerCase()) {
    case 'usdc':
    case 'susdc':
      return USDC_BASE_MARKET;

    case 'statausdc':
    case 'sstatausdc':
      return STATA_BASE_MARKET;

    default:
      return USDC_BASE_MARKET;
  }
}

export const USDC_BASE_MARKET = '1';
export const STATA_BASE_MARKET = '3';
