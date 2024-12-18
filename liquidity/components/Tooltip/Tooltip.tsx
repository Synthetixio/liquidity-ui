import { Tooltip as ChakraTooltip, type TooltipProps } from '@chakra-ui/react';

export const Tooltip = ({ ...props }: TooltipProps) => {
  return <ChakraTooltip hasArrow bg="gray.900" p={3} borderRadius="4px" {...props} />;
};
