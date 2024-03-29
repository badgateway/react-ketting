import { Resource, State as ResourceState } from 'ketting';
import { useMemo } from 'react';
import { ResourceLike } from '../util';
import { useReadResource } from './use-read-resource';

/**
 * The result of a useCollection hook.
 */
type UseCollectionResponse<T> = {

  /**
   * True if there is no data or no error yet
   */
  loading: boolean;

  /**
   * Will contain an Error object if an error occurred anywhere in the
   */
  error: Error | null;

  /**
   * List of collection members.
   *
   * This starts off as an empty array.
   */
  items: Resource<T>[];

  /**
   * A reference to the collection resource
   */
  resource: Resource<T>;

  /**
   * Reference to the Resource State. Some collections might emit some
   * data on their own, such as the total number of items.
   *
   * This gives you access to that underlying data.
   */
  resourceState: ResourceState<T>;

}

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
 * The useCollection hook allows you to get a list of resources
 * inside a collection.
 *
 * This hook makes a few assumptions:
 *
 * 1. The collection is some hypermedia document, such as HAL, HTML, Siren,
 *    or anything Ketting supports.
 * 2. The collection lists its members via 'item' web links.
 *
 * Example call:
 *
 * <pre>
 *   const {
 *     loading,
 *     error,
 *     items
 *  } = useResource<Article>(resource);
 * </pre>
 *
 * The resource may be passed as a Resource object, a Promise<Resource>, or a
 * uri string.
 *
 * Returned properties:
 *
 * * loading - will be true as long as the result is still being fetched from
 *             the server.
 * * error - Will be null or an error object.
 * * items - Will contain an array of resources, each typed Resource<T> where
 *           T is the passed generic argument.
 */
export function useCollection<T = any>(resourceLike: ResourceLike<any>, options?: UseCollectionOptions): UseCollectionResponse<T> {

  if (resourceLike===undefined) {
    console.warn('useCollection was called with "undefined" as the "resourceLike" argument. This is a bug. Did you forget to wait for \'loading\' to complete somewhere?');
  }

  const rel = options?.rel || 'item';

  const { resource, resourceState, loading, error } = useReadResource(resourceLike,
    {
      refreshOnStale: options?.refreshOnStale,
      // This header will be included on the first, uncached fetch.
      // This may be helpful to the server and instruct it to embed
      // all collection members in that initial fetch.
      initialGetRequestHeaders: {
        Prefer: 'transclude=' + rel,
      }
    });

  const items = useMemo(() => {
    if (!resourceState) return [];
    return resourceState.followAll(rel);
  }, [resourceState]);

  return {
    loading,
    error,
    items,
    resource,
    resourceState,
  };

}
