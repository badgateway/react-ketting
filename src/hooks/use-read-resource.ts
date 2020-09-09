import { useState, useEffect, useRef, useContext } from 'react';
import { Resource, State as ResourceState } from 'ketting';
import { getKettingContext } from '../provider';
import { ResourceLike ,resolveResource } from '../util';

type UseReadResourceResult<T> = {

  /**
   * 'true' if resource has not yet been fetched from the server.
   */
  loading: boolean,

  /**
   * Contains an Error object when an operation has failed.
   */
  error: Error|null,

  /**
   * Full Ketting 'State' object.
   */
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
export function useReadResource<T>(resource: ResourceLike<T>): UseReadResourceResult<T> {

  const kettingContext = useContext(getKettingContext());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error|null>(null);
  const [resourceState, setResourceState] = useState<ResourceState<T>>();
  const [res, setRes] = useState<Resource<T>>();

  const isMounted = useRef(true);

  useEffect(() => {

    if (!res) {
      resolveResource(resource, kettingContext)
        .then( result => { setRes(result); })
        .catch( err => {
          setError(err);
          setLoading(false);
        });
      return;
    }

    const onUpdate = useRef((state: ResourceState<T>) => {
      if (isMounted.current) {
        setResourceState(state);
      }
    });

    (async() => {

      const state = await res.get();
      setResourceState(state);
      setLoading(false);

      res.on('update', onUpdate.current);

    })().catch(err => {

      setLoading(false);
      setError(err);

    });

    return function cleanup() {

      isMounted.current = false;
      res.off('update', onUpdate.current);

    };

  }, [res]);

  return {
    loading,
    error,
    resourceState: resourceState as ResourceState<T>
  };

}
