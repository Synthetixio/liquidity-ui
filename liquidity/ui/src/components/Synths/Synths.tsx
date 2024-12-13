import { InfoIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
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
      .map(({ synth, synthBalance, tokenBalance }) => ({
        synthBalance,
        tokenBalance,
        symbol: synth.token.symbol,
        name: synth.token.name,
        ...tokenOverrides[synth.token.address],
      }))
      .filter(({ synthBalance, tokenBalance }) => synthBalance.gt(0) || tokenBalance.gt(0))
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
      .sort((a, b) => b.tokenBalance.toNumber() - a.tokenBalance.toNumber())
      .sort((a, b) => b.synthBalance.toNumber() - a.synthBalance.toNumber());
  }, [synthBalances]);

  return (
    <TableContainer
      maxW="100%"
      mt={4}
      borderColor="gray.900"
      borderWidth="1px"
      borderRadius="5px"
      p={6}
      sx={{
        borderCollapse: 'separate !important',
        borderSpacing: 0,
      }}
      bg="navy.700"
    >
      <SynthsUnwrapModal txnStatus={txnState.txnStatus} txnHash={txnState.txnHash} />
      <Flex alignItems="center" justifyContent="space-between">
        <Text color="gray.500" fontFamily="heading" lineHeight="4" fontSize="xs" mb="8px">
          &nbsp;
        </Text>
        <Button
          size="sm"
          variant="solid"
          isDisabled={
            !(synthBalances && synthBalances.some(({ synthBalance }) => synthBalance.gt(0)))
          }
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
      <Table variant="simple">
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
              <Tooltip label="Total synth balance in your wallet">
                <InfoIcon ml={1} mb="1px" />
              </Tooltip>
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
              Wallet balance
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {isPendingSynthBalances ? <SynthsLoading /> : null}
          {!isPendingSynthBalances && filteredSynths && filteredSynths.length === 0 ? (
            <Tr>
              <Td display="flex" alignItems="left" px={4} border="none" w="100%">
                <Text color="gray.500" fontFamily="heading" fontSize="xs">
                  No Synths Available
                </Text>
              </Td>
            </Tr>
          ) : null}

          {filteredSynths
            ? filteredSynths.map(({ symbol, name, synthBalance, tokenBalance }, i) => (
                <Tr
                  key={symbol}
                  borderBottomWidth={i === filteredSynths.length - 1 ? 'none' : '1px'}
                >
                  <SynthRow
                    symbol={symbol}
                    name={name}
                    synthBalance={synthBalance}
                    tokenBalance={tokenBalance}
                  />
                </Tr>
              ))
            : null}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
