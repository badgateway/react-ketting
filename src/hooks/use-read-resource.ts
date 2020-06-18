import { useState, useEffect, useRef } from 'react';
import { Resource, State as ResourceState } from 'ketting';

type UseReadResourceResult<T> = {
  loading: boolean,
  error: Error|null,
  resourceState: ResourceState<T>
}

/**
 * Hook for fetching and subscribing to state changes on Ketting resources.
 *
 * The hook returns an object with three properties:
 * 1. loading (boolean)
 * 2. error (Error|null)
 * 3. resourceState - A ketting State object.
 *
 * The hook will automatically update its internal state if Ketting received
 * 'update' events.
 *
 * Example usage:
 *
 * <pre>
 *  function MyComponent(resource: Resource<Article>) {
 *
 *     const {loading, error, resourceState} = useReadResource(resource);
 *     if (loading) return <p>Loading...</p>;
 *     if (error) return <div class="error">Error: ${err.message}</div>
 *
 *     return <article>
 *       <h1>${resourceState.title}</h1>
 *       <p>${resoourceState.body}</p>
 *     </article>;
 *
 *  }
 * </pre>
 *
 */
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
