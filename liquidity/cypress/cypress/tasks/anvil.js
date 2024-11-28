import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';

let anvilProcess;

const execPromised = promisify(exec);

export async function startAnvil({ chainId, forkUrl, block }) {
  console.log('pkill anvil');
  await execPromised('pkill anvil').catch(() => console.log('No other anvil processes to kill'));
  const cmd = 'anvil';
  const args = [
    '--auto-impersonate',
    '--chain-id',
    chainId,
    '--fork-url',
    forkUrl,
    // '--no-rate-limit',
    // '--steps-tracing',
    '--fork-block-number',
    block,
    '--memory-limit',
    '12884901888', // 12G
  ];
  console.log(`Starting anvil:`, cmd, args.join(' '));
  return new Promise(async (resolve, reject) => {
    let resolved = false;

    anvilProcess = spawn(cmd, args, { stdio: 'inherit' });
    anvilProcess.on('error', (error) => {
      resolved = true;
      reject(error);
    });
    anvilProcess.on('close', (code) => {
      if (code !== 0) {
        resolved = true;
        return reject(new Error(`Anvil process exited with code ${code}`));
      }
    });

    const url = 'http://127.0.0.1:8545';
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'eth_chainId', params: [], id: 1, jsonrpc: '2.0' }),
    };

    const maxRetries = 30;
    const retryDelay = 1000; // 20 seconds

    for (let attempts = 0; attempts < maxRetries; attempts++) {
      if (resolved) {
        return;
      }
      console.log(`Waiting for anvil ${url} [${attempts}]`);
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          resolved = true;
          return resolve(anvilProcess);
        }
      } catch {
        // Ignore error and retry
      }
      await new Promise((next) => setTimeout(next, retryDelay));
    }
    reject(new Error(`Failed to connect to Anvil's HTTP endpoint after ${maxRetries} attempts.`));
  });
}

export async function stopAnvil() {
  return new Promise((resolve) => {
    if (anvilProcess) {
      anvilProcess.kill();
      resolve('Anvil stopped');
    }
  });
}
