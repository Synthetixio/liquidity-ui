import { InfoIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { Box, Flex, Progress, Text, Tooltip } from '@chakra-ui/react';
import { CRatioAmount } from './CRatioAmount';
import { CRatioBadge } from './CRatioBadge';
import { getHealthVariant, getProgressSize, ratioIsMaxUInt } from './CRatioBar.utils';
import { LineWithText } from './LineWithText';

export function CRatioBar({
  newCRatio,
  currentCRatio,
  targetCratio,
  liquidationCratio,
  hasChanges,
}: {
  liquidationCratio: number;
  targetCratio: number;
  currentCRatio: number;
  newCRatio: number;
  hasChanges: boolean;
}) {
  const variant = hasChanges
    ? getHealthVariant({
        targetCratio: targetCratio,
        liquidationCratio: liquidationCratio,
        cRatio: newCRatio,
      })
    : getHealthVariant({
        targetCratio: targetCratio,
        liquidationCratio: liquidationCratio,
        cRatio: currentCRatio,
      });

  const newBarSize = getProgressSize({
    cRatio: newCRatio,
    targetCratio: targetCratio,
    liquidationCratio: liquidationCratio,
  });

  const currentBarSize = getProgressSize({
    cRatio: currentCRatio,
    targetCratio: targetCratio,
    liquidationCratio: liquidationCratio,
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
              {!newCRatio || newCRatio < 0
                ? 'N/A'
                : ratioIsMaxUInt(newCRatio)
                  ? 'Infinite'
                  : `${newCRatio.toFixed(2)} %`}
            </Text>
          </>
        ) : null}

        {(hasChanges ? newCRatio || 0 : currentCRatio) !== 0 ? (
          <CRatioBadge
            cRatio={hasChanges ? newCRatio || 0 : currentCRatio}
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

        <Box top={0} bottom={0} height="12px" position="absolute" margin="auto" width="100%">
          <Progress
            variant={
              currentBarSize < newBarSize && !(currentBarSize >= 100 && newBarSize > 100)
                ? `update-${variant}`
                : variant
            }
            top={0}
            bottom={0}
            height="12px"
            position="absolute"
            margin="auto"
            left="0"
            width="100%"
            value={Math.min(newBarSize, currentBarSize)}
          />
          <Progress
            variant={currentBarSize >= newBarSize ? `update-${variant}` : variant}
            top={0}
            bottom={0}
            height="12px"
            position="absolute"
            margin="auto"
            width="100%"
            left={`${Math.min(newBarSize, currentBarSize)}%`}
            display={newCRatio === 0 ? 'none' : 'block'}
            value={Math.abs(newBarSize - currentBarSize)}
          />
        </Box>

        <Box
          bg={variant}
          height="12px"
          position="absolute"
          left={`${newBarSize}%`}
          top={0}
          bottom={0}
          margin="auto"
          display={newCRatio === 0 ? 'none' : 'block'}
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
}
