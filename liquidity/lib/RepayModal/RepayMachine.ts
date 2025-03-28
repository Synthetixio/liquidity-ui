import { assign, createMachine } from 'xstate';

export const Events = {
  SET_REQUIRE_APPROVAL: 'SET_REQUIRE_APPROVAL',
  SET_INFINITE_APPROVAL: 'SET_INFINITE_APPROVAL',
  RETRY: 'RETRY',
  RUN: 'RUN',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  RESET: 'RESET',
} as const;

export const State = {
  idle: 'idle',
  approve: 'approve',
  repay: 'repay',
  failed: 'failed',
  success: 'success',
} as const;

const FailedSteps = {
  [State.approve]: State.approve,
  [State.repay]: State.repay,
} as const;

export const ServiceNames = {
  approveSUSD: 'approveSUSD',
  executeRepay: 'executeRepay',
} as const;

type Context = {
  error: {
    error: Error;
    step: keyof typeof FailedSteps;
  } | null;
  requireApproval: boolean;
  infiniteApproval: boolean;
};

type EventNamesType = typeof Events;
type RepayEvents =
  | { type: EventNamesType['SET_REQUIRE_APPROVAL']; requireApproval: boolean }
  | { type: EventNamesType['SET_INFINITE_APPROVAL']; infiniteApproval: boolean }
  | { type: EventNamesType['RETRY'] }
  | { type: EventNamesType['RUN'] }
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
      value: StateType['approve'];
      context: Context & { error: null };
    }
  | {
      value: StateType['repay'];
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
  error: null,
  requireApproval: false,
  infiniteApproval: false,
};

export const RepayMachine = createMachine<Context, RepayEvents, MachineState>({
  id: 'RepayMachine',
  initial: State.idle,
  predictableActionArguments: true,
  context: initialContext,
  on: {
    [Events.RUN]: {
      target: State.repay,
      actions: assign({
        error: (_) => initialContext.error,
        requireApproval: (_) => initialContext.requireApproval,
        infiniteApproval: (_) => initialContext.infiniteApproval,
      }),
    },
    [Events.SET_REQUIRE_APPROVAL]: {
      actions: assign({ requireApproval: (_context, event) => event.requireApproval }),
    },

    [Events.SET_INFINITE_APPROVAL]: {
      actions: assign({ infiniteApproval: (_context, event) => event.infiniteApproval }),
    },
  },
  states: {
    [State.idle]: {
      on: {
        [Events.RUN]: [
          { target: State.approve, cond: (context) => context.requireApproval },
          { target: State.repay },
        ],
      },
    },

    [State.approve]: {
      invoke: {
        src: ServiceNames.approveSUSD,
        onDone: {
          target: State.repay,
        },
        onError: {
          target: State.failed,
          actions: assign({
            error: (_context, event) => ({ error: event.data, step: FailedSteps.approve }),
          }),
        },
      },
    },
    [State.repay]: {
      invoke: {
        src: ServiceNames.executeRepay,
        onDone: {
          target: State.success,
        },
        onError: {
          target: State.failed,
          actions: assign({
            error: (_context, event) => ({ error: event.data, step: FailedSteps.repay }),
          }),
        },
      },
    },
    [State.failed]: {
      on: {
        [Events.RETRY]: [
          {
            target: State.approve,
            cond: (c) => c.error?.step === FailedSteps.approve,
            actions: assign({ error: (_) => null }),
          },

          {
            target: State.repay,
            cond: (c) => c.error?.step === FailedSteps.repay,
            actions: assign({ error: (_) => null }),
          },
        ],
      },
    },
    [State.success]: {},
  },
});
