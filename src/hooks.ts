import { useState, useEffect } from 'react';
import { State, Resource } from 'ketting';

type UseResourceResult<T> = {
  /**
   * 'true' if resource has not yet been fetched from the server.
   */
  loading: boolean

  /**
   * Contains an Error object when an operation has failed.
   */
  error: null | Error,

  /**
   * Data from the resource
   */
  data: T,

  /**
   * Updates the local data cache and dispatch change events.
   */
  updateData: (data: T) => void,

  /**
   * Full Ketting 'State' object.
   */
  resourceState: State<T>,

  /**
   * Updates the full resource state object in local cache, and dispatch
   * change events.
   */
  updateResourceState: (state: State<T>) => void,

};

/**
 * A helper function that returns the default result for a 'loading' state.
 */
function loadingState<T>(resource: Resource<T>): UseResourceResult<T> {

  return {
    loading: true,
    error: null,

    data: null as any,
    updateData: (data: T) => { throw Error('Too early to update data. Initial state must be fetched from server first'); },

    resourceState: null as any,
    updateResourceState: (state: State<T>) => resource.updateCache(state),
  };

}

/**
 * A helper function to generate a default 'error' state
 */
function errorState(err: Error): UseResourceResult<any> {

  return {
    loading: false,
    error: err,

    data: null,
    updateData: (data: any) => { throw Error('Cannot update the resource state after an error.'); },
    resourceState: null as any,
    updateResourceState: (data: any) => { throw Error('Cannot update the resource state after an error.'); },
  };

}

/**
 * A helper function to generate the 'success state'
 */
function successState<T>(resource: Resource<T>, state: State<T>): UseResourceResult<T> {

  return {
    loading: false,
    error: null,

    data: state.data,
    updateData: (data: T) => {
      state.data = data;
      resource.updateCache(state);
    },

    resourceState: state,
    updateResourceState: (newState: State<T>) => {
      resource.updateCache(newState);
    }
  }

}

export function useResource<T>(resource: Resource<T>): UseResourceResult<T> {

  const [result, updateResult] = useState(loadingState(resource));

  let mounted = true;

  useEffect(() => {


    const onUpdateListener = (newState: State) => {

      updateResult(
        successState(resource, newState)
      );

    }

    (async() => {

      try {
        const resState = await resource.get();

        if (mounted) {
          updateResult(
            successState(
              resource,
              resState
            )
          );
          resource.on('update', onUpdateListener);
        }

      } catch (err) {
        if (mounted) {
          updateResult(
            errorState(err)
          );
        }
      }

    })().catch( err => {
      if (mounted) {
        updateResult(
          errorState(err)
        );
      }
    });

    return function cleanup() {
      mounted = false;
      resource.off('update', onUpdateListener);
    };

  }, [resource]);

  return result;

}
