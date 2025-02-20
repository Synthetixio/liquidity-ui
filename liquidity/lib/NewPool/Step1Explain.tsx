import {
  Alert,
  AlertIcon,
  Button,
  Collapse,
  Flex,
  Image,
  Link,
  Text,
  VStack,
  Box,
} from '@chakra-ui/react';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { makeSearch, type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import React from 'react';
import accountIcon from './account.svg';
import { formatCRatio } from './formatCRatio';
import lockIcon from './lock.svg';
import migrateIcon from './migrate.svg';
import { useTargetCRatio } from './useTargetCRatio';

export function Step1Explain({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [params, setParams] = useParams<PositionPageSchemaType>();
  const { data: targetCRatio } = useTargetCRatio();

  const { data: collateralType } = useCollateralType('SNX');
  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  return (
    <VStack gap={6} align="start">
      <Text fontWeight="700">Migrating to Delegated Staking consists of:</Text>
      <Flex flexDir="column" gap={2.5} fontSize="14px" fontWeight="400">
        <Flex alignItems="center" gap={2.5}>
          <Flex width={4}>
            <Image src={accountIcon} />
          </Flex>
          <Text flex={1}>
            Delegating your staking account to the Synthetix Treasury (see:{' '}
            <Link isExternal href="https://sips.synthetix.io/sips/sip-420/" color="cyan.500">
              SIP-420
            </Link>
            )
          </Text>
        </Flex>
        <Flex alignItems="center" gap={2.5}>
          <Flex width={4}>
            <Image src={migrateIcon} />
          </Flex>
          <Text flex={1}>
            Migration of your SNX Collateral (including escrowed SNX) and your debt to the Jubilee
            Pool on the Liquidity App
          </Text>
        </Flex>
        <Flex alignItems="center" gap={2.5}>
          <Flex width={4}>
            <Image src={lockIcon} />
          </Flex>
          <Text flex={1}>Lock of funds for 7 days</Text>
        </Flex>
      </Flex>

      <Collapse
        in={
          liquidityPosition &&
          liquidityPosition.cRatio.gt(0) &&
          liquidityPosition.cRatio.lt(targetCRatio)
        }
        animateOpacity
        unmountOnExit
      >
        <Alert status="info" borderRadius="6px">
          <AlertIcon />
          <Text fontSize="14px">
            Migration to the Jubilee Pool requires a C-Ratio of &gt;{formatCRatio(targetCRatio)}. If
            you are below {formatCRatio(targetCRatio)}, you must{' '}
            <Link
              textDecoration="underline"
              href={`?${makeSearch({
                page: 'position',
                collateralSymbol: 'SNX',
                manageAction: 'repay',
                accountId: params.accountId,
              })}`}
              onClick={(e) => {
                e.preventDefault();
                setParams({
                  page: 'position',
                  collateralSymbol: 'SNX',
                  manageAction: 'repay',
                  accountId: params.accountId,
                });
              }}
            >
              repay your debt
            </Link>{' '}
            before migration.
          </Text>
        </Alert>
      </Collapse>

      <VStack gap={3} width="100%">
        <Button width="100%" onClick={onConfirm}>
          Continue
        </Button>
        <Button width="100%" variant="outline" colorScheme="gray" onClick={onClose}>
          Back
        </Button>
      </VStack>
    </VStack>
  );
}
