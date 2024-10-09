import { InfoIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { Box, Flex, Text, Tooltip } from '@chakra-ui/react';
import { FC } from 'react';
import { CRatioAmount } from './CRatioAmount';
import { CRatioBadge } from './CRatioBadge';
import { getHealthVariant, getProgressSize, ratioIsMaxUInt } from './CRatioBar.utils';
import { LineWithText } from './LineWithText';

export const CRatioBarUi: FC<{
  liquidationCratio: number;
  targetCratio: number;
  currentCRatio: number;
  newCratio?: number;
  hasChanges: boolean;
}> = ({ targetCratio, liquidationCratio, currentCRatio, newCratio, hasChanges }) => {
  const variant = hasChanges
    ? getHealthVariant({
        targetCratio: targetCratio,
        liquidationCratio: liquidationCratio,
        cRatio: newCratio,
      })
    : getHealthVariant({
        targetCratio: targetCratio,
        liquidationCratio: liquidationCratio,
        cRatio: currentCRatio,
      });

  return (
    <Flex flexDir="column" gap="2">
      <Text color="gray.500" fontSize="xs">
        C-Ratio{' '}
        <Tooltip
          textAlign="left"
          label="C-ratio is a dynamic number that represents a ratio between your locked collateral and your debt"
          p="3"
        >
          <InfoIcon w="10px" h="10px" />
        </Tooltip>
      </Text>
      <Flex
        color="white"
        fontWeight={800}
        fontSize="20px"
        flexDir={['column', 'row']}
        alignItems="center"
        gap={2}
      >
        <CRatioAmount value={currentCRatio} />

        {hasChanges ? (
          <>
            <span>&rarr;</span>
            <Text>
              {!newCratio || newCratio < 0
                ? 'N/A'
                : ratioIsMaxUInt(newCratio)
                  ? 'Infinite'
                  : `${newCratio.toFixed(2)} %`}
            </Text>
          </>
        ) : null}

        {(hasChanges ? newCratio || 0 : currentCRatio) !== 0 ? (
          <CRatioBadge
            cRatio={hasChanges ? newCratio || 0 : currentCRatio}
            liquidationCratio={liquidationCratio}
            targetCratio={targetCratio}
          />
        ) : null}
      </Flex>

      <Box position="relative" height="100px" width="full" overflowX="hidden">
        <>
          <LineWithText
            left="25%"
            text={
              liquidationCratio ? `Liquidation < ${liquidationCratio.toFixed(0)}%` : 'Liquidation'
            }
            tooltipText="Point at which your Position gets liquidated"
          />
          <LineWithText
            left="75%"
            text={
              targetCratio
                ? `Borrowing Ratio ${
                    ratioIsMaxUInt(targetCratio) ? 'Infinite' : targetCratio.toFixed(0)
                  }%`
                : 'Borrowing Ratio'
            }
            tooltipText="Min point at which you can borrow assets"
          />
        </>
        <Box
          bg={variant}
          height="12px"
          position="absolute"
          left={`${getProgressSize({
            cRatio: newCratio,
            targetCratio: targetCratio,
            liquidationCratio: liquidationCratio,
          })}%`}
          top={0}
          bottom={0}
          margin="auto"
          display={newCratio === 0 ? 'none' : 'block'}
        >
          {currentCRatio > 0 ? (
            <>
              <TriangleDownIcon
                position="absolute"
                right={0}
                top={0}
                transform="translate(50%,-100%)"
                color={variant}
              />
              <TriangleUpIcon
                position="absolute"
                right={0}
                bottom={0}
                transform="translate(50%,100%)"
                color={variant}
              />
            </>
          ) : null}
        </Box>
      </Box>
    </Flex>
  );
};

export const CRatioBar: FC<{
  liquidationCratio?: number;
  targetCratio?: number;
  currentCRatio?: number;
  newCratio?: number;
  hasChanges: boolean;
}> = ({ newCratio, currentCRatio, targetCratio, liquidationCratio, hasChanges }) => {
  return (
    <CRatioBarUi
      liquidationCratio={liquidationCratio || 100}
      targetCratio={targetCratio || 100}
      currentCRatio={currentCRatio || 0}
      newCratio={newCratio}
      hasChanges={hasChanges}
    />
  );
};
