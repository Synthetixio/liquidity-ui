import { importPositionManager } from './importPositionManager';

export async function importClosePosition(
  chainId?: number,
  preset?: string
): Promise<{ address: string; abi: string[] }> {
  return importPositionManager(chainId, preset);
}
