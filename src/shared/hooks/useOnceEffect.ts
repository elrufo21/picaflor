import { useEffect, useRef, type EffectCallback, type DependencyList } from "react";

export function useOnceEffect(effect: EffectCallback, deps: DependencyList = []) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) {
      return;
    }

    hasRun.current = true;
    return effect();
  }, deps);
}
