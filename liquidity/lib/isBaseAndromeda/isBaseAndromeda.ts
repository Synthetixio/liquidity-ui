export const isBaseAndromeda = (id?: number | string, preset?: string) =>
  (id?.toString() === '8453' || '84532') && preset === 'andromeda';

export function getRepayerContract(id?: number) {
  switch (id) {
    case 8453:
      return '0xBD8004ea5c73E33d405d35d594221Efc733F7E37';
    case 84532:
      return '0xD00a601eafC2C131F46105827AFB02b925Adf62A';
    default:
      return '';
  }
}

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

export const getUSDCOnBase = (id?: number | string) => {
  if (id?.toString() === '8453') return '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  if (id?.toString() === '84532') return '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
  return '';
};

export const getStataUSDCOnBase = (id?: number | string) => {
  if (id?.toString() === '8453') return '0x4ea71a20e655794051d1ee8b6e4a3269b13ccacc';
  if (id?.toString() === '84532') return '0x70f1b4390688209de7B23DcE275392B282589477';
  return '';
};

export const getWrappedStataUSDCOnBase = (id?: number | string) => {
  if (id?.toString() === '8453') return '0x729Ef31D86d31440ecBF49f27F7cD7c16c6616d2';
  if (id?.toString() === '84532') return '0xB3f05d39504dA95876EA0174D25Ae51Ac2422a70';
  return '';
};
