import { useCallback, useState } from "react";

// 最大历史记录数量
const MAX_HISTORY_SIZE = 50;

export function useHistory<T>(initialState: T, maxSize: number = MAX_HISTORY_SIZE) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialState);
  const [future, setFuture] = useState<T[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const set = useCallback((newStateOrUpdater: T | ((prev: T) => T)) => {
    setPast(prev => {
      const newPast = [...prev, present];
      // 限制历史记录数量
      return newPast.slice(-maxSize);
    });
    
    // 判断是函数还是值
    const newState = typeof newStateOrUpdater === 'function'
      ? (newStateOrUpdater as (prev: T) => T)(present)
      : newStateOrUpdater;
    
    setPresent(newState);
    setFuture([]);  // 清空 future
  }, [present, maxSize]);

  const undo = useCallback(() => {
    if (!canUndo) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setPresent(previous);
    setFuture([present, ...future]);
  }, [canUndo, past, present, future]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast([...past, present]);
    setPresent(next);
    setFuture(newFuture);
  }, [canRedo, past, present, future]);

  const reset = useCallback((newState: T) => {
    setPast([]);
    setPresent(newState);
    setFuture([]);
  }, []);

  return {
    state: present,
    set,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  };
}