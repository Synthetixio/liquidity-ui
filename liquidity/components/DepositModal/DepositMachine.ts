import { Wei, wei } from '@synthetixio/wei';
import { createMachine, assign } from 'xstate';

export const Events = {
  SET_REQUIRE_APPROVAL: 'SET_REQUIRE_APPROVAL',
  SET_REQUIRE_APPROVAL_FOR_STATAUSDC: 'SET_REQUIRE_APPROVAL_FOR_STATAUSDC',
  SET_WRAP_AMOUNT: 'SET_WRAP_AMOUNT',
  SET_INFINITE_APPROVAL: 'SET_INFINITE_APPROVAL',
  SET_IS_STATA_USDC: 'SET_IS_STATA_USDC',
  SET_HAS_ENOUGH_STATAUSDC: 'SET_HAS_ENOUGH_STATAUSDC',
  RETRY: 'RETRY',
  RUN: 'RUN',
  WRAP_USDC: 'WRAP_USDC',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  RESET: 'RESET',
} as const;

export const State = {
  idle: 'idle',
  wrap: 'wrap',
  approveCollateral: 'approveCollateral',
  wrapUSDC: 'wrapUSDC',
  approveUSDCForStata: 'approveUSDCForStata',
  deposit: 'deposit',
  failed: 'failed',
  success: 'success',
} as const;

const FailedSteps = {
  [State.approveCollateral]: State.approveCollateral,
  [State.wrap]: State.wrap,
  [State.deposit]: State.deposit,
  [State.wrapUSDC]: State.wrapUSDC,
  [State.approveUSDCForStata]: State.approveUSDCForStata,
} as const;

export const ServiceNames = {
  wrapEth: 'wrapEth',

  approveUSDCForStata: 'approveUSDCForStata',
  wrapUSDCToStataUSDC: 'wrapUSDCToStataUSDC',

  approveCollateral: 'approveCollateral',
  executeDeposit: 'executeDeposit',
} as const;

type Context = {
  error: {
    error: Error;
    step: keyof typeof FailedSteps;
  } | null;
  requireApproval: boolean;
  wrapAmount: Wei;
  infiniteApproval: boolean;
  isStataUSDC: boolean;
  requireStataUSDCApproval: boolean;
  hasEnoughStataUSDC: boolean;
};

type EventNamesType = typeof Events;

type DepositEvents =
  | { type: EventNamesType['SET_IS_STATA_USDC']; isStataUSDC: boolean }
  | { type: EventNamesType['SET_HAS_ENOUGH_STATAUSDC']; hasEnoughStataUSDC: boolean }
  | { type: EventNamesType['SET_REQUIRE_APPROVAL']; requireApproval: boolean }
  | {
      type: EventNamesType['SET_REQUIRE_APPROVAL_FOR_STATAUSDC'];
      requireStataUSDCApproval: boolean;
    }
  | { type: EventNamesType['SET_WRAP_AMOUNT']; wrapAmount: Wei }
  | { type: EventNamesType['SET_INFINITE_APPROVAL']; infiniteApproval: boolean }
  | { type: EventNamesType['RETRY'] }
  | { type: EventNamesType['RUN'] }
  | { type: EventNamesType['WRAP_USDC'] }
  | { type: EventNamesType['SUCCESS'] }
  | { type: EventNamesType['FAILURE'] }
  | { type: EventNamesType['RESET'] };

type StateType = typeof State;
type MachineState =
  | {
      value: StateType['idle'];
      context: Context & { error: null };
    }
  | {
      value: StateType['wrap'];
      context: Context & { error: null };
    }
  | {
      value: StateType['approveCollateral'];
      context: Context & { error: null };
    }
  | {
      value: StateType['deposit'];
      context: Context & { error: null };
    }
  | {
      value: StateType['wrapUSDC'];
      context: Context & { error: null };
    }
  | {
      value: StateType['approveUSDCForStata'];
      context: Context & { error: null };
    }
  | {
      value: StateType['failed'];
      context: Context & { error: { error: Error; step: keyof typeof FailedSteps } };
    }
  | {
      value: StateType['success'];
      context: Context & {
        error: null;
      };
    };

const initialContext = {
  wrapAmount: wei(0),
  error: null,
  requireApproval: false,
  infiniteApproval: false,
  isStataUSDC: false,
  requireStataUSDCApproval: false,
  hasEnoughStataUSDC: false,
};

export const DepositMachine = createMachine<Context, DepositEvents, MachineState>({
  id: 'DepositMachine',
  initial: State.idle,
  predictableActionArguments: true,
  context: initialContext,
  on: {
    [Events.RUN]: {
      target: State.deposit,
      actions: assign({
        wrapAmount: (_) => initialContext.wrapAmount,
        error: (_) => initialContext.error,
        requireApproval: (_) => initialContext.requireApproval,
        infiniteApproval: (_) => initialContext.infiniteApproval,
      }),
    },
    [Events.SET_REQUIRE_APPROVAL]: {
      actions: assign({ requireApproval: (_context, event) => event.requireApproval }),
    },
    [Events.SET_REQUIRE_APPROVAL_FOR_STATAUSDC]: {
      actions: assign({
        requireStataUSDCApproval: (_context, event) => event.requireStataUSDCApproval,
      }),
    },
    [Events.SET_WRAP_AMOUNT]: {
      actions: assign({ wrapAmount: (_context, event) => event.wrapAmount }),
    },
    [Events.SET_INFINITE_APPROVAL]: {
      actions: assign({ infiniteApproval: (_context, event) => event.infiniteApproval }),
    },
    [Events.SET_IS_STATA_USDC]: {
      actions: assign({ isStataUSDC: (_context, event) => event.isStataUSDC }),
    },
  },
  states: {
    [State.idle]: {
      on: {
        [Events.RUN]: [
          {
            target: State.wrap,
            cond: (context) => context.wrapAmount.gt(0),
          },
          {
            target: State.approveUSDCForStata,
            cond: (context) => context.isStataUSDC && context.requireStataUSDCApproval,
          },
          {
            target: State.wrapUSDC,
            cond: (context) => context.isStataUSDC,
          },
          { target: State.approveCollateral, cond: (context) => context.requireApproval },
          { target: State.deposit },
        ],
      },
    },
    [State.wrap]: {
      invoke: {
        src: ServiceNames.wrapEth,
        onError: {
          target: State.failed,
          actions: assign({
            error: (_context, event) => ({ error: event.data, step: FailedSteps.wrap }),
          }),
        },
        onDone: [
          {
            target: State.approveUSDCForStata,
            cond: (context) => context.requireStataUSDCApproval && context.isStataUSDC,
          },
          { target: State.approveCollateral, cond: (context) => context.requireApproval },
          { target: State.deposit },
        ],
      },
    },
    [State.approveUSDCForStata]: {
      invoke: {
        src: ServiceNames.approveUSDCForStata,
        onError: {
          target: State.failed,
          actions: assign({
            error: (_context, event) => ({
              error: event.data,
              step: FailedSteps.approveUSDCForStata,
            }),
          }),
        },
        onDone: {
          target: State.wrapUSDC,
        },
      },
    },
    [State.wrapUSDC]: {
      invoke: {
        src: ServiceNames.wrapUSDCToStataUSDC,
        onError: {
          target: State.failed,
          actions: assign({
            error: (_context, event) => ({ error: event.data, step: FailedSteps.wrapUSDC }),
          }),
        },
        onDone: [
          {
            target: State.approveCollateral,
            cond: (context) => context.requireApproval,
          },
          {
            target: State.deposit,
          },
        ],
      },
    },

    [State.approveCollateral]: {
      invoke: {
        src: ServiceNames.approveCollateral,
        onDone: [
          {
            target: State.deposit,
          },
        ],
        onError: {
          target: State.failed,
          actions: assign({
            error: (_context, event) => ({
              error: event.data,
              step: FailedSteps.approveCollateral,
            }),
          }),
        },
      },
    },

    [State.deposit]: {
      invoke: {
        src: ServiceNames.executeDeposit,
        onDone: {
          target: State.success,
        },
        onError: {
          target: State.failed,
          actions: assign({
            error: (_context, event) => ({ error: event.data, step: FailedSteps.deposit }),
          }),
        },
      },
    },
    [State.failed]: {
      on: {
        [Events.RETRY]: [
          {
            target: State.approveCollateral,
            cond: (c) => c.error?.step === FailedSteps.approveCollateral,
            actions: assign({ error: (_) => null }),
          },
          {
            target: State.wrap,
            cond: (c) => c.error?.step === FailedSteps.wrap,
            actions: assign({ error: (_) => null }),
          },
          {
            target: State.deposit,
            cond: (c) => c.error?.step === FailedSteps.deposit,
            actions: assign({ error: (_) => null }),
          },
          {
            target: State.approveUSDCForStata,
            cond: (c) => c.error?.step === FailedSteps.approveUSDCForStata,
            actions: assign({ error: (_) => null }),
          },
          {
            target: State.wrapUSDC,
            cond: (c) => c.error?.step === FailedSteps.wrapUSDC,
            actions: assign({ error: (_) => null }),
          },
        ],
      },
    },
    [State.success]: {},
  },
});
