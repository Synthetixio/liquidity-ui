/* global window */

async function devtoolsFormatters() {
  const { Wei } = await import('@synthetixio/wei');
  const { ethers } = await import('ethers');

  function number(obj) {
    if (obj.eq(ethers.constants.MaxUint256)) {
      return 'MaxUint256';
    }
    if (obj.eq(ethers.constants.MaxInt256)) {
      return 'MaxInt256';
    }
    if (obj.abs().gt(1e10)) {
      // Assuming everything bigger than 1e10 is a wei
      return `wei ${parseFloat(ethers.utils.formatEther(`${obj}`))}`;
    }
    return parseFloat(obj.toString());
  }
  // @ts-ignore
  window.devtoolsFormatters = window.devtoolsFormatters ?? [];
  // @ts-ignore
  window.devtoolsFormatters.push({
    header: function (obj) {
      if (obj instanceof ethers.BigNumber) {
        return [
          'div',
          { style: 'color: #6ff' },
          ['span', {}, 'BigNumber('],
          ['span', { style: 'color: #ff3' }, number(obj)],
          ['span', {}, ' '],
          ['span', { style: 'color: #3f3' }, obj.toHexString()],
          ['span', {}, ')'],
        ];
      }
      if (obj instanceof Wei) {
        return [
          'div',
          { style: 'color: #6ff' },
          ['span', {}, 'Wei('],
          ['span', { style: 'color: #ff3' }, number(ethers.BigNumber.from(obj.toBN()))],
          ['span', {}, ' '],
          ['span', { style: 'color: #3f3' }, obj.toBN().toHexString()],
          ['span', {}, ')'],
        ];
      }
      return null;
    },
    hasBody: function () {
      return false;
    },
  });
}

module.exports = {
  devtoolsFormatters,
};
