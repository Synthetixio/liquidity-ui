import { formatDistanceToNow, intlFormat } from 'date-fns';

export const formatTimeToUnlock = (accountCollateralUnlockDate: Date | undefined) => {
  if (!accountCollateralUnlockDate || accountCollateralUnlockDate.getTime() <= Date.now()) {
    return undefined;
  }
  return formatDistanceToNow(accountCollateralUnlockDate, { addSuffix: true });
};

export const unlockDateString = (accountCollateralUnlockDate: Date | undefined) => {
  if (!accountCollateralUnlockDate || accountCollateralUnlockDate.getTime() <= Date.now()) {
    return undefined;
  }

  return intlFormat(accountCollateralUnlockDate, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
};
