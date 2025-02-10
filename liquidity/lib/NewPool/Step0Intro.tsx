import { CheckIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  Heading,
  Image,
  Link,
  List,
  ListIcon,
  ListItem,
  Spacer,
  Text,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import rocketImage from './synthetix-rocket.png';

export const Step0Intro = ({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <VStack spacing={2} align="start">
      <Flex>
        <VStack gap={6} flex={1} align="start" fontWeight="400" fontSize="14px">
          <Heading size="sm">Delegated Staking is now live!</Heading>

          <Text>
            Migrate from Synthetix V2 or V3 to have your active debt forgiven over 12 months, while
            also earning:
          </Text>

          <List spacing={2}>
            <ListItem>
              <ListIcon as={CheckIcon} color="cyan.500" />
              V2 Legacy Market Fees
            </ListItem>
            <ListItem>
              <ListIcon as={CheckIcon} color="cyan.500" />
              V3 SC Pool Fees
            </ListItem>
            <ListItem>
              <ListIcon as={CheckIcon} color="cyan.500" />
              LP Incentives
            </ListItem>
            <ListItem>
              <ListIcon as={CheckIcon} color="cyan.500" />
              Improved LP experience
            </ListItem>
          </List>
          <Text fontSize="sm">
            Learn more about{' '}
            <Link isExternal color="cyan.500" href="https://sips.synthetix.io/sips/sip-420/">
              Delegated Staking and the Jubilee Pool
            </Link>
          </Text>
        </VStack>
        <Flex alignItems="center" justifyContent="center" flex={1}>
          <Image width="165px" src={rocketImage} alt="Synthetix Delegated Staking Launch" />
        </Flex>
      </Flex>

      <Spacer mt={6} />

      <Button width="100%" onClick={onConfirm}>
        Start Migration
      </Button>
      <Button variant="outline" colorScheme="gray" width="100%" onClick={onClose}>
        Later
      </Button>
    </VStack>
  );
};
