import { useClient } from './use-client';
import { ResourceLike } from '../util';
import { Resource, Client } from 'ketting';
import { useState, useEffect } from 'react';

type UseResolveResourceResult<T> = {
  error: Error | null,
  resource: Resource<T> | null,
}

/**
 * This is an internal hook that takes a 'ResourceLike', and turns it into
 * a real materialized resource.
 */
export function useResolveResource<T>(resourceLike: ResourceLike<T>|string): UseResolveResourceResult<T> {

  const client = useClient();
  const [resource, setResource] = useState<Resource<T> | null>(quickResolve(client, resourceLike));
  const [error, setError] = useState<Error| null>(null);

  useEffect(() => {

    const newRes = quickResolve(client, resourceLike);
    if (newRes) {
      setResource(newRes);
      return;
    }
    Promise.resolve(resourceLike as PromiseLike<Resource<T>>)
      .then( res => {
        setResource(res);
      })
      .catch( err => {
        setError(err);
      });

  }, [resourceLike]);

  return {
    resource,
    error
  };

}

/**
 * Helper function that will immediately return a resource for a resourcelike,
 * but only if this can be done synchronously.
 */
function quickResolve<T>(client: Client, resourceLike: ResourceLike<T>): Resource<T> | null {

  if (typeof resourceLike === 'string') {
    return client.go(resourceLike);
  }
  if (resourceLike instanceof Resource) {
    return resourceLike;
  }
  return null;

}
