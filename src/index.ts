import { useState, useEffect } from 'react';
import { State, Resource } from 'ketting';

type UseResourceResult<T> =
  [true, null, null] |
  [false, Error, null] |
  [false, null, State<T>];

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

  return [loading, error, state] as UseResourceResult<T>;

}
