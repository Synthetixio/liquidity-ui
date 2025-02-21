import { Box, Container, Flex, Spinner } from '@chakra-ui/react';
import { Suspense } from 'react';
import { DashboardPage } from './DashboardPage';
import { Footer } from './Footer';
import Header from './Header';

function Content() {
  return <DashboardPage />;
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
