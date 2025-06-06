import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Badge, Flex, IconButton, Td, Text, Tr, useDisclosure } from '@chakra-ui/react';
import { Address } from '@snx-v3/Address';
import { useManagePermissions } from '@snx-v3/useManagePermissions';
import { ethers } from 'ethers';
import { useEffect } from 'react';
import { permissionsList } from './AccountPermissions';
import { PermissionModal } from './PermissionModal';

export function PermissionRow({
  address,
  currentPermissions,
  accountId,
  refetch,
  isOwner,
}: {
  address: string;
  currentPermissions: string[];
  accountId: ethers.BigNumber;
  refetch: () => void;
  isOwner: boolean;
}) {
  const {
    isOpen: isPermissionOpen,
    onClose: onPermissionClose,
    onOpen: onPermissionOpen,
  } = useDisclosure();

  const {
    mutate: removePermissions,
    isPending,
    isSuccess,
  } = useManagePermissions({
    accountId,
    target: address,
    selected: [],
    existing: currentPermissions,
  });

  useEffect(() => {
    if (isSuccess) {
      refetch();
      onPermissionClose();
    }
  }, [isSuccess, onPermissionClose, refetch]);

  return (
    <Tr>
      <Td width={240} borderBottomColor="gray.900" py="4">
        <Text fontWeight={400} color="white" fontSize="16px">
          <Address address={address} />
        </Text>
      </Td>
      <Td borderBottomColor="gray.900">
        <Flex py={2} flexWrap="wrap" gap={3}>
          {permissionsList.map((permission) => {
            const isActive = currentPermissions.includes(permission);
            return (
              <Badge
                color={isActive ? 'cyan' : 'gray'}
                colorScheme={isActive ? 'cyan' : 'gray'}
                variant="outline"
                bg={isActive ? 'cyan.900' : 'gray.900'}
                size="sm"
                textTransform="capitalize"
                key={permission.concat('permission-row')}
              >
                {permission}
              </Badge>
            );
          })}
        </Flex>
      </Td>

      <Td borderBottomColor="gray.900" textAlign="end">
        {isOwner && (
          <>
            <PermissionModal
              isOpen={isPermissionOpen}
              onClose={onPermissionClose}
              accountId={accountId}
              refetch={refetch}
              existingPermissions={currentPermissions}
              target={address}
            />
            <IconButton
              onClick={onPermissionOpen}
              size="sm"
              aria-label="edit"
              variant="outline"
              colorScheme="gray"
              icon={<EditIcon />}
              mr="2"
            />
            <IconButton
              variant="outline"
              isLoading={isPending}
              colorScheme="gray"
              onClick={() => {
                removePermissions();
              }}
              size="sm"
              aria-label="delete"
              icon={<DeleteIcon />}
            />
          </>
        )}
      </Td>
    </Tr>
  );
}
