import { Resource } from 'ketting';
import { ResourceLike } from '../util';
import { UseCollectionOptions } from './use-collection';
import { useState, useEffect } from 'react';
import { useReadResource } from './use-read-resource';

/**
 * The result of a useCollection hook.
 */
type UsePagedCollectionResponse<T> = {

  /**
   * True if we are loading the initial page, or additional pages.
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
   * Will be set to true if there are more pages on the API.
   */
  hasNextPage: boolean;

  /**
   * Call this function to load the next page. If there are no next pages,
   * a warning will be emitted.
   */
  loadNextPage: () => void;

}

/**
 * The usePagedCollection hook works similar to useCollection, but has the
 * ability to load in additional pages of items.
 *
 * For this to work, the API needs to expose a "next" link on the collection.
 * As long as there are "next" links, more pages can be loaded in.
 *
 * Additional items from collection pages will be appended to "items",
 * allowing frontends to build 'infinite scroll' features.
 *
 * Example call:
 *
 * <pre>
 *   const {
 *     loading,
 *     error,
 *     items,
 *     hasNextPage,
 *     loadNextPage
 *  } = usePagedResource<Article>(resource);
 * </pre>
 *
 * The resource may be passed as a Resource object, a Promise<Resource>, or a
 * uri string.
 *
 * Returned properties:
 *
 * * loading - will be true every time we're going to the server and fetch a
 *             a new page.
 * * error - Will be null or an error object.
 * * items - Will contain an array of resources, each typed Resource<T> where
 *           T is the passed generic argument.
 * * hasNextPage - Will be true if the server has another page.
 * * loadNextPage - Loads the next page, and appends the new items to the
 *                  items array.
 */
export function usePagedCollection<T = any>(resourceLike: ResourceLike<any>, options?: UseCollectionOptions): UsePagedCollectionResponse<T> {

  const rel = options?.rel || 'item';

  const [items, setItems] = useState<Resource<T>[]>([]);

  const [currentCollectionResource, setCurrentCollectionResource] = useState<ResourceLike<any>>(resourceLike);

  // This is the 'base collection'
  const bc = useReadResource({
    resource: resourceLike,
    refreshOnStale: options?.refreshOnStale,
    // This header will be included on the first, uncached fetch.
    // This may be helpful to the server and instruct it to embed
    // all collection members in that initial fetch.
    initialGetRequestHeaders: {
      Prefer: 'transclude=' + rel,
    }
  });

  // This is the 'current collection
  const cc = useReadResource({
    resource: currentCollectionResource,
    refreshOnStale: options?.refreshOnStale,
    // This header will be included on the first, uncached fetch.
    // This may be helpful to the server and instruct it to embed
    // all collection members in that initial fetch.
    initialGetRequestHeaders: {
      Prefer: 'transclude=' + rel,
    }
  });

  useEffect(() => {

    if (bc.loading) {
      // We're loading a new 'base collection', so lets clear any items we got
      setItems([]);
    }

  }, [bc.loading]);

  useEffect(() => {

    if (!cc.loading) {
      setItems([
        ...items,
        ...cc.resourceState.followAll(rel)
      ]);
    }

  }, [cc.loading]);

  const hasNextPage =
    !cc.loading && cc.resourceState && cc.resourceState.links.has('next');

  const loadNextPage = () => {

    if (!hasNextPage) {
      console.warn('loadNextPage was called, but there was no next page');
      return;
    }
    setCurrentCollectionResource(cc.resourceState.follow('next'));

  }

  return {
    loading: cc.loading,
    error: cc.error,
    items,
    hasNextPage,
    loadNextPage,
  };

}
