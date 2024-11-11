import { InfoIcon } from '@chakra-ui/icons';
import { Flex, Text, Tooltip } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { useNetwork } from '@snx-v3/useBlockchain';
import { type Wei } from '@synthetixio/wei';
import { ChangeStat } from '../ChangeStat';
import { DebtAmount } from '../Positions/PositionsTable/DebtAmount';

export function DebtStats({
  debt,
  newDebt,
  hasChanges,
}: {
  debt: Wei;
  newDebt: Wei;
  hasChanges: boolean;
}) {
  const { network } = useNetwork();
  const isBase = isBaseAndromeda(network?.id, network?.preset);
  return (
    <BorderBox p={4} flex="1" flexDirection="row" bg="navy.700">
      <Flex flexDirection="column" width="100%">
        <Flex alignItems="center" mb="4px">
          <Text color="gray.500" fontSize="xs" fontFamily="heading" lineHeight="16px">
            Debt
          </Text>
          <Tooltip
            label={
              isBase ? (
                "Your portion of the pool's total debt, which fluctuates based on trader performance and market conditions"
              ) : (
                <Text>
                  Debt consists of:
                  <br />
                  - Your portion of the pool&apos;s total debt, which fluctuates based on trader
                  performance and market conditions
                  <br />- The amount you&apos;ve borrowed against your collateral without incurring
                  interest
                </Text>
              )
            }
            textAlign="start"
            py={2}
            px={3}
          >
            <Flex height="12px" width="12px" ml="4px" alignItems="center" justifyContent="center">
              <InfoIcon color="gray.500" height="10px" width="10px" />
            </Flex>
          </Tooltip>
        </Flex>
        <Flex width="100%">
          <ChangeStat
            value={debt}
            newValue={newDebt}
            formatFn={(val: Wei) => <DebtAmount debt={val} as="span" />}
            hasChanges={hasChanges}
            data-cy="debt stats collateral"
          />
        </Flex>
      </Flex>
    </BorderBox>
  );
}
