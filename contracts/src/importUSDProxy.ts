// !!! DO NOT EDIT !!! Automatically generated file

import type { USDProxy as USDProxy1Main } from './1-main/USDProxy';
import type { USDProxy as USDProxy10Main } from './10-main/USDProxy';
import type { USDProxy as USDProxy11155111Main } from './11155111-main/USDProxy';
import type { USDProxy as USDProxy13370Main } from './13370-main/USDProxy';
import type { USDProxy as USDProxy420Main } from './420-main/USDProxy';
import type { USDProxy as USDProxy5Main } from './5-main/USDProxy';
import type { USDProxy as USDProxy8453Andromeda } from './8453-andromeda/USDProxy';
import type { USDProxy as USDProxy84531Andromeda } from './84531-andromeda/USDProxy';
import type { USDProxy as USDProxy84531Main } from './84531-main/USDProxy';
import type { USDProxy as USDProxy84532Andromeda } from './84532-andromeda/USDProxy';

export type USDProxyType =
  | USDProxy1Main
  | USDProxy10Main
  | USDProxy11155111Main
  | USDProxy13370Main
  | USDProxy420Main
  | USDProxy5Main
  | USDProxy8453Andromeda
  | USDProxy84531Andromeda
  | USDProxy84531Main
  | USDProxy84532Andromeda;

export async function importUSDProxy(chainId: number, preset: string = 'main') {
  switch (`${chainId}-${preset}`) {
    case '1-main':
      return import('./1-main/USDProxy');
    case '10-main':
      return import('./10-main/USDProxy');
    case '11155111-main':
      return import('./11155111-main/USDProxy');
    case '13370-main':
      return import('./13370-main/USDProxy');
    case '420-main':
      return import('./420-main/USDProxy');
    case '5-main':
      return import('./5-main/USDProxy');
    case '8453-andromeda':
      return import('./8453-andromeda/USDProxy');
    case '84531-andromeda':
      return import('./84531-andromeda/USDProxy');
    case '84531-main':
      return import('./84531-main/USDProxy');
    case '84532-andromeda':
      return import('./84532-andromeda/USDProxy');
    default:
      throw new Error(`Unsupported chain ${chainId} for USDProxy`);
  }
}
