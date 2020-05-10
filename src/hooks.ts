import { useState, useEffect } from 'react';
import { State, Resource } from 'ketting';

type UseResourceResult<T> = {
  loading: boolean
  error: null | Error,
  body: T,
  state: State<T>,
};

export function useResource<T>(resource: Resource<T>): UseResourceResult<T> {

  const [result, updateResult] = useState<UseResourceResult<T>>({
    loading: true,
    error: null,
    // These are lies to make the API nicer to use.
    body: null as any,
    state: null as any,
  });

  useEffect(() => {

    (async() => {

      try {
        const resState = await resource.get();
        updateResult({
          loading: false,
          error: null,
          state: resState,
          body: resState.body
        });
      } catch (err) {
        updateResult({
          loading: false,
          error: err,
          // More lies
          state: null as any,
          body: null as any,
        });

      }

    })().catch( err => {
      updateResult({
        loading: false,
        error: err,
        state: null as any,
        body: null as any,
      })
    });

  }, [resource]);

  return result;

}
