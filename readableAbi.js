const { ethers } = require('ethers');
const abi = process.argv.slice(2).join(' ');
// eslint-disable-next-line no-console
console.log(new ethers.utils.Interface(JSON.parse(abi)).format(ethers.utils.FormatTypes.full));
