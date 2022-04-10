import { Resource, State as ResourceState, HalState, Client, Links } from 'ketting';
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
 * useNewResource is a hook that helps you create new resources on a typical
 * REST api.
 *
 * This hook is for a specific use-case in React application; use this hook
 * if you want to present the user a form to create the resource, and after
 * creation the user *stays* on that form and continues editing after
 * creation.
 *
 * If you're just looking for a way to do a POST request and redirect/refresh
 * the interface, don't use this hook. Instead, you probably just want to call
 * `someResource.postFollow()` in an event handler and do something specific
 * after it was successful.
 *
 * A general guideline of when this component is useful is if 'creating'
 * and 'editing' is continuous and not really discernable from a UX
 * perspective.
 *
 * The assumptions this hooks makes:
 *
 * 1. You create new resources with POST requests.
 * 2. The body of the POST request is the same (or similar enough) to the
 *    body of the resource you're eventually creating.
 * 3. The server returns a 201 Created status code when successful.
 * 4. The server also returns a Location header referring to the new resource.
 * 5. After creation, any changes the user makes result in a `PUT` request to
 *    the new location.
 *
 * Example call:
 *
 * <pre>
 *   const {
 *     error,
 *     resourceState,
 *     setResourceState,
 *     submit
 *  } = useNewResource(targetResource, { initialData: { foo: bar });
 * </pre>
 *
 * You must pass some 'initial data' to this function that's used to
 * initialize the data object. Think of this as the 'template' or starting
 * value.
 *
 * Instead of 'initialData', you may also pass 'initialState', which requires
 * a fully fledged 'State' object.
 *
 *
 * Returned properties:
 *
 * * error - Will be null or an error object.
 * * resourceState - A state object. The `.data` property of this object will
 *                   contain the parsed JSON from the server.
 * * setResourceState - Update the local cache of the resource.
 * * submit - When called the first time, sends a POST request to the
 *            collection/target resource. The second time it will send a PUT
 *            request to the previously created resource.
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

    },
    data: useResourceResult.resourceState.data,
    setData: (data) => {
      useResourceResult.resourceState.data = data;
      resource.updateCache(useResourceResult.resourceState);
    },
    resource,
  };

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
    resourceState = new HalState({
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

