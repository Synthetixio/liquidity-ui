export const isBaseAndromeda = (id?: number | string, preset?: string) =>
  (id?.toString() === '8453' || '84532') && preset === 'andromeda';

export function getSpotMarketId(collateralSymbol?: string) {
  switch (collateralSymbol?.toLowerCase()) {
    case 'usdc':
    case 'susdc':
      return USDC_BASE_MARKET;

    case 'statausdc':
    case 'sstatausdc':
    case 'stataUSDC':
      return STATA_BASE_MARKET;

    default:
      return USDC_BASE_MARKET;
  }
}

export const USDC_BASE_MARKET = '1';
export const STATA_BASE_MARKET = '3';

export const getWrappedStataUSDCOnBase = (id?: number | string) => {
  if (id?.toString() === '8453') return '0x729Ef31D86d31440ecBF49f27F7cD7c16c6616d2';
  if (id?.toString() === '84532') return '0xB3f05d39504dA95876EA0174D25Ae51Ac2422a70';
  return '';
};
