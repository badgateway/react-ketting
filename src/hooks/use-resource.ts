import { Resource, State as ResourceState, HalState, isState, Links } from 'ketting';
import { useState, useEffect } from 'react';
import { ResourceLike } from '../util';
import { useClient } from './use-client';

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

type UseResourceOptions<T> = {
  mode: 'PUT',
  resource: ResourceLike<T>,
  initialState?: T | ResourceState<T>,
  refreshOnStale?: boolean,
} | {
  mode: 'POST',
  resource: ResourceLike<T>,
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
export function useResource<T>(resource: ResourceLike<T>|string): UseResourceResponse<T>;
export function useResource<T>(options: UseResourceOptions<T>): UseResourceResponse<T>;
export function useResource<T>(arg1: ResourceLike<T>|UseResourceOptions<T>|string): UseResourceResponse<T> {

  const [resourceLike, mode, initialData, refreshOnStale] = getUseResourceOptions(arg1);
  const [resource, setResource] = useState<Resource<T> | undefined>(resourceLike instanceof Resource ? resourceLike : undefined);
  const [resourceState, setResourceState] = useResourceState(resourceLike, initialData);
  const [loading, setLoading] = useState(resourceState === undefined);
  const [error, setError] = useState<null|Error>(null);
  const [modeVal, setModeVal] = useState<'POST' | 'PUT'>(mode);
  const client = useClient();

  useEffect(() => {

    // This effect is for finding the real Resource object
    if (resourceLike instanceof Resource) {
      setResource(resourceLike);
    } else if (typeof resourceLike === 'string') {
      setResource(client.go(resourceLike));
    } else {
      Promise.resolve(resourceLike).then( newRes => {
        setResource(newRes);
      }).catch(err => {
        setError(err);
        setLoading(false);
      });
    }

  }, [resourceLike]);

  useEffect(() => {

    // This effect is for setting up the onUpdate event
    if (!resource || mode === 'POST') {
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
    error,
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
 * A helper function to process the overloaded arguments of useResource, and return a consistent result
 */
function getUseResourceOptions<T>(arg1: ResourceLike<T>|UseResourceOptions<T>|string): [Resource<T> | PromiseLike<Resource<T>>, 'POST' | 'PUT', T | ResourceState<T> | undefined, boolean] {

  const client = useClient();
  let mode : 'POST' | 'PUT';
  let initialState;
  let res;
  let refreshOnStale;

  if (isUseResourceOptions(arg1)) {
    mode = arg1.mode;
    initialState = arg1.initialState;
    res = arg1.resource;
    refreshOnStale = arg1.refreshOnStale ?? false;
  } else {
    mode = 'PUT';
    initialState = undefined;
    res = arg1;
    refreshOnStale = false;
  }

  return [
    typeof res === 'string' ? client.go(res) : res,
    mode,
    initialState,
    refreshOnStale,
  ];

}

/**
 * Internal helper hook to deal with setting up the resource state, and
 * populate the cache.
 */
function useResourceState<T>(resource: Resource<T> | PromiseLike<Resource<T>>, initialData: undefined | T | ResourceState<T>): [ResourceState<T>|undefined, (rs: ResourceState<T>|undefined) => void] {

  let data: undefined| ResourceState<T> = undefined;
  if (initialData) {
    data = isState(initialData) ? initialData : dataToState(initialData);
  } else if (resource instanceof Resource) {
    data = resource.client.cache.get(resource.uri) || undefined;
  }
  const [resourceState, setResourceState] = useState<ResourceState<T>| undefined>(data);
  return [resourceState, setResourceState];

}

function isUseResourceOptions<T>(input: any | UseResourceOptions<T>): input is UseResourceOptions<T> {

  return input.mode === 'PUT' || input.mode === 'POST';

}

/**
 * Take data and wraps it in a State object.
 *
 * For now this will always return a HalState object, because it's a
 * reasonable default, but this may change in the future.
 */
function dataToState<T>(data: T): ResourceState<T> {

  return new HalState(
    'about:blank',
    data,
    new Headers(),
    new Links('about:blank'),
    [],
  );

}
