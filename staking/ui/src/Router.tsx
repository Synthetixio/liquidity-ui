import { Container, Flex } from '@chakra-ui/react';
import { useParams } from '@snx-v3/useParams';
import { AccountSettingsPage } from './AccountSettingsPage';
import { DashboardPage } from './DashboardPage';
import { Footer } from './Footer';
import Header from './Header';

function Content() {
  const [params] = useParams();
  if (params.page === 'settings') {
    return <AccountSettingsPage />;
  }
  return <DashboardPage />;
}

export function Router() {
  return (
    <Flex
      as="main"
      minHeight="100vh"
      color="rgba(255,255,255,0.85)"
      direction="column"
      bg="navy.900"
    >
      <Flex flex="1" direction="column">
        <Header />
        <Flex as={Container} direction="column" maxW="1236px" flex="1">
          <Content />
        </Flex>
        <Footer />
      </Flex>
    </Flex>
  );
}
