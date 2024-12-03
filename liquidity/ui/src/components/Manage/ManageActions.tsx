import {
  Box,
  Divider,
  Flex,
  Link,
  Skeleton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { ClaimModal } from '@snx-v3/ClaimModal';
import { DepositModal } from '@snx-v3/DepositModal';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { RepayModal } from '@snx-v3/RepayModal';
import { UndelegateModal } from '@snx-v3/UndelegateModal';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { useLiquidityPosition } from '@snx-v3/useLiquidityPosition';
import {
  makeSearch,
  ManageActionSchema,
  ManageActionType,
  type PositionPageSchemaType,
  useParams,
} from '@snx-v3/useParams';
import { validatePosition } from '@snx-v3/validatePosition';
import { WithdrawModal } from '@snx-v3/WithdrawModal';
import { wei } from '@synthetixio/wei';
import { FormEvent, Suspense, useCallback, useContext } from 'react';
import { Claim } from '../Claim/Claim';
import { Deposit } from '../Deposit/Deposit';
import { Repay } from '../Repay/Repay';
import { Undelegate } from '../Undelegate/Undelegate';
import { Withdraw } from '../Withdraw/Withdraw';
import { COLLATERALACTIONS, DEBTACTIONS } from './actions';

export const ManageAction = ({
  setTxnModalOpen,
  txnModalOpen,
}: {
  setTxnModalOpen: (action?: ManageActionType) => void;
  txnModalOpen?: ManageActionType;
}) => {
  const [params, setParams] = useParams<PositionPageSchemaType>();
  const { network } = useNetwork();

  const { debtChange, collateralChange, setCollateralChange, setDebtChange, setWithdrawAmount } =
    useContext(ManagePositionContext);

  const { data: collateralType } = useCollateralType(params.collateralSymbol);

  const { data: liquidityPosition } = useLiquidityPosition({
    tokenAddress: collateralType?.tokenAddress,
    accountId: params.accountId,
    poolId: params.poolId,
  });

  const isBase = isBaseAndromeda(network?.id, network?.preset);

  const { isValid } = validatePosition({
    issuanceRatioD18: collateralType?.issuanceRatioD18,
    collateralAmount: liquidityPosition?.collateralAmount,
    collateralPrice: liquidityPosition?.collateralPrice,
    debt: liquidityPosition?.debt,
    collateralChange,
    debtChange,
  });

  const manageActionParam = ManageActionSchema.safeParse(params.manageAction);
  const manageAction = manageActionParam.success ? manageActionParam.data : undefined;
  const debtActions = DEBTACTIONS(isBase);
  const tab = debtActions.some((action) => action.link === manageAction) ? 'debt' : 'collateral';

  const isFormValid = isBase ? true : isValid;

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      if (!form.reportValidity() || !isFormValid) {
        return;
      }
      setTxnModalOpen(manageAction);
    },
    [isFormValid, manageAction, setTxnModalOpen]
  );

  return (
    <>
      {!txnModalOpen ? (
        <Box as="form" onSubmit={onSubmit}>
          <Tabs isFitted index={tab === 'collateral' ? 0 : 1}>
            <TabList>
              <Tab
                as={Link}
                href={`?${makeSearch({
                  page: 'position',
                  collateralSymbol: params.collateralSymbol,
                  poolId: params.poolId,
                  manageAction: COLLATERALACTIONS[0].link,
                  accountId: params.accountId,
                })}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (tab !== 'collateral') {
                    setCollateralChange(wei(0));
                    setDebtChange(wei(0));
                  }
                  setParams({
                    page: 'position',
                    collateralSymbol: params.collateralSymbol,
                    poolId: params.poolId,
                    manageAction: COLLATERALACTIONS[0].link,
                    accountId: params.accountId,
                  });
                }}
                color={tab === 'collateral' ? 'white' : 'gray.500'}
                fontWeight={700}
                fontSize={['12px', '16px']}
                whiteSpace="nowrap"
                textDecoration="none"
                _hover={{ textDecoration: 'none' }}
              >
                Manage Collateral
              </Tab>
              <Tab
                as={Link}
                href={`?${makeSearch({
                  page: 'position',
                  collateralSymbol: params.collateralSymbol,
                  poolId: params.poolId,
                  manageAction: debtActions[0].link,
                  accountId: params.accountId,
                })}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (tab !== 'debt') {
                    setCollateralChange(wei(0));
                    setDebtChange(wei(0));
                  }
                  setParams({
                    page: 'position',
                    collateralSymbol: params.collateralSymbol,
                    poolId: params.poolId,
                    manageAction: debtActions[0].link,
                    accountId: params.accountId,
                  });
                }}
                color={tab === 'debt' ? 'white' : 'gray.500'}
                fontWeight={700}
                fontSize={['12px', '16px']}
                whiteSpace="nowrap"
                textDecoration="none"
                _hover={{ textDecoration: 'none' }}
              >
                {isBase ? 'Manage PnL' : 'Manage Debt'}
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel px="0">
                <Flex flexDir={['column', 'row']} gap={4}>
                  {COLLATERALACTIONS.map((action) => (
                    <Flex
                      as={Link}
                      href={`?${makeSearch({
                        page: 'position',
                        collateralSymbol: params.collateralSymbol,
                        poolId: params.poolId,
                        manageAction: action.link,
                        accountId: params.accountId,
                      })}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setCollateralChange(wei(0));
                        setDebtChange(wei(0));
                        setParams({
                          page: 'position',
                          collateralSymbol: params.collateralSymbol,
                          poolId: params.poolId,
                          manageAction: action.link,
                          accountId: params.accountId,
                        });
                      }}
                      h="84px"
                      minH={['90px', '84px']}
                      justifyContent="center"
                      key={action.title.concat('-tab-actions')}
                      border="1px solid"
                      flexDir="column"
                      alignItems="center"
                      borderColor={manageAction === action.link ? 'cyan.500' : 'gray.900'}
                      rounded="base"
                      flex="1"
                      minWidth={['100%', 'auto']}
                      textDecoration="none"
                      _hover={{ textDecoration: 'none' }}
                    >
                      {action.icon(manageAction === action.link ? 'cyan' : 'white')}
                      <Text
                        fontSize="14px"
                        fontWeight={700}
                        mt="2"
                        color={manageAction === action.link ? 'cyan.500' : 'white'}
                        textAlign="center"
                        lineHeight="1.1"
                      >
                        {action.title}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              </TabPanel>
              <TabPanel px="0">
                <Flex flexDir={['column', 'row']} gap={4}>
                  {debtActions.map((action) => (
                    <Flex
                      as={Link}
                      href={`?${makeSearch({
                        page: 'position',
                        collateralSymbol: params.collateralSymbol,
                        poolId: params.poolId,
                        manageAction: action.link,
                        accountId: params.accountId,
                      })}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setCollateralChange(wei(0));
                        setDebtChange(wei(0));
                        setParams({
                          page: 'position',
                          collateralSymbol: params.collateralSymbol,
                          poolId: params.poolId,
                          manageAction: action.link,
                          accountId: params.accountId,
                        });
                      }}
                      flex="1"
                      h="84px"
                      minH={['90px', '84px']}
                      justifyContent="center"
                      key={action.title.concat('-tab-actions')}
                      border="1px solid"
                      flexDir="column"
                      alignItems="center"
                      borderColor={manageAction === action.link ? 'cyan.500' : 'gray.900'}
                      rounded="base"
                      cursor="pointer"
                      minWidth={['100%', 'auto']}
                      textDecoration="none"
                      _hover={{ textDecoration: 'none' }}
                    >
                      {action.icon(manageAction === action.link ? 'cyan' : 'white')}
                      <Text
                        fontSize="14px"
                        fontWeight={700}
                        mt="2"
                        color={manageAction === action.link ? 'cyan.500' : 'white'}
                        textAlign="center"
                        lineHeight="1.1"
                      >
                        {action.title}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Flex direction="column">
            {manageAction === 'claim' ? <Claim liquidityPosition={liquidityPosition} /> : null}
            {manageAction === 'withdraw' ? <Withdraw /> : null}
            {manageAction === 'withdraw-debt' ? <Withdraw isDebtWithdrawal /> : null}
            {manageAction === 'deposit' ? <Deposit liquidityPosition={liquidityPosition} /> : null}
            {manageAction === 'repay' ? <Repay liquidityPosition={liquidityPosition} /> : null}
            {manageAction === 'undelegate' ? (
              <Undelegate liquidityPosition={liquidityPosition} />
            ) : null}
          </Flex>
        </Box>
      ) : null}

      <Suspense
        fallback={
          <Flex gap={4} flexDirection="column">
            <Skeleton maxW="232px" width="100%" height="20px" />
            <Divider my={4} />
            <Skeleton width="100%" height="20px" />
            <Skeleton width="100%" height="20px" />
          </Flex>
        }
      >
        {txnModalOpen === 'repay' ? (
          <RepayModal
            availableCollateral={liquidityPosition?.usdCollateral.availableCollateral}
            onClose={() => {
              setCollateralChange(wei(0));
              setDebtChange(wei(0));
              setTxnModalOpen(undefined);
            }}
            isOpen={txnModalOpen === 'repay'}
          />
        ) : null}
        {txnModalOpen === 'claim' ? (
          <ClaimModal
            onClose={() => {
              setCollateralChange(wei(0));
              setDebtChange(wei(0));
              setTxnModalOpen(undefined);
            }}
            isOpen={txnModalOpen === 'claim'}
            liquidityPosition={liquidityPosition}
          />
        ) : null}
        {txnModalOpen === 'deposit' ? (
          <DepositModal
            onClose={() => {
              setCollateralChange(wei(0));
              setDebtChange(wei(0));
              setTxnModalOpen(undefined);
            }}
            isOpen={txnModalOpen === 'deposit'}
            liquidityPosition={liquidityPosition}
          />
        ) : null}
        {txnModalOpen === 'undelegate' ? (
          <UndelegateModal
            liquidityPosition={liquidityPosition}
            onClose={() => {
              setCollateralChange(wei(0));
              setDebtChange(wei(0));
              setTxnModalOpen(undefined);
            }}
            isOpen={txnModalOpen === 'undelegate'}
          />
        ) : null}
        {txnModalOpen === 'withdraw' ? (
          <WithdrawModal
            onClose={() => {
              setCollateralChange(wei(0));
              setDebtChange(wei(0));
              setWithdrawAmount(wei(0));
              setTxnModalOpen(undefined);
            }}
          />
        ) : null}

        {txnModalOpen === 'withdraw-debt' ? (
          <WithdrawModal
            onClose={() => {
              setCollateralChange(wei(0));
              setDebtChange(wei(0));
              setWithdrawAmount(wei(0));
              setTxnModalOpen(undefined);
            }}
            isDebtWithdrawal
          />
        ) : null}
      </Suspense>
    </>
  );
};
