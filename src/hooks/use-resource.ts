import { Resource, State as ResourceState } from 'ketting';
import { ResourceLike } from '../util';
import { useReadResource } from './use-read-resource';

/**
 * The result of a useResource hook.
 */
export type UseResourceResponse<T> = {
  // True if there is no data yet
  loading: boolean;

  // Will contain an Error object, if an error occurred
  error: Error | null;

  // A full Ketting State object
  resourceState: ResourceState<T>;

  // Update the state
  setResourceState: (newState: ResourceState<T>) => void;

  // Send the state to the server via a PUT or POST request.
  submit: (state?: ResourceState<T>) => Promise<void>;

  // The 'data' part of the state.
  data: T;

  // Update the data from the state.
  setData: (newData: T) => void;

  // The 'real' resource.
  resource: Resource<T>;
};
export type UseResourceOptions<T> = {
  initialState?: T | ResourceState<T>;
  refreshOnStale?: boolean;
};


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
 */
export function useResource<T = any>(resourceLike: ResourceLike<any>, options?: UseResourceOptions<T>): UseResourceResponse<T> {

  if (resourceLike===undefined) {
    console.warn('useResource was called with "undefined" as the "resourceLike" argument. This is a bug. Did you forget to wait for \'loading\' to complete somewhere?');
  }

  const { resourceState, loading, error, resource } = useReadResource(resourceLike,
    {
      refreshOnStale: options?.refreshOnStale,
    }
  );

  const setResourceState = (newState: ResourceState<T>) => {
    if (!resource) {
      throw new Error('Too early to call setResourceState, we don\'t have a current state to update');
    }
    resource.updateCache(newState);
  };
  const submit = async () => {
    if (!resourceState || !resource) {
      throw new Error('Too early to call submit()');
    }
    await resource.put(resourceState);
  };

  const setData = (newData: T) => {
    if (!resourceState || !resource) {
      throw new Error('Too early to call setData, we don\'t have a current state to update');
    }
    resourceState.data = newData;
    setResourceState(resourceState);
  };

  return {
    loading,
    error,
    data: resourceState?.data,
    setData,
    resourceState,
    setResourceState,
    resource,
    submit,
  };

}
