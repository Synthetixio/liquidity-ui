import { Box, Container, Flex, Spinner } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { Suspense } from 'react';
import { Footer } from './Footer';
import Header from './Header';
import { Settings } from './pages/Account/Settings';
import { Dashboard } from './pages/Dashboard';
import { Manage } from './pages/Manage';

function Content() {
  const [params] = useParams();
  if (params.page === 'settings') {
    return <Settings />;
  }
  if (params.page === 'position') {
    return <Manage />;
  }
  return <Dashboard />;
}

export function Router() {
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
            <Content />
          </Container>
          <Footer />
        </Flex>
      </Box>
    </Suspense>
  );
}
