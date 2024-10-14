import { useSigner } from '@snx-v3/useBlockchain';
import { useCoreProxy } from '@snx-v3/useCoreProxy';
import { useMulticall3 } from '@snx-v3/useMulticall3';
import { useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';

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
  accountId: string;
  target: string;
  existing: Permissions;
  selected: Permissions;
}) => {
  const { data: CoreProxy } = useCoreProxy();
  const { data: Multicall3 } = useMulticall3();
  const signer = useSigner();

  return useMutation({
    mutationFn: async () => {
      if (!(CoreProxy && Multicall3 && signer)) {
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
        const tx = await Multicall3Contract.aggregate3([...grantCalls, ...revokeCalls]);
        await tx.wait();
      } catch (error: any) {
        throw error;
      }
    },
  });
};
