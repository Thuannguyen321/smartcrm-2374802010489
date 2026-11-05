import { useCallback, useEffect, useState } from 'react';

/** Goi mot ham async va theo doi 3 trang thai: dang tai / loi / du lieu. */
export function useAsync(fn, deps) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => !cancelled && setState({ loading: false, error: null, data }))
      .catch((error) => !cancelled && setState({ loading: false, error, data: null }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => run(), [run]);
  return { ...state, reload: run };
}
