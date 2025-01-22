import { ArrowUpIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Heading, Image, Link, Text } from '@chakra-ui/react';
import { Amount } from '@snx-v3/Amount';
import { getStatsUrl } from '@snx-v3/getStatsUrl';
import { LogoIcon } from '@snx-v3/icons';
import coinImage from '@snx-v3/Manage/coin.png';
import { NetworkIcon, useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { type PositionPageSchemaType, useParams } from '@snx-v3/useParams';
import { usePythPrice } from '@snx-v3/usePythPrice';
import { useTransferableSynthetix } from '@snx-v3/useTransferableSynthetix';
import { useVaultsData } from '@snx-v3/useVaultsData';
import { wei } from '@synthetixio/wei';
import numbro from 'numbro';
import React from 'react';

function InfoBox({ ...props }) {
  return (
    <Flex
      alignItems="center"
      borderWidth={1}
      borderRadius={4}
      px={2}
      py={0}
      gap={2}
      height="1.75em"
      color="gray.500"
      fontWeight="500"
      {...props}
    />
  );
}

export function NewPool() {
  const [params] = useParams<PositionPageSchemaType>();

  const { network } = useNetwork();
  const { data: vaultsData, isPending: isPendingVaultsData } = useVaultsData(network);

  const { data: collateralType } = useCollateralType('SNX');

  const vaultData = React.useMemo(() => {
    if (vaultsData && collateralType) {
      return vaultsData.find(
        (item) => item.collateralType.address.toLowerCase() === collateralType.address.toLowerCase()
      );
    }
  }, [collateralType, vaultsData]);

  const { data: liquidityPosition, isPending: isPendingLiquidityPosition } = useLiquidityPosition({
    accountId: params.accountId,
    collateralType,
  });

  const { data: transferrableSnx, isPending: isPendingTransferrableSnx } =
    useTransferableSynthetix();

  const { data: snxPrice, isPending: isPendingSnxPrice } = usePythPrice('SNX');

  return (
    <Flex
      direction="column"
      borderColor="gray.900"
      borderWidth="1px"
      borderRadius="5px"
      bg="navy.700"
      p={6}
      gap={9}
    >
      <Box>
        <Flex direction="row" flexWrap="wrap" justifyContent="space-between" alignItems="center">
          <Heading
            as={Flex}
            alignItems="center"
            gap={4}
            fontSize="20px"
            lineHeight="1.75rem"
            color="gray.50"
            fontWeight={700}
          >
            <LogoIcon />
            <Text>SNX Jubilee</Text>
          </Heading>

          <Flex direction="row" flexWrap="wrap" alignItems="center" gap={2}>
            <InfoBox>
              <NetworkIcon size="14px" networkId={network?.id} />
              <Text>{network?.label} Network</Text>
            </InfoBox>

            <InfoBox>
              <Text>Total TVL</Text>
              <Text color="gray.50">
                {isPendingVaultsData
                  ? '~'
                  : vaultData
                    ? numbro(vaultData.collateral.value.toNumber()).format({
                        trimMantissa: true,
                        thousandSeparated: true,
                        average: true,
                        mantissa: 1,
                        spaceSeparated: true,
                      })
                    : '-'}
              </Text>
            </InfoBox>

            <InfoBox
              as={Link}
              isExternal
              href={getStatsUrl(network?.id)}
              textDecoration="none"
              _hover={{ textDecoration: 'none' }}
              cursor="pointer"
            >
              <Text>More Stats</Text>
              <ArrowUpIcon transform="rotate(45deg)" />
            </InfoBox>
          </Flex>
        </Flex>
        <Text mt={3} color="gray.500">
          Deposit your SNX to earn a share of the protocol’s revenue
        </Text>
      </Box>

      <Flex
        direction={['column', 'row', 'row']}
        flexWrap="wrap"
        alignItems="top"
        justifyContent="stretch"
        gap={4}
      >
        <Flex flex={[1, 1, 2]} direction="row" flexWrap="wrap" gap={6}>
          <Flex minWidth="120px" direction="column" gap={3}>
            <Text color="gray.500">Deposited</Text>
            <Text color="gray.50" fontSize="1.25em">
              {isPendingLiquidityPosition ? '~' : null}
              {!isPendingLiquidityPosition && liquidityPosition ? (
                <Amount prefix="$" value={liquidityPosition.collateralValue} />
              ) : null}
            </Text>
          </Flex>
          <Flex minWidth="120px" direction="column" gap={3}>
            <Text color="gray.500">Loan</Text>
            <Text color="gray.50" fontSize="1.25em">
              {isPendingLiquidityPosition ? '~' : null}
              {!isPendingLiquidityPosition && liquidityPosition ? (
                <Amount prefix="$" value={liquidityPosition.debt} />
              ) : null}
            </Text>
          </Flex>
        </Flex>
        <Flex flex={[1, 1, 1]} minWidth="300px" direction="column" gap={3}>
          <Text color="gray.500">Available to deposit</Text>
          <Text color="gray.50" fontSize="1.25em">
            {isPendingTransferrableSnx || isPendingSnxPrice ? '~' : null}
            {!isPendingTransferrableSnx && !isPendingSnxPrice && transferrableSnx && snxPrice ? (
              <Amount
                prefix="$"
                value={transferrableSnx.transferable.mul(snxPrice)}
                suffix=" SNX"
              />
            ) : null}
          </Text>
          <Flex gap={3}>
            <Button
              width="50%"
              isDisabled={!(transferrableSnx && transferrableSnx.transferable.gt(0))}
            >
              Deposit
            </Button>
            <Button
              width="50%"
              isDisabled={!(liquidityPosition && liquidityPosition.availableCollateral.gt(0))}
            >
              Withdraw
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <Flex direction={{ base: 'column', sm: 'row', lg: 'row', xl: 'row' }} flexWrap="wrap" gap={4}>
        <Flex
          order={{ base: 2, sm: 1, lg: 1, xl: 1 }}
          flex={{ base: 1, sm: 2, lg: 2, xl: 2 }}
          width="100%"
          borderColor="gray.900"
          borderWidth="1px"
          borderRadius="5px"
          bg="navy.900"
          p={6}
          direction="column"
          gap={6}
        >
          <Flex direction="row" gap={6}>
            <Flex flex={{ base: 1, sm: 1, lg: 1, xl: 1 }} direction="column" width="200px" gap={6}>
              <Heading fontSize="20px" lineHeight="1.75rem" color="gray.50" fontWeight={700}>
                Yield
              </Heading>
            </Flex>
            <Flex flex={{ base: 1, sm: 2, lg: 2, xl: 2 }} direction="row" minWidth="400px" gap={6}>
              <Flex minWidth="120px" direction="column" gap={3}>
                <Text color="gray.500">Performance</Text>
                <Text color="gray.50" fontSize="1.25em">
                  N / A
                </Text>
              </Flex>
              <Flex minWidth="120px" direction="column" gap={3}>
                <Text color="gray.500">Rewards</Text>
                <Text color="gray.50" fontSize="1.25em">
                  N / A
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <Flex gap={6} direction={{ base: 'column', sm: 'column', lg: 'row', xl: 'row' }}>
            <Flex
              flex={{ base: 1, sm: 1, lg: 1, xl: 1 }}
              direction="column"
              width="200px"
              gap={6}
              justifyContent="center"
            >
              <GradientCircle />
            </Flex>
            <Flex
              flex={{ base: 1, sm: 2, lg: 2, xl: 2 }}
              direction="column"
              minWidth="400px"
              gap={6}
              borderColor="gray.900"
              borderWidth="1px"
              borderRadius="5px"
              p={3}
            >
              <Flex minWidth="120px" direction="column" gap={3}>
                <Text color="gray.500">Loan repaid</Text>
                <Box>
                  <Text as="span" color="gray.50" fontSize="1.25em">
                    <Amount prefix="$" value={wei(0)} />
                  </Text>
                  <Text as="span" color="gray.500" fontSize="1.25em">
                    <Amount prefix=" / $" value={wei(0)} />
                  </Text>
                </Box>
              </Flex>
              <Box>
                <LoanChart />
              </Box>
            </Flex>
          </Flex>
        </Flex>
        <Flex
          order={{ base: 1, sm: 1, lg: 1, xl: 1 }}
          flex={{ base: 1, sm: 1, lg: 1, xl: 1 }}
          width="100%"
          direction="column"
          borderColor="gray.900"
          borderWidth="1px"
          borderRadius="5px"
          p={3}
          gap={3}
          justifyContent="space-between"
        >
          <Flex direction="column" gap={3}>
            <Image rounded="8px" src={coinImage} width="100%" maxWidth="354px" />
            <Heading fontSize="20px" lineHeight="1.75rem" color="gray.50" fontWeight={700}>
              Debt Jubilee
            </Heading>
          </Flex>
          <Button isDisabled={true}>Migrate to Jubilee</Button>
        </Flex>
      </Flex>
    </Flex>
  );
}

const GradientCircle = ({ size = 200, strokeWidth = 1 }) => {
  const radius = (size - strokeWidth) / 2; // Calculate radius based on size and stroke width
  const center = size / 2; // Center of the circle

  return (
    <svg viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="circular-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34EDB3" />
          <stop offset="100%" stopColor="#00D1FF" />
        </linearGradient>
      </defs>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="url(#circular-gradient)"
        strokeWidth="1"
      />
      <text x={center} y={center} fill="#ffffff" fontSize="36" textAnchor="middle">
        10.1%
      </text>
      <text x={center} y={center + 30} fill="#9999ac" fontSize="18" textAnchor="middle">
        APR
      </text>
    </svg>
  );
};

// Quadratic Debt Decay Function: Calculates current debt at a given timestamp
const calculateLoan = (timestamp: number, initialLoan: number, totalTime: number): number => {
  // Ensure timestamp does not exceed totalTime
  const clampedTime = Math.min(timestamp, totalTime);

  // Quadratic decay formula: y = initialLoan * (1 - (t / totalTime)²)
  const normalizedTime = clampedTime / totalTime; // Scales time from 0 to 1
  return initialLoan * (1 - Math.pow(normalizedTime, 2)); // Quadratic decay
};

const LoanChart = () => {
  // Input values
  const LOAN = -500; // Initial debt (negative)
  const TIME = 1000; // Total duration in time units to reduce debt to 0
  const COUNT = 50; // Number of points for the chart (resolution)

  // Generate the points for the chart line
  const POINTS = React.useMemo(() => {
    const points = [];
    const interval = TIME / COUNT; // Time interval between points

    for (let i = 0; i <= COUNT; i++) {
      const x = (1000 / COUNT) * i; // Scale X values to fit within the SVG width (300px)
      const timestamp = interval * i; // Current time
      const value = calculateLoan(timestamp, LOAN, TIME);
      const y = (value / LOAN) * 300; // Scale Y values for SVG
      points.push({ x, y, value });
    }

    return points;
  }, [LOAN]);

  const [hoverX, setHoverX] = React.useState<number | null>(null);
  const handleMouseMove = (event: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    const rectElement = event.target as SVGRectElement;
    if (rectElement) {
      const rect = rectElement.getBoundingClientRect();
      // Calculate the normalized X value relative to the SVG's viewBox
      const normalizedX = ((event.clientX - rect.left) / rect.width) * 1000; // Scale X to viewBox scale (0 to 1000)
      setHoverX(normalizedX);
    }
  };

  const handleMouseLeave = () => {
    setHoverX(null); // Clear the hoverX when the mouse leaves the chart
  };

  // Helper: Find Y for a given X by interpolating the `POINTS_ARR`
  const getPoint = React.useCallback(
    (x: number): { y: number; value: number } => {
      for (let i = 0; i < POINTS.length - 1; i++) {
        const { x: x1, y: y1 } = POINTS[i];
        const { x: x2, y: y2 } = POINTS[i + 1];
        if (x >= x1 && x <= x2) {
          // Perform linear interpolation to find the Y-value
          const t = (x - x1) / (x2 - x1); // Ratio between x1 and x2
          return { y: y1 + t * (y2 - y1), value: POINTS[i + 1].value }; // Interpolated Y-value
        }
      }
      return { y: 0, value: POINTS[0].value }; // Return 0 if x is out of bounds (failsafe)
    },
    [POINTS]
  );

  return (
    <svg viewBox="-70 -70 1100 400" className="chart">
      <rect
        x="0"
        y="0"
        width="1000"
        height="300"
        fill="transparent"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      <polyline
        fill="none"
        stroke="#9999ac"
        strokeWidth="2"
        points={POINTS.map(({ x, y }) => `${x},${y}`).join(' ')}
      />
      <circle cx={POINTS[0].x} cy={POINTS[0].y} r="8" fill="#9999ac" />

      {/* End of the chart (last point) */}
      <circle
        cx={POINTS[POINTS.length - 1].x}
        cy={POINTS[POINTS.length - 1].y}
        r="8"
        fill="#9999ac"
      />

      {hoverX !== null && (
        <>
          <line
            x1={hoverX}
            y1="0"
            x2={hoverX}
            y2="300"
            stroke="#aaa"
            strokeWidth="1"
            strokeDasharray="4" // Dashed line
          />
          <circle cx={hoverX} cy={getPoint(hoverX).y} r="8" fill="#9999ac" />

          <text
            x={hoverX + 20}
            y={getPoint(hoverX).y + 20}
            fill="#9999ac"
            fontSize="20"
            textAnchor="start"
          >
            {Math.round(getPoint(hoverX).value)}
          </text>
        </>
      )}
      <line x1="0" y1="0" x2="1030" y2="0" stroke="#2d2d38" strokeWidth="1" />
      <line x1="0" y1="0" x2="0" y2="330" stroke="#fff" strokeWidth="1" strokeDasharray="5" />
      <text x="0" y="-15" fill="#9999ac" fontSize="20" textAnchor="start">
        Now
      </text>
      <text x="1000" y="-15" fill="#9999ac" fontSize="20" textAnchor="end">
        End
      </text>
      <text x="-10" y="20" fill="#9999ac" fontSize="20" textAnchor="end">
        0%
      </text>
      <text x="-10" y="300" fill="#9999ac" fontSize="20" textAnchor="end">
        100%
      </text>
    </svg>
  );
};
