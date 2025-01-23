export function numberWithCommas(value: string, decimals?: number) {
  const parts = value.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const joinedParts = parts.join('.');
  return decimals ? joinedParts.substring(0, joinedParts.indexOf('.') + decimals + 1) : joinedParts;
}

export const formatNumberToUsd = (value: number, options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat('en-EN', {
    style: 'currency',
    currency: 'USD',
    ...options,
  }).format(Number(value));
};

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat('en-EN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(Number(value));
};

export const formatPercent = (value: number, options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat('en-EN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    style: 'percent',
    ...options,
  }).format(Number(value));
};
