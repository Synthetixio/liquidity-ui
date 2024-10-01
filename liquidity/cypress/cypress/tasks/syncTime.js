import { ethers } from 'ethers';

export async function wait(ms) {
  return new Promise((resolve) => {
    console.log('syncTime', 'Wait', { ms });
    setTimeout(() => {
      console.log('syncTime', 'Done waiting', { ms });
      resolve();
    }, ms);
  });
}

export async function getTimes(provider) {
  const blockNumber = await provider.send('eth_blockNumber', []);
  const block = await provider.send('eth_getBlockByNumber', [blockNumber, false]);
  const blockTimestamp = parseInt(block.timestamp, 16);
  const now = Math.floor(Date.now() / 1000);
  return { blockNumber, blockTimestamp, now };
}

export async function syncTime() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.RPC_URL || 'http://127.0.0.1:8545'
  );

  const oldTimes = await getTimes(provider);
  console.log('syncTime', {
    diff: oldTimes.now - oldTimes.blockTimestamp,
    oldRealtime: new Date(oldTimes.now * 1000),
    oldBlockNumber: oldTimes.blockNumber,
    oldBlockTimestamp: new Date(oldTimes.blockTimestamp * 1000),
  });

  if (oldTimes.blockTimestamp === oldTimes.now) {
    console.log('syncTime', 'SKIP');
    return;
  }

  if (oldTimes.blockTimestamp < oldTimes.now) {
    // We restored from snapshot, or working with an old fork, so block timestamp is out of date
    await provider.send('anvil_setTime', [oldTimes.now - 1]);
    await provider.send('evm_mine', []);
  }

  if (oldTimes.blockTimestamp > oldTimes.now) {
    await provider.send('anvil_setTime', [oldTimes.now - 1]);
    await provider.send('evm_mine', []);
  }

  const newTimes = await getTimes(provider);
  console.log('syncTime', {
    diff: newTimes.now - newTimes.blockTimestamp,
    newRealtime: new Date(newTimes.now * 1000),
    newBlockNumber: newTimes.blockNumber,
    newBlockTimestamp: new Date(newTimes.blockTimestamp * 1000),
  });
}
