import { Button, Collapse, Text } from '@chakra-ui/react';
import { ContractErrorType } from '@snx-v3/parseContractError';
import format from 'date-fns/format';
import React from 'react';

const defaultOpen = window?.localStorage?.CONTRACT_ERROR_OPEN === 'true';

export function ContractError({ contractError }: { contractError: ContractErrorType }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <>
      {!isOpen ? (
        <Button
          variant="link"
          onClick={() => setIsOpen(true)}
          color="inherit"
          fontWeight="normal"
          fontStyle="italic"
        >
          details...
        </Button>
      ) : null}
      <Collapse in={isOpen} animateOpacity unmountOnExit>
        <Text fontStyle="italic" fontSize="0.8em">
          {contractError.name}
        </Text>
        <Text whiteSpace="pre" fontSize="0.8em" fontStyle="italic" pl="0.5em">
          {Object.entries(contractError.args)
            .map(
              ([key, val]) =>
                `${key}: ${val instanceof Date ? format(val, 'yyyy-MM-dd HH:mm:ss') : val}`
            )
            .join('\n')}
        </Text>
      </Collapse>
    </>
  );
}
