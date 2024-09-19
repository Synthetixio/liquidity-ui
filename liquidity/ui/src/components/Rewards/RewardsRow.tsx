import { Button, Fade, Flex, Link, Td, Text, Tr } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { etherscanLink } from '@snx-v3/etherscanLink';
import { truncateAddress } from '@snx-v3/formatters';
import { Tooltip } from '@snx-v3/Tooltip';
import { ARBITRUM, useNetwork } from '@snx-v3/useBlockchain';
import { useClaimRewards } from '@snx-v3/useClaimRewards';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useParams } from '@snx-v3/useParams';
import Wei, { wei } from '@synthetixio/wei';
import { TokenIcon } from '../TokenIcon';
import { RewardsModal } from './RewardsModal';
import { useClaimUnwrapRewards } from '../../../../lib/useClaimUnwrapRewards';
import { useCallback, useMemo } from 'react';

interface RewardsRowInterface {
  symbol: string;
  displaySymbol?: string;
  claimableAmount: Wei; // The immediate amount claimable as read from the contracts
  lifetimeClaimed: number;
  address: string;
}

export const RewardsRow = ({
  symbol,
  displaySymbol,
  claimableAmount,
  lifetimeClaimed,
  address,
}: RewardsRowInterface) => {
  const { accountId, collateralSymbol, poolId } = useParams();

  const { data: collateralData } = useCollateralType(collateralSymbol);
  const { network } = useNetwork();

  const { exec: claim, txnState: txnState1 } = useClaimRewards(
    poolId || '',
    collateralData?.tokenAddress || '',
    accountId,
    address,
    claimableAmount.toNumber()
  );

  const { exec: claimUnWrap, txnState: txnState2 } = useClaimUnwrapRewards(
    poolId || '',
    collateralData?.tokenAddress || '',
    accountId,
    address,
    claimableAmount,
    symbol
  );

  const txnState = useMemo(
    () => (network?.id === ARBITRUM.id ? txnState2 : txnState1),
    [network?.id, txnState1, txnState2]
  );

  const onClick = useCallback(() => {
    if (network?.id === ARBITRUM.id) {
      claimUnWrap();
    } else {
      claim();
    }
  }, [claim, claimUnWrap, network?.id]);

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
                href={etherscanLink({ chain: network?.name || 'mainnet', address })}
                target="_blank"
              >
                <Tooltip label={`Distributed by ${truncateAddress(address)}`}>
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
