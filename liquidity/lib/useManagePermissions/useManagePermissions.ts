import { useProvider, useSigner } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useMulticall3 } from '@snx-v3/useMulticall3';
import { useMutation } from '@tanstack/react-query';
import debug from 'debug';
import { ethers } from 'ethers';

const log = debug('snx:useManagePermissions');

type Permissions = Array<string>;
const getPermissionDiff = (
  existing: Permissions,
  selected: Permissions
): {
  grants: Permissions;
  revokes: Permissions;
} => {
  let grants: Permissions = [],
    revokes: Permissions = [];
  existing.concat(selected).forEach((permission) => {
    if (!existing.includes(permission)) {
      grants = [...grants, permission];
    }
    if (!selected.includes(permission)) {
      revokes = [...revokes, permission];
    }
  });
  return { grants, revokes };
};

export const useManagePermissions = ({
  accountId,
  target,
  existing = [],
  selected = [],
}: {
  accountId: ethers.BigNumber;
  target: string;
  existing: Permissions;
  selected: Permissions;
}) => {
  const { data: CoreProxy } = useCoreProxy();
  const { data: Multicall3 } = useMulticall3();
  const signer = useSigner();
  const provider = useProvider();

  return useMutation({
    mutationFn: async () => {
      if (!(CoreProxy && Multicall3 && signer && provider)) {
        throw 'OMFG';
      }

      const { grants, revokes } = getPermissionDiff(existing, selected);

      try {
        const CoreProxyInterface = new ethers.utils.Interface(CoreProxy.abi);

        const grantCalls = grants.map((permission) => ({
          target: CoreProxy.address,
          callData: CoreProxyInterface.encodeFunctionData('grantPermission', [
            accountId,
            ethers.utils.formatBytes32String(permission),
            target,
          ]),
          allowFailure: false,
          requireSuccess: true,
        }));

        const revokeCalls = revokes.map((permission) => ({
          target: CoreProxy.address,
          callData: CoreProxyInterface.encodeFunctionData('revokePermission', [
            accountId,
            ethers.utils.formatBytes32String(permission),
            target,
          ]),
          allowFailure: false,
          requireSuccess: true,
        }));

        const Multicall3Contract = new ethers.Contract(Multicall3.address, Multicall3.abi, signer);
        const txn = await Multicall3Contract.aggregate3([...grantCalls, ...revokeCalls]);
        log('txn', txn);
        const receipt = await provider.waitForTransaction(txn.hash);
        log('receipt', receipt);
      } catch (error: any) {
        throw error;
      }
    },
  });
};
