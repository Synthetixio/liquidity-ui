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
import { tokenOverrides } from '@snx-v3/constants';
import { Tooltip } from '@snx-v3/Tooltip';
import { useSynthBalances } from '@snx-v3/useSynthBalances';
import { useUnwrapAllSynths } from '@snx-v3/useUnwrapAllSynths';
import React from 'react';
import { SynthRow } from './SynthRow';
import { SynthsLoading } from './SynthsLoading';
import { SynthsUnwrapModal } from './SynthsUnwrapModal';

export function Synths() {
  const { data: synthBalances, isPending: isPendingSynthBalances } = useSynthBalances();
  const { exec: unwrapAll, txnState } = useUnwrapAllSynths();

  const filteredSynths = React.useMemo(() => {
    if (!synthBalances || !synthBalances.length) {
      return;
    }
    return synthBalances
      .map(({ synth, balance }) => ({
        balance,
        symbol: synth.token ? synth.token.symbol : synth.symbol,
        name: synth.token ? synth.token.name : synth.name,
        ...tokenOverrides[synth.token ? synth.token.address : synth.address],
      }))
      .filter(({ balance }) => balance.gt(0))
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
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
          onClick={() => unwrapAll()}
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
          {isPendingSynthBalances ? <SynthsLoading /> : null}
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
            ? filteredSynths.map(({ symbol, name, balance }, i) => (
                <Tr
                  key={symbol}
                  borderBottomWidth={i === filteredSynths.length - 1 ? 'none' : '1px'}
                >
                  <SynthRow symbol={symbol} name={name} balance={balance} />
                </Tr>
              ))
            : null}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
