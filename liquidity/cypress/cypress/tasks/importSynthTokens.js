import { importSynthTokens as importer } from '@snx-v3/contracts';

export async function importSynthTokens() {
  return importer(process.env.CYPRESS_CHAIN_ID, process.env.CYPRESS_PRESET);
}
