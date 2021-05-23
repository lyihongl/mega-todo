import { DependencyList, EffectCallback, useEffect, useRef } from "react";

export default function useUpdateEffect(
  effect: EffectCallback,
  deps?: DependencyList
) {
  const isInitialMount = useRef(false);
  useEffect(() => {
    if (isInitialMount.current) {
      effect();
    } else {
      isInitialMount.current = true;
    }
  }, deps);
}
