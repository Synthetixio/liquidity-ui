import { Wei } from '@synthetixio/wei';
import numbro from 'numbro';

export function currency(value?: Wei) {
  try {
    if (!value) {
      return '-';
    }
    if (value.eq(0)) {
      return '0.00';
    }
    if (value.abs().lt(0.01)) {
      return value.toString();
    }
    const m2 = numbro(value.toNumber()).format({
      thousandSeparated: true,
      mantissa: 2,
    });
    const m0 = numbro(value.toNumber()).format({
      thousandSeparated: true,
      mantissa: 0,
    });
    // Strip unnecessary .00
    return parseFloat(m2) === parseFloat(m0) ? m0 : m2;
  } catch {
    return `${value}`;
  }
}
