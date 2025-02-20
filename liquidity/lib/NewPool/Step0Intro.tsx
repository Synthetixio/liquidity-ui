import { Button, Flex, Heading, Image, Link, Spacer, Text, VStack } from '@chakra-ui/react';
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
      <Flex gap={6}>
        <VStack gap={6} flex={1} align="start" fontWeight="400" fontSize="14px">
          <Heading size="sm">Debt-free Staking is now live!</Heading>
          <Text>
            Migrate your staking position to have your active debt forgiven over 12 months, without
            managing liquidation risk.
          </Text>
          <Text>Withdraw at any time after initial 7 day lock by repaying your loan.</Text>
          <Text fontSize="sm">
            Learn more about{' '}
            <Link isExternal color="cyan.500" href="https://sips.synthetix.io/sips/sip-420/">
              Delegated Staking and the Jubilee Pool
            </Link>
          </Text>
        </VStack>
        <Flex alignItems="center" justifyContent="center">
          <Image mx={6} width="100px" src={rocketImage} alt="Synthetix Delegated Staking Launch" />
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
