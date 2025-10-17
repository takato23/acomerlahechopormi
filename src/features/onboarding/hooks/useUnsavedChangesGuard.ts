import { useCallback, useContext, useEffect } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';

type Transition = {
  retry: () => void;
};

type BlockerFunction = (tx: Transition) => void;

function useBlocker(blocker: BlockerFunction, when = true) {
  const navigationContext = useContext(UNSAFE_NavigationContext);
  const navigator = navigationContext?.navigator as { block?: (cb: (tx: Transition) => void) => () => void } | undefined;

  useEffect(() => {
    if (!when) return;
    if (!navigator?.block) return;

    const unblock = navigator.block((tx: Transition) => {
      const autoUnblockingTx = {
        ...tx,
        retry() {
          unblock();
          tx.retry();
        }
      };
      blocker(autoUnblockingTx);
    });

    return unblock;
  }, [navigator, blocker, when]);
}

export function useUnsavedChangesGuard(hasUnsavedChanges: boolean, message = 'Tienes cambios sin guardar. ¿Seguro que quieres salir?') {
  const blocker = useCallback(
    (tx: Transition) => {
      if (!hasUnsavedChanges) {
        tx.retry();
        return;
      }
      const confirmed = window.confirm(message);
      if (confirmed) {
        tx.retry();
      }
    },
    [hasUnsavedChanges, message]
  );

  useBlocker(blocker, hasUnsavedChanges);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    if (typeof window === 'undefined') return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);
}
