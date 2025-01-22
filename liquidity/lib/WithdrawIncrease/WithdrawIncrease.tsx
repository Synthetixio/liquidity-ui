import { Alert, AlertIcon, Text } from '@chakra-ui/react';
import { useAccountCollateralUnlockDate } from '@snx-v3/useAccountCollateralUnlockDate';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';

export function WithdrawIncrease() {
  return (
    <Alert borderRadius="6px" status="warning" mb="6">
      <AlertIcon />
      <Text>This action will reset the withdrawal waiting period to 24 hours</Text>
    </Alert>
  );
}

export function DepositsIncreaseTimeout() {
  const [params] = useParams<PositionPageSchemaType>();
  const { data: accountCollateralUnlockDate } = useAccountCollateralUnlockDate({
    accountId: params.accountId,
  });

  return (
    <Alert borderRadius="6px" status="warning" mb="6">
      <AlertIcon />
      {accountCollateralUnlockDate && accountCollateralUnlockDate.getTime() > Date.now() ? (
        <Text>
          All new deposits have a 24 hour withdrawal waiting period. This action will reset your
          active withdrawal waiting period to 24 hours.
        </Text>
      ) : (
        <Text>All new deposits have a 24 hour withdrawal waiting period.</Text>
      )}
    </Alert>
  );
}
