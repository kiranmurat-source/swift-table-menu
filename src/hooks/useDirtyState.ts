import { useState, useEffect, useRef } from 'react';

/**
 * Tracks whether form state has diverged from a baseline snapshot.
 * Pass `snapshotKey` to re-baseline when the form switches subjects (e.g.
 * editing a different item) — without it, switching items would falsely
 * register as dirty.
 */
export function useDirtyState<T>(currentState: T, snapshotKey: string | number | null) {
  const initialRef = useRef<string>(JSON.stringify(currentState));
  const keyRef = useRef<string | number | null>(snapshotKey);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (keyRef.current !== snapshotKey) {
      keyRef.current = snapshotKey;
      initialRef.current = JSON.stringify(currentState);
      setIsDirty(false);
      return;
    }
    setIsDirty(JSON.stringify(currentState) !== initialRef.current);
  }, [currentState, snapshotKey]);

  const markClean = () => {
    initialRef.current = JSON.stringify(currentState);
    setIsDirty(false);
  };

  const resetToInitial = (): T => {
    return JSON.parse(initialRef.current) as T;
  };

  return { isDirty, markClean, resetToInitial };
}
