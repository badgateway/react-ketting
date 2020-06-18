import { Resource, State as ResourceState } from 'ketting';
import { useRef, useState, useEffect } from 'react';
import ResourceLifecycle from '../resource-lifecycle';

type UseResourceResponse<T> = {

  loading: boolean;
  error: Error | null;

  resourceState: ResourceState<T>;
  setResourceState: (newState: ResourceState<T>) => void;
  submit: (state?: ResourceState<T>) => void;

  data: T;
  setData: (newData: T) => void;

}

export function useResource<T>(resource: Resource, mode?: 'PUT', initialData?: ResourceState<T>): UseResourceResponse<T>;
export function useResource<T>(parentResource: Resource, mode: 'POST', initialData: ResourceState<T>): UseResourceResponse<T>;
export function useResource<T>(resource: Resource, mode: 'POST' | 'PUT' = 'PUT', initialData?: ResourceState<T>): UseResourceResponse<T> {

  const isMounted = useRef(true);

  const [resourceState, setResourceState] = useState<ResourceState<T>|undefined>(initialData);
  const [loading, setLoading] = useState(resourceState !== undefined);
  const [error, setError] = useState<null|Error>(null);

  const lifecycle = useRef<ResourceLifecycle<T>>();

  useEffect( () => {
    const onUpdate = (state: ResourceState<T>) => {
      if (isMounted.current) {
        setResourceState(state);
      }
    }
    lifecycle.current = new ResourceLifecycle(resource, mode, initialData, onUpdate);

    (async() => {
      setResourceState(await lifecycle.current!.getState());
      setLoading(false);
    })().catch(err => {
      setLoading(false);
      setError(err);
    });

    return function cleanup() {
      lifecycle.current!.cleanup();
    }
  }, [resource]);

  const activeResource = useRef(resource);

  if (loading) {
    return {
      loading,
      error,
      resourceState: resourceState as ResourceState<T>,
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
    }

  } else {

    if (lifecycle.current===undefined) {
      throw new Error('State error: lifecycle is not available after loading is complete. This is a bug');
    }

    return {
      loading,
      error,
      resourceState: resourceState as ResourceState<T>,
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
