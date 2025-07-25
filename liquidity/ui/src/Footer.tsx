import { Container, Flex, Link } from '@chakra-ui/react';
import { DiscordIcon, GithubIcon, Logo, XIcon } from '@snx-v3/icons';

export const Footer = () => {
  return (
    <Flex borderTop="1px solid" borderTopColor="gray.900" bg="navy.700">
      <Container
        maxW="1236px"
        as={Flex}
        height="72px"
        alignItems="center"
        justifyContent="space-between"
      >
        <Logo withText={false} />
        <Flex alignItems="center">
          <Link href="https://discord.com/invite/synthetix" target="_blank">
            <DiscordIcon w="24px" h="24px" mr={2} />
          </Link>
          <Link href="https://x.com/synthetix_io" target="_blank">
            <XIcon w="24px" h="24px" mr={2} />
          </Link>
          <Link href="https://github.com/Synthetixio/" target="_blank">
            <GithubIcon w="24px" h="24px" mr={2} />
          </Link>
        </Flex>
      </Container>
    </Flex>
  );
};
