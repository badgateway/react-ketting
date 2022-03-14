import { Resource, State as ResourceState } from 'ketting';
import { ResourceLike } from '../util';
import { useResourceSimple } from './use-resource-simple';

type UseNewResourceResponse<T> = {

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

export type UseNewResourceOptions<T> = {
  initialState: ResourceState<T>;
  refreshOnStale?: boolean;
} | {
  initialData: T;
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
export function useNewResource<T>(resourceLike: ResourceLike<T>|string, options?: UseNewResourceOptions<T>): UseNewResourceResponse<T> {

  return useResourceSimple(
    resourceLike,
    options
  );

}
