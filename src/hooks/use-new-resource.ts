import { Resource, State as ResourceState, BaseState, Client, Links } from 'ketting';
import { useState } from 'react';

import { ResourceLike } from '../util';
import { useReadResource } from './use-read-resource';
import { useResolveResource } from './use-resolve-resource';
import { UseResourceResponse } from './use-resource';
import { useClient } from './use-client';


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
 *     error,
 *     resourceState,
 *     setResourceState,
 *     submit
 *  } = useResource(resource);
 * </pre>
 *
 * Returned properties:
 *
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
export function useNewResource<T>(targetResource: ResourceLike<any>|string, options: UseNewResourceOptions<T>): UseResourceResponse<T> {

  const client = useClient();
  const [resource, setResource] = useState<Resource<T>>(() => createSyntheticResource<T>(client, options));

  const { resource: realTargetResource } = useResolveResource(targetResource);

  const useResourceResult = useReadResource<T>(resource, {
    refreshOnStale: options?.refreshOnStale
  });

  return {
    loading: resource !== null,
    error: useResourceResult.error,
    resourceState: useResourceResult.resourceState,
    setResourceState: newResourceState => {
      resource.updateCache(newResourceState);
    },
    submit: async() => {

      if (resource.uri.startsWith('urn:uuid:')) {
        // Creating a new resource. Yay!
        if (!realTargetResource) {
          throw new Error('Tried to create a new resource on a collection that wasn\'t fully loaded');
        }
        const newResource = await realTargetResource.postFollow(useResourceResult.resourceState);
        setResource(newResource);
      } else {
        // Updating an earlier resource
        resource.put(useResourceResult.resourceState);
      }
      throw new Error('TODO');

    },
    data: useResourceResult.resourceState.data,
    setData: (data) => {
      useResourceResult.resourceState.data = data;
      resource.updateCache(useResourceResult.resourceState);
    },
    resource,
  }

}

function createSyntheticResource<T>(client: Client, options: UseNewResourceOptions<T>): Resource<T> {

  // Create a unique fake URI.
  const uri = `urn:uuid:${uuidv4()}`;
  
  // Open this URI. Ketting does not do HTTP requests unless asked, so this is
  // safe.
  const resource = client.go(uri);

  let resourceState: ResourceState<T>;

  // Build the 'resourceState'
  if ('initialData' in options) {
    resourceState = new BaseState({
      uri,
      client,
      headers: new Headers(),
      data: options.initialData,
      links: new Links(uri),
    });
  } else {
    resourceState = options.initialState.clone();
    // Fix the uri or else it might get weird
    resourceState.uri = uri;
  }

  // Prime the cache
  resource.updateCache(resourceState);
  return resource;

}

/**
 * Taken from https://stackoverflow.com/a/68141099/80911
 */
function uuidv4() {
  const a = crypto.getRandomValues(new Uint16Array(8));
  let i = 0;
  return '00-0-4-1-000'.replace(/[^-]/g, 
      (s:string) => (a[i++] + (+s) * 0x10000 >> +(s)).toString(16).padStart(4, '0')
  );
}

