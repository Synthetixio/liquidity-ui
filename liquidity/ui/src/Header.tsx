import { Container, Flex, Link, useDisclosure } from '@chakra-ui/react';
import { Logo, LogoIcon } from '@snx-v3/icons';
import { MigrateUSDButton } from '@snx-v3/MigrateUSD';
import { MAINNET, SEPOLIA, useNetwork } from '@snx-v3/useBlockchain';
import { useEffect } from 'react';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import { NetworkController } from './NetworkController';

export default function Header() {
  const { network } = useNetwork();
  const { onClose } = useDisclosure();
  const location = useLocation();

  useEffect(() => {
    onClose();
  }, [location, onClose]);

  return (
    <Flex
      bg="navy.700"
      mb="4"
      py="3"
      borderBottomWidth="1px"
      borderBottomColor="gray.900"
      px={{ base: 1, md: 10 }}
    >
      <Container maxW="1236px" as={Flex} justifyContent="space-between" alignItems="center">
        <Flex flexDirection="row" justifyContent="start" alignItems="center">
          <Link mt={-1.5} to="/" as={RouterLink} display={{ base: 'none', md: 'inline-block' }}>
            <Logo />
          </Link>
          <Link mt={-1.5} to="/" as={RouterLink} display={{ md: 'none' }}>
            <LogoIcon />
          </Link>
        </Flex>
        <Flex gap={3} flexWrap="wrap-reverse" justifyContent="center" alignItems="center">
          {network && [MAINNET.id, SEPOLIA.id].includes(network.id) ? (
            <MigrateUSDButton network={network} />
          ) : null}
          <NetworkController />
        </Flex>
      </Container>
    </Flex>
  );
}
