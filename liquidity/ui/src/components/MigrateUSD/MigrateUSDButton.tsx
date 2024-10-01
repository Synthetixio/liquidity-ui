import { Button } from '@chakra-ui/react';
import { Network, useNetwork, useWallet } from '@snx-v3/useBlockchain';
import { useParams } from '@snx-v3/useParams';
import { useEffect, useState } from 'react';
import { TokenIcon } from '../TokenIcon';
import { MigrateUSDModal } from './MigrateUSDModal';

export function MigrateUSDButton({ network }: { network: Network }) {
  const [isOpen, setIsOpen] = useState(false);
  const { network: currentNetwork } = useNetwork();
  const params = useParams();
  const { activeWallet } = useWallet();

  useEffect(() => {
    if (params.convert?.toLowerCase() === 'snxusd') {
      setIsOpen(true);
    }
  }, [params.convert]);

  if (!activeWallet || currentNetwork?.id !== network.id) {
    return null;
  }

  return (
    <>
      <MigrateUSDModal
        type="convert"
        network={network}
        onClose={() => setIsOpen(false)}
        isOpen={isOpen}
      />
      <Button
        variant="outline"
        colorScheme="gray"
        px={3}
        gap={2}
        display="flex"
        alignItems="center"
        fontSize="14px"
        onClick={() => setIsOpen(true)}
      >
        <TokenIcon width={24} height={24} symbol="susd" />
        Convert sUSD
      </Button>
    </>
  );
}
