import { Resource } from 'ketting';
import { KettingContext } from './provider';

export type ResourceLike<T> = Resource<T> | PromiseLike<Resource<T>> | string;

export async function resolveResource<T>(res: ResourceLike<T>, kettingContext: KettingContext): Promise<Resource> {

  if (typeof res === 'string') {

    if (!kettingContext.client) {
      throw new Error('In order to specify resources by their uri, a KettingProvider component must be set up');
    }
    return kettingContext.client.go(res);

  }

  return res;

}
