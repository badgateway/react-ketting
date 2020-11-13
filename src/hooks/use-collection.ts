import { Resource } from 'ketting';
import { useState, useEffect } from 'react';
import { ResourceLike, resolveResource } from '../util';
import { useResolveResource } from './use-resolve-resource';

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

}

/**
 * Options that may be given to useCollection
 */
type UseCollectionOptions = {

  /**
   * By default useCollection will follow the 'item' relation type to find
   * collection members.
   *
   * Change this option to follow a list of other links.
   */
  rel?: string;
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
export function useCollection<T>(resourceLike: ResourceLike<T>, options?: UseCollectionOptions): UseCollectionResponse<T> {

  const rel = options?.rel || 'item';

  const { resource, error: resolveError } = useResolveResource(resourceLike);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null|Error>(null);
  const [items, setItems] = useState<Resource<T>[]>([]);

  useEffect( () => {
    if (resolveError) {
      setError(resolveError);
      setLoading(false);
      return;
    }
    if (!resource) {
      // No resource yet, lets wait for it.
      setLoading(true);
      setItems([]);
      return;
    }
    // Now we got a resource, let's find its children.
    resource
      .followAll(rel)
      .preferTransclude()
      .then( result => {
        setItems(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });

  }, [resource, resolveError]);

  return {
    loading,
    error,
    items,
  };

}
