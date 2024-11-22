import { importSynthTokens } from '@snx-v3/contracts';

export async function getSynthConfig({ symbol }) {
  const synthConfigs = await importSynthTokens(Cypress.env('chainId'), Cypress.env('preset'));
  const synthConfig = synthConfigs.find(
    (c) => c?.token?.symbol?.toLowerCase() === symbol.toLowerCase()
  );
  if (!synthConfig) {
    throw new Error(`Synth config for "${symbol}" does not exist`);
  }
  return synthConfig;
}
