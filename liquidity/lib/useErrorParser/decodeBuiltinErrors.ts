import { ethers } from 'ethers';

export function decodeBuiltinErrors(data: string) {
  let sighash = ethers.utils.id('Panic(uint256)').slice(0, 10);
  if (data.startsWith(sighash)) {
    // this is the `Panic` builtin opcode
    const reason = ethers.utils.defaultAbiCoder.decode(['uint256'], '0x' + data.slice(10))[0];
    switch (reason.toNumber()) {
      case 0x00:
        return { name: 'Panic("generic/unknown error")', sighash, args: [{ reason }] };
      case 0x01:
        return { name: 'Panic("assertion failed")', sighash, args: [{ reason }] };
      case 0x11:
        return { name: 'Panic("unchecked underflow/overflow")', sighash, args: [{ reason }] };
      case 0x12:
        return { name: 'Panic("division by zero")', sighash, args: [{ reason }] };
      case 0x21:
        return { name: 'Panic("invalid number to enum conversion")', sighash, args: [{ reason }] };
      case 0x22:
        return {
          name: 'Panic("access to incorrect storage byte array")',
          sighash,
          args: [{ reason }],
        };
      case 0x31:
        return { name: 'Panic("pop() empty array")', sighash, args: [{ reason }] };
      case 0x32:
        return { name: 'Panic("out of bounds array access")', sighash, args: [{ reason }] };
      case 0x41:
        return { name: 'Panic("out of memory")', sighash, args: [{ reason }] };
      case 0x51:
        return { name: 'Panic("invalid internal function")', sighash, args: [{ reason }] };
      default:
        return { name: 'Panic("unknown")', sighash, args: [{ reason }] };
    }
  }
  sighash = ethers.utils.id('Error(string)').slice(0, 10);
  if (data.startsWith(sighash)) {
    // this is the `Error` builtin opcode
    const reason = ethers.utils.defaultAbiCoder.decode(['string'], '0x' + data.slice(10));
    return { name: `Error("${reason}")`, sighash, args: [{ reason }] };
  }

  return;
}
