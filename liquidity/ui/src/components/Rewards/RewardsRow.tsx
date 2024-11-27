import { Fade, Flex, Link, Td, Text, Tr } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { etherscanLink } from '@snx-v3/etherscanLink';
import { truncateAddress } from '@snx-v3/formatters';
import { Tooltip } from '@snx-v3/Tooltip';
import { useNetwork } from '@snx-v3/useBlockchain';
import Wei, { wei } from '@synthetixio/wei';
import { TokenIcon } from '../TokenIcon/TokenIcon';

interface RewardsRowInterface {
  displaySymbol?: string;
  claimableAmount: Wei; // The immediate amount claimable as read from the contracts
  lifetimeClaimed: number;
  distributorAddress: string;
}

export const RewardsRow = ({
  displaySymbol,
  claimableAmount,
  lifetimeClaimed,
  distributorAddress,
}: RewardsRowInterface) => {
  const { network } = useNetwork();

  return (
    <>
      <Tr>
        <Td display="flex" alignItems="center" px={4} py={3} border="none" w="100%">
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
        <Td alignItems="center" px={4} py={3} border="none">
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
      </Tr>
    </>
  );
};
