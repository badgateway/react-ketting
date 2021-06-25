import { Resource, State as ResourceState } from 'ketting';
import { useState, useEffect } from 'react';
import { ResourceLike } from '../util';
import { useClient } from './use-client';
import { Client } from 'ketting';
import { useResolveResource } from './use-resolve-resource';

type UseReadResourceResponse<T> = {

  // True if there is no data yet
  loading: boolean;
  error: Error | null;

  /**
   * The ResourceState.
   *
   * Note that this will be `null` until loading is "false".
   */
  resourceState: ResourceState<T>;

  // The 'real' resource.
  resource: Resource<T>;

}

export type UseReadResourceOptions<T> = {
  resource: ResourceLike<T>,
  initialState?: ResourceState<T>,
  refreshOnStale?: boolean,

  /**
   * HTTP headers to include if there was no existing cache, and the initial
   * GET request must be done to get the state.
   *
   * These headers are not used on subsequent refreshes/stale cases.
   */
  initialGetRequestHeaders?: Record<string, string>;

};

/**
 * The useReadResource hook is an internal hook that helps setting up a lot of
 * the plumbing for dealing with resources and state.
 *
 * It's not recommended for external users to use this directly, instead use
 * one of the more specialized hooks such as useResource or useCollection.
 *
 * Example call:
 *
 * <pre>
 *   const {
 *     loading,
 *     error,
 *     resourceState,
 *  } = useResource(resource);
 * </pre>
 *
 * Returned properties:
 *
 * * loading - will be true as long as the result is still being fetched from
 *             the server.
 * * error - Will be null or an error object.
 * * resourceState - A state object. The `.data` property of this object will
 *                   contain the parsed JSON from the server.
 */
export function useReadResource<T>(options: UseReadResourceOptions<T>): UseReadResourceResponse<T> {

  const { resource } = useResolveResource(options.resource);

  const initialState = options.initialState;
  const refreshOnStale = options.refreshOnStale || false;
  const client = useClient();

  const [resourceState, setResourceState] = useResourceState(resource, initialState, client);
  const [loading, setLoading] = useState(resourceState === undefined);
  const [error, setError] = useState<null|Error>(null);

  useEffect(() => {

    // This effect is for setting up the onUpdate event
    if (resource === null) {
      return;
    }

    const onUpdate = (newState: ResourceState<T>) => {
      setResourceState(newState.clone());
      setLoading(false);
    };

    const onStale = () => {
      if (refreshOnStale) {
        resource
          .refresh()
          .catch(err => {
            setError(err);
          });
      }
    };

    resource.on('update', onUpdate);
    resource.on('stale', onStale);

    return function unmount() {
      resource.off('update', onUpdate);
      resource.off('stale', onStale);
    };

  }, [resource]);

  useEffect(() => {

    // This effect is for fetching the initial ResourceState
    if (resource===null) {
      // No need to fetch resourceState for these cases.
      return;
    }

    if (resourceState && resourceState.uri === resource.uri) {
      // Don't do anything if we already have a resourceState, and the
      // resourceState's uri matches what we got.
      return;
    }

    // The 'resource' property has changed, so lets get the new resourceState and data.
    const cachedState = resource.client.cache.get(resource.uri);
    if (cachedState) {
      setResourceState(cachedState);
      setLoading(false);
      return;
    } else {
      setResourceState(undefined);
      setLoading(true);
    }

    resource.get({ headers: options.initialGetRequestHeaders })
      .then(newState => {
        setResourceState(newState.clone());
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });

  }, [resource]);

  const result = {
    loading,
    error,
    resourceState: resourceState as ResourceState<T>,
    resource: resource as Resource<T>,
    data: (resourceState?.data) as T,
  };

  return result;

}

/**
 * Internal helper hook to deal with setting up the resource state, and
 * populate the cache.
 */
function useResourceState<T>(
  resource: Resource<T> | null,
  initialData: undefined | ResourceState<T>,
  client: Client,
): [ResourceState<T>|undefined, (rs: ResourceState<T>|undefined) => void] {

  let data: undefined| ResourceState<T> = undefined;
  if (initialData) {
    data = initialData
  } else if (resource instanceof Resource) {
    data = client.cache.get(resource.uri) || undefined;
  }
  const [resourceState, setResourceState] = useState<ResourceState<T>| undefined>(data);
  return [resourceState, setResourceState];

}
