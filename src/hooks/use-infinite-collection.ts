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
 * The useInfiniteCollection hook works similar to useCollection, but has the
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
 *  } = useInfiniteResource<Article>(resource);
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
export function useInfiniteCollection<T = any>(resourceLike: ResourceLike<any>, options?: UseCollectionOptions): UsePagedCollectionResponse<T> {

  const rel = options?.rel || 'item';

  const [items, setItems] = useState<Resource<T>[]>([]);

  const [currentCollectionResource, setCurrentCollectionResource] = useState<ResourceLike<any>>(resourceLike);

  // This is the 'base collection'
  const bc = useReadResource(resourceLike, {
    refreshOnStale: options?.refreshOnStale,
    // This header will be included on the first, uncached fetch.
    // This may be helpful to the server and instruct it to embed
    // all collection members in that initial fetch.
    initialGetRequestHeaders: {
      Prefer: 'transclude=' + rel,
    }
  });

  // This is the 'current collection
  const cc = useReadResource(currentCollectionResource, {
    refreshOnStale: options?.refreshOnStale,
    // This header will be included on the first, uncached fetch.
    // This may be helpful to the server and instruct it to embed
    // all collection members in that initial fetch.
    initialGetRequestHeaders: {
      Prefer: 'transclude=' + rel,
    }
  });

  useEffect(() => {

    // We're loading a new 'base collection', so lets clear any items we got
    setItems([]);

    // Set the 'current' page back to the first page in the collection.
    setCurrentCollectionResource(resourceLike);

  }, [bc.resource]);

  useEffect(() => {

    if (cc.resourceState) {
      // This effect gets triggered when we get data for a new page.
      // When we do, append the items to our array.
      setItems([
        ...items,
        ...cc.resourceState.followAll(rel)
      ]);
    }

  }, [cc.resourceState?.uri]);


  const hasNextPage =
    !cc.loading && cc.resourceState && cc.resourceState.links.has('next');

  const loadNextPage = () => {

    if (!hasNextPage) {
      console.warn('loadNextPage was called, but there was no next page');
      return;
    }
    setCurrentCollectionResource(cc.resourceState.follow('next'));

  };

  return {
    loading: cc.loading,
    error: cc.error,
    items,
    hasNextPage,
    loadNextPage,
  };

}


/**
 * usePagedCollection is the deprecated old name for useInfiniteCollection
 *
 * @deprecated Rename to useInfiniteCollection
 */
export function usePagedCollection<T = any>(resourceLike: ResourceLike<any>, options?: UseCollectionOptions): UsePagedCollectionResponse<T> {

  return useInfiniteCollection(resourceLike, options);

}
