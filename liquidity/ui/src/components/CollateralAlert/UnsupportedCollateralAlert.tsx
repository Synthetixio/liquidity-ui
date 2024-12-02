import {
  Button,
  Divider,
  Link,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { makeSearch, type PositionPageSchemaType, useParams } from '@snx-v3/useParams';

export const UnsupportedCollateralAlert = ({ isOpen }: { isOpen: boolean }) => {
  const [params, setParams] = useParams<PositionPageSchemaType>();
  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <ModalOverlay />
      <ModalContent p={6} borderWidth="1px" borderColor="gray.900" mt="17.5%" bg="navy.700">
        <ModalHeader p={0}>Collateral Not Supported</ModalHeader>
        <Divider my={6} />
        <Text color="white" fontFamily="heading" fontSize="14px" lineHeight="20px">
          This collateral is not supported on this network. Go back to your dashboard to see your
          active positions on this network.
        </Text>
        <Button
          as={Link}
          href={`?${makeSearch({
            page: 'dashboard',
            accountId: params.accountId,
          })}`}
          onClick={(e) => {
            e.preventDefault();
            setParams({
              page: 'dashboard',
              accountId: params.accountId,
            });
          }}
          mt={6}
          textDecoration="none"
          _hover={{ textDecoration: 'none' }}
        >
          Back to Dashboard
        </Button>
      </ModalContent>
    </Modal>
  );
};
