const WARNING_MESSAGE =
  'recast-navigation found a recast object that was not cleaned up properly.\n' +
  'It was destroyed automatically in this case, but this functionality is not reliable.\n' +
  'Make sure to call destroy() once you are done with recast objects.';

declare class FinalizationRegistry {
  constructor(cleanupCallback: (heldValue: any) => void);
  register(target: object, heldValue: any, unregisterToken?: object): void;
  unregister(unregisterToken: object): void;
}

const createNoopFinalizer = () => ({
  register: () => {},
  unregister: () => {},
});

const createFinalizer = () => {
  const registry = new FinalizationRegistry((callback: () => void) => {
    console.warn(WARNING_MESSAGE);
    callback();
  });

  return {
    register: (target: { destroy: () => void }) => {
      registry.register(target, () => target.destroy(), target);
    },
    unregister: (target: any) => {
      registry.unregister(target);
    },
  };
};

export const finalizer = globalThis.FinalizationRegistry
  ? createFinalizer()
  : createNoopFinalizer();
