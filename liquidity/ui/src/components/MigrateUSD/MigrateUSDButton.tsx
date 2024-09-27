import { Button } from '@chakra-ui/react';
import { FC, useEffect, useState } from 'react';
import { Network, useNetwork, useWallet } from '@snx-v3/useBlockchain';
import { MigrateUSDModal } from './MigrateUSDModal';
import { TokenIcon } from '../TokenIcon';
import { useLocation } from 'react-router-dom';
import { useParams } from '@snx-v3/useParams';

interface Props {
  network: Network;
}

export const MigrateUSDButton: FC<Props> = ({ network }) => {
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const { network: currentNetwork } = useNetwork();
  const { convert } = useParams();
  const { activeWallet } = useWallet();

  useEffect(() => {
    if (convert && convert.toLowerCase() === 'snxusd') {
      setIsOpen(true);
    }
  }, [location.search, convert]);

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
};
