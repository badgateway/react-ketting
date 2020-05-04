import { useState, useEffect } from 'react';
import { State, Resource } from 'ketting';

type UseResourceResult<T> = {
  loading: true,
  error: null,
  body: null,
  state: null,
} | {
  loading: false,
  error: Error,
  body: null,
  state: null,
} | {
  loading: false,
  error: null,
  body: T
  state: State<T>,
};

export function useResource<T>(resource: Resource<T>): UseResourceResult<T> {

  const [state, updateState] = useState<State<T>|null>(null);
  const [loading, updateLoading] = useState<boolean>(false);
  const [error, updateError] = useState<Error|null>(null);

  useEffect(() => {
    
    (async() => {

      try {
        const resState = await resource.get();
        updateLoading(false);
        updateState(resState);
      } catch (err) {

        updateLoading(false);
        updateError(err);

      }

    })();

  }, [resource]);

  return {
    loading,
    error,
    body: state ? state.body : null,
    state,
  } as UseResourceResult<T>;

}
