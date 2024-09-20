import { Button, Fade, Flex, Link, Td, Text, Tr } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { etherscanLink } from '@snx-v3/etherscanLink';
import { truncateAddress } from '@snx-v3/formatters';
import { Tooltip } from '@snx-v3/Tooltip';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useParams } from '@snx-v3/useParams';
import Wei, { wei } from '@synthetixio/wei';
import { TokenIcon } from '../TokenIcon';
import { RewardsModal } from './RewardsModal';
import { useClaimUnwrapRewards } from '../../../../lib/useClaimUnwrapRewards';
import { useCallback } from 'react';

interface RewardsRowInterface {
  displaySymbol?: string;
  claimableAmount: Wei; // The immediate amount claimable as read from the contracts
  lifetimeClaimed: number;
  distributorAddress: string;
  payoutTokenAddress: string;
}

export const RewardsRow = ({
  displaySymbol,
  claimableAmount,
  lifetimeClaimed,
  distributorAddress,
  payoutTokenAddress,
}: RewardsRowInterface) => {
  const { accountId, collateralSymbol, poolId } = useParams();

  const { data: collateralData } = useCollateralType(collateralSymbol);
  const { network } = useNetwork();

  const { exec: claimUnWrap, txnState } = useClaimUnwrapRewards({
    poolId: poolId || '',
    collateralAddress: collateralData?.tokenAddress || '',
    accountId: accountId,
    distributorAddress: distributorAddress,
    amount: claimableAmount,
    payoutTokenAddress,
  });

  const onClick = useCallback(() => {
    claimUnWrap();
  }, [claimUnWrap]);

  const { txnStatus, txnHash } = txnState;

  return (
    <>
      <RewardsModal
        amount={claimableAmount.toNumber()}
        collateralSymbol={displaySymbol}
        txnStatus={txnStatus}
        txnHash={txnHash}
      />
      <Tr>
        <Td display="flex" alignItems="center" px="14px" border="none" w="100%">
          <Fade in>
            <TokenIcon height={30} width={30} symbol={displaySymbol} />
          </Fade>
          <Fade in>
            <Flex flexDirection="column" ml="12px">
              <Link
                href={etherscanLink({
                  chain: network?.name || 'mainnet',
                  address: distributorAddress,
                })}
                target="_blank"
              >
                <Tooltip label={`Distributed by ${truncateAddress(distributorAddress)}`}>
                  <Text
                    color="gray.50"
                    fontSize="14px"
                    fontFamily="heading"
                    fontWeight={500}
                    lineHeight="20px"
                  >
                    {displaySymbol}
                  </Text>
                </Tooltip>
              </Link>
            </Flex>
          </Fade>
        </Td>
        <Td alignItems="center" px="14px" border="none">
          <Fade in>
            <Text
              color="gray.50"
              fontSize="14px"
              fontFamily="heading"
              fontWeight={500}
              lineHeight="20px"
            >
              <Amount value={claimableAmount} showTooltip />
            </Text>
            {lifetimeClaimed > 0 && (
              <Text color="gray.500" fontSize="12px" fontFamily="heading" lineHeight="16px">
                <Tooltip label="Total claimed over lifetime">Lifetime: &nbsp;</Tooltip>
                <Amount value={wei(lifetimeClaimed)} />
              </Text>
            )}
          </Fade>
        </Td>
        <Td border="none" px="0px">
          <Fade in>
            <Button
              w="100%"
              size="sm"
              variant="solid"
              isDisabled={claimableAmount.eq(0)}
              _disabled={{
                bg: 'gray.900',
                backgroundImage: 'none',
                color: 'gray.500',
                opacity: 0.5,
                cursor: 'not-allowed',
              }}
              onClick={onClick}
            >
              {claimableAmount.gt(0) || !lifetimeClaimed ? 'Claim' : 'Claimed'}
            </Button>
          </Fade>
        </Td>
      </Tr>
    </>
  );
};
