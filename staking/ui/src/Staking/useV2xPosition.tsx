import { contractsHash } from '@snx-v3/tsHelpers';
import { useNetwork, useProvider, useWallet } from '@snx-v3/useBlockchain';
import { usePositionManagerNewPool } from '@snx-v3/usePositionManagerNewPool';
import { useV2xSynthetix } from '@snx-v3/useV2xSynthetix';
import { useQuery } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useV2xPosition');

export function useV2xPosition() {
  const provider = useProvider();
  const { network } = useNetwork();

  const { data: PositionManagerNewPool } = usePositionManagerNewPool();
  const { data: V2xSynthetix } = useV2xSynthetix();

  const { activeWallet } = useWallet();
  const walletAddress = activeWallet?.address;

  return useQuery({
    queryKey: [
      `${network?.id}-${network?.preset}`,
      'New Pool',
      'useV2xPosition',
      { walletAddress },
      { contractsHash: contractsHash([PositionManagerNewPool, V2xSynthetix]) },
    ],
    enabled: Boolean(
      network && provider && PositionManagerNewPool && V2xSynthetix && walletAddress
    ),
    queryFn: async () => {
      if (!(network && provider && PositionManagerNewPool && V2xSynthetix && walletAddress)) {
        throw new Error('OMFG');
      }
      log('walletAddress', walletAddress);
      const PositionManagerNewPoolContract = new ethers.Contract(
        PositionManagerNewPool.address,
        PositionManagerNewPool.abi,
        provider
      );
      const SynthetixProxyAddress = await PositionManagerNewPoolContract.getV2x();
      log('SynthetixProxyAddress', SynthetixProxyAddress);

      const V2xSynthetixContract = new ethers.Contract(
        SynthetixProxyAddress,
        V2xSynthetix.abi,
        provider
      );

      const collateralAmount = await V2xSynthetixContract.collateral(walletAddress);
      log('collateralAmount', collateralAmount);

      let cRatio = ethers.BigNumber.from(0);
      if (collateralAmount.gt(0)) {
        const collateralisationRatio =
          await V2xSynthetixContract.collateralisationRatio(walletAddress);
        if (collateralisationRatio.gt(0)) {
          cRatio = ethers.utils
            .parseEther('1')
            .mul(ethers.utils.parseEther('1'))
            .div(collateralisationRatio);
          log('cRatio', cRatio);
        }
      }

      const debt = await V2xSynthetixContract.debtBalanceOf(
        walletAddress,
        ethers.utils.formatBytes32String('sUSD')
      );
      log('debt', debt);

      return { collateralAmount, cRatio, debt };
    },
  });
}
