import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RewardsRow } from './RewardsRow'; // Replace with the actual path to your component
import { Table } from '@chakra-ui/react';
import { init, Web3OnboardProvider } from '@web3-onboard/react';
import { wei } from '@synthetixio/wei';

describe('RewardsRow', () => {
  it('should render RewardsRow', () => {
    const onboard = init({
      wallets: [],
      chains: [{ id: 1 }],
    });
    const queryClient = new QueryClient();
    cy.mount(
      <Web3OnboardProvider web3Onboard={onboard}>
        <QueryClientProvider client={queryClient}>
          <Table>
            <RewardsRow
              displaySymbol="ETH"
              claimableAmount={wei(50)}
              lifetimeClaimed={25}
              distributorAddress="0x123456789abcdef"
              payoutTokenAddress="0x123456789abcdef"
            />
          </Table>
        </QueryClientProvider>
      </Web3OnboardProvider>
    );
  });
});
