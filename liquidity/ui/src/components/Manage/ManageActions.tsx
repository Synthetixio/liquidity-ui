import {
  Box,
  Divider,
  Flex,
  Skeleton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { isBaseAndromeda } from '@snx-v3/isBaseAndromeda';
import { ManagePositionContext } from '@snx-v3/ManagePositionContext';
import { useNetwork } from '@snx-v3/useBlockchain';
import { useCollateralType } from '@snx-v3/useCollateralTypes';
import { LiquidityPosition } from '@snx-v3/useLiquidityPosition';
import { useParams } from '@snx-v3/useParams';
import { validatePosition } from '@snx-v3/validatePosition';
import { safeImport } from '@synthetixio/safe-import';
import { wei } from '@synthetixio/wei';
import { FormEvent, lazy, Suspense, useCallback, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Borrow, Claim, Deposit, Repay, Undelegate } from '../';
import { Withdraw } from '../Withdraw/Withdraw';
import { COLLATERALACTIONS, DEBTACTIONS } from './actions';

const RepayModal = lazy(() => safeImport(() => import('@snx-v3/RepayModal')));
const BorrowModal = lazy(() => safeImport(() => import('@snx-v3/BorrowModal')));
const ClaimModal = lazy(() => safeImport(() => import('@snx-v3/ClaimModal')));
const DepositModal = lazy(() => safeImport(() => import('@snx-v3/DepositModal')));
const UndelegateModal = lazy(() => safeImport(() => import('@snx-v3/UndelegateModal')));
const WithdrawModal = lazy(() => safeImport(() => import('@snx-v3/WithdrawModal')));

const ManageActionSchema = z.enum([
  'borrow',
  'deposit',
  'repay',
  'claim',
  'undelegate',
  'withdraw',
  'withdraw-debt',
]);
export type ManageActionType = z.infer<typeof ManageActionSchema>;

export const ManageAction = ({
  liquidityPosition,
  setTxnModalOpen,
  txnModalOpen,
}: {
  liquidityPosition?: LiquidityPosition;
  setTxnModalOpen: (action?: ManageActionType) => void;
  txnModalOpen?: ManageActionType;
}) => {
  const params = useParams();
  const { network } = useNetwork();

  const navigate = useNavigate();
  const location = useLocation();

  const { debtChange, collateralChange, setCollateralChange, setDebtChange, setWithdrawAmount } =
    useContext(ManagePositionContext);

  const { data: collateralType } = useCollateralType(params.collateralSymbol);
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

  const setActiveAction = (action: string) => {
    setCollateralChange(wei(0));
    setDebtChange(wei(0));
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('manageAction', action);
    navigate({ pathname: location.pathname, search: queryParams.toString() }, { replace: true });
  };

  return (
    <>
      {!txnModalOpen ? (
        <Box as="form" onSubmit={onSubmit}>
          <Tabs isFitted index={tab === 'collateral' ? 0 : 1}>
            <TabList>
              <Tab
                color={tab === 'collateral' ? 'white' : 'gray.500'}
                fontWeight={700}
                fontSize={['12px', '16px']}
                onClick={() => {
                  if (tab !== 'collateral') {
                    setActiveAction(COLLATERALACTIONS[0].link);
                  }
                }}
                whiteSpace="nowrap"
              >
                Manage Collateral
              </Tab>
              <Tab
                color={tab === 'debt' ? 'white' : 'gray.500'}
                fontWeight={700}
                fontSize={['12px', '16px']}
                onClick={() => {
                  if (tab !== 'debt') {
                    setActiveAction(debtActions[0].link);
                  }
                }}
                whiteSpace="nowrap"
              >
                {isBase ? 'Manage PnL' : 'Manage Debt'}
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel px="0">
                <Flex flexDir={['column', 'row']} gap={4}>
                  {COLLATERALACTIONS.map((action) => (
                    <Flex
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
                      onClick={() => setActiveAction(action.link)}
                      flex="1"
                      minWidth={['100%', 'auto']}
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
                      onClick={() => setActiveAction(action.link)}
                      minWidth={['100%', 'auto']}
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
            {manageAction === 'borrow' ? <Borrow liquidityPosition={liquidityPosition} /> : null}
            {manageAction === 'claim' ? <Claim liquidityPosition={liquidityPosition} /> : null}
            {manageAction === 'withdraw' ? (
              <Withdraw liquidityPosition={liquidityPosition} />
            ) : null}
            {manageAction === 'withdraw-debt' ? (
              <Withdraw liquidityPosition={liquidityPosition} isDebtWithdrawal />
            ) : null}
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
        {txnModalOpen === 'borrow' ? (
          <BorrowModal
            onClose={() => {
              setCollateralChange(wei(0));
              setDebtChange(wei(0));
              setTxnModalOpen(undefined);
            }}
            isOpen={txnModalOpen === 'borrow'}
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
            liquidityPosition={liquidityPosition}
            onClose={() => {
              setCollateralChange(wei(0));
              setDebtChange(wei(0));
              setWithdrawAmount(wei(0));
              setTxnModalOpen(undefined);
            }}
            isOpen={txnModalOpen === 'withdraw'}
            account
          />
        ) : null}

        {txnModalOpen === 'withdraw-debt' ? (
          <WithdrawModal
            liquidityPosition={liquidityPosition}
            onClose={() => {
              setCollateralChange(wei(0));
              setDebtChange(wei(0));
              setWithdrawAmount(wei(0));
              setTxnModalOpen(undefined);
            }}
            isOpen={txnModalOpen === 'withdraw-debt'}
            account
            isDebtWithdrawal
          />
        ) : null}
      </Suspense>
    </>
  );
};
