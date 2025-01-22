import { Flex } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';
import { MultistepStatus } from './MultistepStatus';
import { statusColor } from './statusColor';
import { StepIcon } from './StepIcon';

export function Step({ status, children }: PropsWithChildren<{ status: MultistepStatus }>) {
  return (
    <Flex
      width={10}
      height={10}
      minWidth={10}
      minHeight={10}
      justifyContent="center"
      alignItems="center"
      bg={statusColor(status)}
      rounded="full"
      transitionProperty="background"
      transitionDuration="normal"
    >
      <StepIcon status={status}>{children}</StepIcon>
    </Flex>
  );
}
