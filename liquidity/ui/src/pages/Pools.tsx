import { Box } from '@chakra-ui/react';
import { PoolsList } from '../components/Pools/PoolsList';

export function Pools() {
  return (
    <Box mb={20} w="100%">
      <PoolsList />
    </Box>
  );
}
