import { Resource, State as ResourceState } from 'ketting';
import { ResourceLike } from '../util';
import { useReadResource } from './use-read-resource';

/**
 * The result of a useCollection hook.
 */
type UseResourceSimpleResponse<T> = {

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
export type UseResourceSimpleOptions<T> = {
  initialState?: T | ResourceState<T>;
  refreshOnStale?: boolean;
};

/**
 * Options that may be given to useCollection
 */
export type UseCollectionOptions = {

  /**
   * By default useCollection will follow the 'item' relation type to find
   * collection members.
   *
   * Change this option to follow a list of other links.
   */
  rel?: string;

  /**
   * If the collection receives 'stale' events and this is set to true,
   * this will automatically grab the latest version from the server.
   *
   * 'stale' events are emitted by a number of different processes, such as
   * unsafe methods on the collection, or even manually triggered.
   */
  refreshOnStale?: boolean;
}


/**
 * useResourceSimple is a useResource replacement.
 *
 * It currently exists as a basis for experimentation to reduce the complexity of useResource.
 * The main thing that's not implemented is support for 'POST'
 */
export function useResourceSimple<T = any>(resourceLike: ResourceLike<any>, options?: UseResourceSimpleOptions<T>): UseResourceSimpleResponse<T> {

  if (resourceLike===undefined) {
    console.warn('useCollection was called with "undefined" as the "resourceLike" argument. This is a bug. Did you forget to wait for \'loading\' to complete somewhere?');
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
  }
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
  }

  return {
    loading,
    error,
    data: resourceState.data,
    setData,
    resourceState,
    setResourceState,
    resource,
    submit,
  };

}
