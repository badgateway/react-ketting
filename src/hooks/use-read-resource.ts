import { useState, useEffect, useRef } from 'react';
import { Resource, State as ResourceState } from 'ketting';

type UseReadResourceResult<T> = {
  loading: boolean,
  error: Error|null,
  resourceState: ResourceState<T>
}

export function useReadResource<T>(resource: Resource<T>): UseReadResourceResult<T> {

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error|null>(null);
  const [resourceState, setResourceState] = useState<ResourceState<T>>();

  const isMounted = useRef(true);

  useEffect(() => {

    const onUpdate = useRef((state: State<T>) {
      if (isMounted.current) {
        setResourceState(state);
      }
    });

    (async() => {

      const state = await resource.get();
      setResourceState(state);
      setLoading(false);

      resource.on('update', onUpdate.current);

    }).catch(err => {

      setLoading(false);
      setError(err);

    }, () => {

      isMounted.current = false;
      resource.off(onUpdate.current);

    });

  }, [resource]);

  return {
    loading,
    error,
    resourceState: resourceState as ResourceState<T>
  }

}
