import { Amount } from '@snx-v3/Amount';
import { wei } from '@synthetixio/wei';
import { FC } from 'react';
import { ratioIsMaxUInt } from './CRatioBar.utils';

export const CRatioAmount: FC<{
  value: number;
}> = ({ value }) => {
  if (!value || value < 0) {
    return <>N/A</>;
  }

  if (ratioIsMaxUInt(value)) {
    return <>Infinite</>;
  }

  return <Amount value={wei(Math.round(value))} suffix="%" />;
};
