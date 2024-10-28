import { importSynthTokens } from '@snx-v3/contracts';

export async function getSynthConfig(symbol) {
  const synthConfigs = await importSynthTokens(
    process.env.CYPRESS_CHAIN_ID,
    process.env.CYPRESS_PRESET
  );
  for (const config of synthConfigs) {
    try {
      if (config.token.symbol.toLowerCase() === symbol.toLowerCase()) {
        return config;
      }
    } catch (e) {
      // nevermind
    }
  }
  throw new Error(`Collateral config for "${symbol}" does not exist`);
}
