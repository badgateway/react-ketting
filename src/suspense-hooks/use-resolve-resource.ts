import { Client, Resource } from 'ketting';
import { ResourceLike } from '../util';
import { useMemo } from 'react';
import { useClient } from '../hooks/use-client';

export function useResolveResource<T = any>(res: ResourceLike<T>) {

  const client = useClient();
  const resourceFetcher = useMemo(
    () => getResourceFetcher(client, res),
    [res]
  );
  return resourceFetcher();

}


function getResourceFetcher<T>(client: Client, resourceLike: ResourceLike<T>): () => Resource<T> {

  // Handle the synchronous cases
  if (typeof resourceLike==='string') {
    return () => client.go(resourceLike);
  } else if (resourceLike instanceof Resource) {
    return () => resourceLike;
  }

  // Promise<Resource> case
  let resource = null;
  let error = null;
  const suspender = resourceLike.then(
    (res: Resource<T>) => { resource = res; },
    (err: Error) => { error = err; }
  );

  if (error) throw error;
  if (resource) return resource;
  throw suspender;

}
