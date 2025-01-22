import { Alert, AlertIcon, AlertProps, Link, Text } from '@chakra-ui/react';
import { makeSearch, type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { type Wei } from '@synthetixio/wei';

export function CollateralAlert({ tokenBalance, ...props }: { tokenBalance: Wei } & AlertProps) {
  const [, setParams] = useParams<PositionPageSchemaType>();
  return (
    <Alert borderLeftColor="cyan.500" borderRadius="6px" {...props}>
      <AlertIcon color="cyan.500" />
      <Text color="white" fontFamily="heading" fontSize="16px" lineHeight="24px">
        You have a {tokenBalance.toString(2)} SNX active staking position on V2.{' '}
        <Link
          color="cyan.500"
          href={`?${makeSearch({ migrate: 'snx' })}`}
          onClick={(e) => {
            e.preventDefault();
            setParams({ migrate: 'snx' });
          }}
        >
          Migrate to V3
        </Link>
      </Text>
    </Alert>
  );
}
