import { Resource, State as ResourceState } from 'ketting';
import { useRef, useState, useEffect, useContext } from 'react';
import { getKettingContext } from '../provider';
import ResourceLifecycle from '../resource-lifecycle';
import { ResourceLike, resolveResource } from '../util';

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
} | {
  mode: 'POST',
  resource: ResourceLike<T>,
  initialState: T | ResourceState<T>,
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

  const kettingContext = useContext(getKettingContext());
  const [resource, setResource] = useState<Resource<T>>();

  let resourceLike: ResourceLike<T>;

  let mode : 'PUT' | 'POST';
  let initialState: ResourceState<T> | T | undefined;
  if (isUseResourceOptions(arg1)) {
    resourceLike = arg1.resource;
    mode = arg1.mode;
    initialState = arg1.initialState;
  } else {
    resourceLike = arg1;
    mode = 'PUT';
    initialState = undefined;
  }

  const isMounted = useRef(true);

  const [resourceState, setResourceState] = useState<ResourceState<T>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null|Error>(null);

  const lifecycle = useRef<ResourceLifecycle<T>>();

  useEffect( () => {
    if (!resource) {
      resolveResource(resourceLike, kettingContext)
        .then( res => { setResource(res); })
        .catch( err => {
          setError(err);
          setLoading(false);
        });
      return;
    }
    const onUpdate = (state: ResourceState<T>) => {
      if (isMounted.current) {
        setResourceState(state.clone());
      }
    };
    lifecycle.current = new ResourceLifecycle(resource, mode, initialState, onUpdate);

    (async() => {
      setResourceState(await lifecycle.current!.getState());
      setLoading(false);
    })().catch(err => {
      setError(err);
      setLoading(false);
    });

    return function cleanup() {
      lifecycle.current!.cleanup();
    };
  }, [resource]);

  if (loading) {
    return {
      loading,
      error,
      resourceState: resourceState as ResourceState<T>,
      resource: resource as Resource<T>,
      data: (resourceState ? resourceState.data : undefined) as T,
      setResourceState: (state: ResourceState<T>) => {
        throw new Error('Loading must complete before calling setResourceState');
      },
      setData: (newData: T) => {
        throw new Error('Loading must complete before calling setData');
      },
      submit: () => {
        throw new Error('Loading must complete before calling submit');
      }
    };

  } else {

    if (lifecycle.current===undefined) {
      throw new Error('State error: lifecycle is not available after loading is complete. This is a bug');
    }

    return {
      loading,
      error,
      resourceState: resourceState as ResourceState<T>,
      resource: resource as Resource<T>,
      data: (resourceState ? resourceState.data : undefined) as T,
      setResourceState: (state: ResourceState<T>) => {
        return lifecycle.current!.setState(state);
      },
      setData: (newData: T) => {
        lifecycle.current!.setData(newData);
      },
      submit: () => {
        return lifecycle.current!.submit();
      }
    };
  }

}


function isUseResourceOptions<T>(input: any | UseResourceOptions<T>): input is UseResourceOptions<T> {

  return input.mode === 'PUT' || input.mode === 'POST';

}
