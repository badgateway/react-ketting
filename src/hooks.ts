import { useState, useEffect } from 'react';
import { State, Resource } from 'ketting';

type UseResourceResult<T> = {
  loading: boolean
  error: null | Error,
  data: T,
  resourceState: State<T>,
};

export function useResource<T>(resource: Resource<T>): UseResourceResult<T> {

  const [result, updateResult] = useState<UseResourceResult<T>>({
    loading: true,
    error: null,
    // These are lies to make the API nicer to use.
    data: null as any,
    resourceState: null as any,
  });

  useEffect(() => {

    const stateListener = (newState: State) => {

      updateResult({
        loading: false,
        error: null,
        resourceState: newState,
        data: newState.data
      });

    }

    (async() => {

      try {
        const resState = await resource.get();
        updateResult({
          loading: false,
          error: null,
          resourceState: resState,
          data: resState.data
        });

        resource.on('update', stateListener);

      } catch (err) {
        updateResult({
          loading: false,
          error: err,
          // More lies
          resourceState: null as any,
          data: null as any,
        });
      }

    })().catch( err => {
      updateResult({
        loading: false,
        error: err,
        resourceState: null as any,
        data: null as any,
      })
    });

    return () => {
      resource.off('update', stateListener);
    };

  }, [resource]);

  return result;

}
