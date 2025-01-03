import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, Divider, Skeleton, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLocks } from '@snx-v3/useLocks';
import { PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { wei } from '@synthetixio/wei';
import { intlFormat } from 'date-fns';
import React from 'react';

export const LockedCollateral: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [params] = useParams<PositionPageSchemaType>();

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
  const { data: locks, isPending: isPendingLocks } = useLocks(
    params?.accountId,
    collateralType?.address
  );

  return (
    <div>
      <Text color="gray.50" fontSize="20px" fontWeight={700}>
        <ArrowBackIcon cursor="pointer" onClick={onClose} mr={2} />
        Escrowed SNX
      </Text>
      <Divider my={4} />

      {collateralType?.symbol === 'SNX' && (
        <Text fontSize="14px" color="white">
          All SNX rewards on V2 are subject to a 12-month escrow time-lock. Escrowed SNX is
          <b> automatically locked </b> and will continue to earn rewards. After a 12-month lock,
          this SNX can be <b>unlocked and withdrawn</b>.
        </Text>
      )}

      <Table data-cy="locked-collateral-table" mt={2.5} variant="simple">
        <Thead>
          <Tr borderBottom="1px solid #2D2D38">
            <Th
              textTransform="unset"
              color="gray.600"
              border="none"
              fontFamily="heading"
              fontSize="12px"
              lineHeight="16px"
              letterSpacing={0.6}
              fontWeight={700}
              px={4}
              py={3}
            >
              Unlocking Date
            </Th>
            <Th
              textTransform="unset"
              color="gray.600"
              border="none"
              fontFamily="heading"
              fontSize="12px"
              lineHeight="16px"
              letterSpacing={0.6}
              fontWeight={700}
              px={4}
              py={3}
              textAlign="right"
            >
              {collateralType?.displaySymbol ?? params.collateralSymbol} Amount
            </Th>
          </Tr>
        </Thead>
        {collateralType && !isPendingLocks && locks ? (
          <Tbody>
            {locks.map((lock) => (
              <Tr key={lock.timestamp.toString()} borderBottom="1px solid #2D2D38">
                <Td px={4} py={5} border="none">
                  <Text fontWeight={500} color="white" fontSize="14px">
                    {intlFormat(lock.expirationDate, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </Td>
                <Td px={4} py={5} textAlign="right" border="none">
                  <Text fontWeight={500} color="white" fontSize="14px">
                    <Amount value={wei(lock.amount, Number(collateralType.decimals), true)} />
                  </Text>
                </Td>
              </Tr>
            ))}
          </Tbody>
        ) : null}
      </Table>

      {isPendingLocks ? <Skeleton mt={4} width="100%" height="30px" rounded="sm" /> : null}
      {!isPendingLocks && !locks?.length ? (
        <Text
          width="100%"
          textAlign="center"
          color="gray.500"
          fontWeight={500}
          fontSize="14px"
          my="4"
          pl="3"
        >
          No Escrowed {collateralType?.displaySymbol ?? params.collateralSymbol}
        </Text>
      ) : null}

      <Button onClick={onClose} mt={6} width="100%" variant="outline" colorScheme="gray">
        Close
      </Button>
    </div>
  );
};
