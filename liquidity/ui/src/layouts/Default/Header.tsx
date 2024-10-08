import { Box, Container, Flex, Link, useDisclosure } from '@chakra-ui/react';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import { NetworkController } from './NetworkController';
import { useEffect } from 'react';
import { Logo, LogoIcon } from '@snx-v3/icons';
import { MigrateUSDButton } from '../../components/MigrateUSD/MigrateUSDButton';
import { MAINNET, SEPOLIA, useNetwork } from '@snx-v3/useBlockchain';

export default function Header() {
  const { network } = useNetwork();
  const { onClose } = useDisclosure();
  const location = useLocation();

  useEffect(() => {
    onClose();
  }, [location, onClose]);

  return (
    <>
      <Flex
        bg="navy.700"
        mb="4"
        py="3"
        borderBottomWidth="1px"
        borderBottomColor="gray.900"
        px="10"
      >
        <Container maxW="1236px" as={Flex} justifyContent="space-between" alignItems="center">
          <Flex
            display={{ base: 'none', md: 'inline-block' }}
            flexDirection="row"
            justifyContent="space-between"
          >
            <Link
              to={{
                pathname: '/',
                search: location.search,
              }}
              as={RouterLink}
              py={4}
            >
              <Logo />
            </Link>
            <Link
              ml={6}
              as={RouterLink}
              to={{
                pathname: '/dashboard',
                search: location.search,
              }}
              fontWeight={700}
              fontSize="14px"
              display="inline"
              px={3}
              py={2.5}
              textDecoration="none"
              color="gray.500"
              _hover={{ textDecoration: 'none' }}
              _activeLink={{ color: 'white' }}
            >
              Dashboard
            </Link>
            <Link
              ml={2.5}
              as={RouterLink}
              to={{
                pathname: '/pools',
                search: location.search,
              }}
              fontWeight={700}
              fontSize="14px"
              display="inline"
              textDecoration="none"
              px={3}
              py={2.5}
              color="gray.500"
              _hover={{ textDecoration: 'none' }}
              _activeLink={{ color: 'white' }}
            >
              Pools
            </Link>
          </Flex>
          <Box display={{ md: 'none' }}>
            <Link to="/" as={RouterLink} py={4} pr={2}>
              <LogoIcon />
            </Link>
          </Box>
          <Flex gap={3} flexWrap="wrap-reverse" justifyContent="center" alignItems="center">
            {/* Hide balance */}
            {/* <Balance isBase={isBase} balance={balance} /> */}
            {network && [MAINNET.id, SEPOLIA.id].includes(network.id) ? (
              <MigrateUSDButton network={network} />
            ) : null}
            <NetworkController />
          </Flex>
        </Container>
      </Flex>
    </>
  );
}
