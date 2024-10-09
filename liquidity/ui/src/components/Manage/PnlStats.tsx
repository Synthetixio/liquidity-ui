import { InfoIcon } from '@chakra-ui/icons';
import { Flex, Text } from '@chakra-ui/react';
import { BorderBox } from '@snx-v3/BorderBox';
import { currency } from '@snx-v3/format';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { Tooltip } from '@snx-v3/Tooltip';
import { useNetwork } from '@snx-v3/useBlockchain';
import { type Wei } from '@synthetixio/wei';
import { ChangeStat } from '../ChangeStat';

export function PnlStats({
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
    <BorderBox p={4} flex="1" flexDirection="row" bg="navy.700" justifyContent="space-between">
      <Flex flexDirection="column" width="100%">
        <Flex alignItems="center" mb="4px">
          <Text color="gray.500" fontSize="xs" fontFamily="heading" lineHeight="16px">
            PnL
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
              <InfoIcon color="white" height="9px" width="9px" />
            </Flex>
          </Tooltip>
        </Flex>
        <Flex width="100%">
          <ChangeStat
            value={debt.mul(-1)}
            newValue={newDebt.mul(-1)}
            formatFn={(val: Wei) =>
              currency(val, {
                currency: 'USD',
                style: 'currency',
                maximumFractionDigits: 4,
              })
            }
            withColor
            hasChanges={hasChanges}
          />
        </Flex>
      </Flex>
    </BorderBox>
  );
}
