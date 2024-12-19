import { Button, Flex, Image, Link, Text } from '@chakra-ui/react';
import CoinImage from './coin.png';
import { BorderBox } from '@snx-v3/BorderBox';

export function StataDepositBanner() {
  return (
    <BorderBox
      display="flex"
      flexDirection={['column', 'column', 'column', 'column', 'row']}
      alignItems="center"
      gap={6}
      p={6}
      bg="navy.700"
    >
      <Flex flexDir="column" gap={3}>
        <Text color="white.900" fontSize="20px" fontWeight={700}>
          This position earns yield via Aave and Synthetix
        </Text>
        <Text color="white.600" fontSize="14px" fontWeight={300}>
          Deposit USDC, and we’ll wrap it into static aUSDC for you. Watch your balance stay the
          same while the value grows, earning effortless yield through Aave and Synthetix.
        </Text>
        <Button
          mt={1}
          as={Link}
          href="https://governance.aave.com/t/bgd-statatoken-v3/11894"
          target="_blank"
          textDecoration="none"
          variant="outline"
          colorScheme="gray"
          w="fit-content"
        >
          Read more about static aUSDC
        </Button>
      </Flex>

      <Image rounded="8px" src={CoinImage} width={257} />
    </BorderBox>
  );
}
