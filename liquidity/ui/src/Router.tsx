import { Box, Container, Flex, Spinner } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { Suspense } from 'react';
import { Footer } from './Footer';
import Header from './Header';
import { Settings } from './pages/Account/Settings';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { Manage } from './pages/Manage';
import { Pool } from './pages/Pool';
import { Pools } from './pages/Pools';

export function Router() {
  const [params] = useParams();

  return (
    <Suspense fallback={<Spinner />}>
      <Box
        as="main"
        minHeight="100vh"
        color="rgba(255,255,255,0.85)"
        display="flex"
        flexDirection="column"
        bg="navy.900"
      >
        <Flex flex="1" flexDirection="column">
          <Header />
          <Container display="flex" flexDir="column" maxW="1236px" flex="1">
            {params.page === 'settings' ? <Settings /> : null}
            {params.page === 'position' ? <Manage /> : null}
            {params.page === 'pool' ? <Pool /> : null}
            {params.page === 'pools' ? <Pools /> : null}
            {params.page === 'dashboard' ? <Dashboard /> : null}
            {params.page === 'home' || !params.page ? <Home /> : null}
          </Container>
          <Footer />
        </Flex>
      </Box>
    </Suspense>
  );
}
