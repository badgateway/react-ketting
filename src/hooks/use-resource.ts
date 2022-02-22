import { Resource, State as ResourceState, HalState, isState, Links } from 'ketting';
import { useState, useEffect } from 'react';
import { ResourceLike } from '../util';
import { useClient } from './use-client';
import { useResolveResource } from './use-resolve-resource';
import { Client } from 'ketting';

type UseResourceResponse<T> = {

  // True if there is no data yet
  loading: boolean;
  error: Error | null;

  // A full Ketting State object
  resourceState: ResourceState<T>;

  // Update the state
  setResourceState: (newState: ResourceState<T>) => void;

  // Send the state to the server via a PUT or POST request.
  submit: (state?: ResourceState<T>) => void;

  // The 'data' part of the state.
  data: T;

  // Update the data from the state.
  setData: (newData: T) => void;

  // The 'real' resource.
  resource: Resource<T>;

}

export type UseResourceOptions<T> = {
  mode: 'PUT',
  initialState?: T | ResourceState<T>,
  refreshOnStale?: boolean,
} | {
  mode: 'POST',
  initialState: T | ResourceState<T>,
  refreshOnStale?: boolean,
}

/**
 * The useResource hook allows you to GET and PUT the state of
 * a resource.
 *
 * Example call:
 *
 * <pre>
 *   const {
 *     loading,
 *     error,
 *     resourceState,
 *     setResourceState,
 *     submit
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
 * * setResourceState - Update the local cache of the resource.
 * * submit - Send a PUT request to the server.
 *
 * If you don't need the full resourceState, you can also use the `data` and
 * `setData` properties instead of `resourceState` or `useResourceState`.
 *
 * It's also possible to use useResource for making new resources. In this case
 * a POST request will be done instead on a 'collection' resource.
 *
 * If the response to the POST request is 201 Created and has a Location header,
 * subsequent calls to `submit()` turn into `PUT` requests on the new resource,
 * fully managing the lifecycle of creation, and subsequent updates to the
 * resource.
 *
 * Example call:
 *
 * <pre>
 *   const {
 *     loading,
 *     error,
 *     data,
 *     setData,
 *     submit
 *  } = useResource({
 *    resource: resource,
 *    mode: 'POST',
 *    initialState: { foo: bar, title: 'New article!' }
 *  });
 * </pre>
 *
 * To do POST requests you must specifiy initialState with the state the user starts
 * off with.
 */
export function useResource<T>(resourceLike: ResourceLike<T>|string, options?: UseResourceOptions<T>): UseResourceResponse<T> {

  const { resource, setResource, error: resolveError } = useResolveResource(resourceLike);
  const client = useClient();
  const [resourceState, setResourceState] = useResourceState(
    typeof resourceLike === 'string' ? client.go(resourceLike) : resourceLike,
    options?.initialState ?? undefined,
    client,
  );
  const [loading, setLoading] = useState(resourceState === undefined);
  const [error, setError] = useState<null|Error>(null);
  const [modeVal, setModeVal] = useState<'POST' | 'PUT'>(options?.mode ?? 'PUT');

  useEffect(() => {

    // This effect is for setting up the onUpdate event
    if (!resource || modeVal === 'POST') {
      return;
    }

    const onUpdate = (newState: ResourceState<T>) => {
      setResourceState(newState.clone());
      setLoading(false);
    };

    const onStale = () => {
      if (options?.refreshOnStale ?? false) {
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
    if (!resource || modeVal === 'POST') {
      // No need to fetch resourceState for these cases.
      return;
    }

    if (resourceState && resourceState.uri === resource.uri) {
      // Don't do anything if we already have a resourceState, and the
      // resourceState's uri matches what we got.
      //
      // This likely means we got the resourceState from the initial
      // useResourceState hook.
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

    resource.get()
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
    error: error ?? resolveError,
    resourceState: resourceState as ResourceState<T>,
    setResourceState: (newState: ResourceState<T>) => {
      if (!resource) {
        throw new Error('Too early to call setResourceState, we don\'t have a current state to update');
      }
      if (modeVal === 'POST') {
        setResourceState(newState);
      } else {
        resource.updateCache(newState);
      }
    },
    resource: resource as Resource<T>,
    submit: async () => {
      if (!resourceState || !resource) {
        throw new Error('Too early to call submit()');
      }
      if (modeVal === 'POST') {
        const newResource = await resource.postFollow(resourceState);
        setResource(newResource);
        setModeVal('PUT');
      } else {
        await resource.put(resourceState);
      }

    },
    data: (resourceState?.data) as T,
    setData: (data: T) => {
      if (!resourceState || !resource) {
        throw new Error('Too early to call setData, we don\'t have a current state to update');
      }
      resourceState.data = data;
      if (modeVal === 'POST') {
        setResourceState(resourceState);
      } else {
        resource.updateCache(resourceState);
      }
    }

  };

  return result;

}

/**
 * Internal helper hook to deal with setting up the resource state, and
 * populate the cache.
 */
function useResourceState<T>(resource: Resource<T> | PromiseLike<Resource<T>>, initialData: undefined | T | ResourceState<T>, client: Client): [ResourceState<T>|undefined, (rs: ResourceState<T>|undefined) => void] {

  let data: undefined| ResourceState<T> = undefined;
  if (initialData) {
    data = isState(initialData) ? initialData : dataToState(initialData, client);
  } else if (resource instanceof Resource) {
    data = client.cache.get(resource.uri) || undefined;
  }
  const [resourceState, setResourceState] = useState<ResourceState<T>| undefined>(data);
  return [resourceState, setResourceState];

}

/**
 * Take data and wraps it in a State object.
 *
 * For now this will always return a HalState object, because it's a
 * reasonable default, but this may change in the future.
 */
function dataToState<T>(data: T, client: Client): ResourceState<T> {

  return new HalState({
    uri: 'about:blank' + Math.random(),
    client,
    data,
    headers: new Headers(),
    links: new Links('about:blank'),
  });

}
