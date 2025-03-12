import { InfoIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { Tooltip } from '@snx-v3/Tooltip';
import { useWallet } from '@snx-v3/useBlockchain';
import { useSynthBalances } from '@snx-v3/useSynthBalances';
import { useUnwrapAllSynths } from '@snx-v3/useUnwrapAllSynths';
import { wei } from '@synthetixio/wei';
import React from 'react';
import { SynthRow } from './SynthRow';
import { SynthsLoading } from './SynthsLoading';
import { SynthsUnwrapModal } from './SynthsUnwrapModal';

export function Synths() {
  const { activeWallet } = useWallet();
  const walletAddress = activeWallet?.address;

  const { data: synthBalances, isPending: isPendingSynthBalances } = useSynthBalances();
  const { exec: unwrapAll, txnState } = useUnwrapAllSynths();

  const filteredSynths = React.useMemo(() => {
    if (!synthBalances || !synthBalances.length) {
      return;
    }
    return synthBalances
      .filter(({ balance }) => balance.gt(wei(0.01))) // ignore the dust
      .sort((a, b) => a.synth.symbol.localeCompare(b.synth.symbol))
      .sort((a, b) => b.balance.toNumber() - a.balance.toNumber());
  }, [synthBalances]);

  return (
    <TableContainer>
      <SynthsUnwrapModal txnStatus={txnState.txnStatus} txnHash={txnState.txnHash} />
      <Flex alignItems="center" justifyContent="space-between">
        <Heading fontSize="18px" fontWeight={700} lineHeight="28px" color="gray.50" mb={3}>
          Synths
        </Heading>
        <Button
          size="sm"
          variant="solid"
          isDisabled={!(synthBalances && synthBalances.some(({ balance }) => balance.gt(0)))}
          _disabled={{
            bg: 'gray.900',
            backgroundImage: 'none',
            color: 'gray.500',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
          data-cy="unwrap synths submit"
          onClick={() => {
            window?._paq?.push([
              'trackEvent',
              'liquidity',
              'v3_staking',
              `submit_unwrap_synths_v3`,
            ]);
            unwrapAll();
          }}
        >
          Unwrap
        </Button>
      </Flex>
      <Table variant="simple" data-cy="synths table">
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
              Token
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
            >
              Synth balance
              <Tooltip label="Total synth balance in your wallet">
                <InfoIcon ml={1} mb="1px" />
              </Tooltip>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {!walletAddress ? (
            <Tr>
              <Td display="flex" alignItems="left" px={4} border="none" w="100%">
                <Text color="gray.500" fontFamily="heading" fontSize="xs">
                  Please connect wallet to view synths
                </Text>
              </Td>
            </Tr>
          ) : null}
          {walletAddress && isPendingSynthBalances ? <SynthsLoading /> : null}
          {!isPendingSynthBalances && filteredSynths && filteredSynths.length === 0 ? (
            <Tr>
              <Td display="flex" alignItems="left" px={4} border="none" w="100%">
                <Text color="gray.500" fontFamily="heading" fontSize="xs">
                  You do not have any synths
                </Text>
              </Td>
            </Tr>
          ) : null}

          {filteredSynths
            ? filteredSynths.map(({ synth, balance }, i) => (
                <Tr
                  key={synth.symbol}
                  borderBottomWidth={i === filteredSynths.length - 1 ? 'none' : '1px'}
                >
                  <SynthRow synth={synth} balance={balance} />
                </Tr>
              ))
            : null}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
