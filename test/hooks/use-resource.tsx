import * as React from 'react';
import { useEffect } from 'react';
import { render, screen, storeInCache, waitFor} from '../test-utils';

import { useResource } from '../../src';

describe('useResource', () => {

  storeInCache('/test1', {title: 'Hello world'});
  storeInCache('/test2', {title: 'Hello world2'});
  storeInCache('/test3', {title: 'Hello world3'});

  it('should fetch and render data', async () => {

    const MyApp = () => {

      const { loading, error, data } = useResource<any>('/test1');

      if (loading) {
        return <div>Loading</div>;
      }
      if (error) {
        return <div>{error.message}</div>;
      }

      return <div>{data.title}</div>;

    };

    render(<MyApp />);
    screen.getByText('Loading');

    await waitFor(() => screen.getByText('Hello world'));

  });
  it('should also allow access via the resourceState property', async () => {

    const MyApp = () => {

      const { loading, error, resourceState } = useResource<any>('/test2');

      if (loading) {
        return <div>Loading</div>;
      }
      if (error) {
        return <div>{error.message}</div>;
      }

      return <div>{resourceState.data.title}</div>;

    };

    render(<MyApp />);
    screen.getByText('Loading');

    await waitFor(() => screen.getByText('Hello world2'));

  });
  it('should allow users to update the state via setResourceState', async () => {

    const MyApp = () => {

      const { loading, error, resourceState, setResourceState } = useResource<any>('/test3');
      useEffect(() => {

        if (loading) return;

        setTimeout(() => {
          const newData = {
            title: 'I just got updated'
          };
          resourceState.data = newData;
          setResourceState(resourceState);
        }, 1);
      }, [loading]);

      if (loading) {
        return <div>Loading</div>;
      }
      if (error) {
        return <div>{error.message}</div>;
      }

      return <div>{resourceState.data.title}</div>;

    };

    render(<MyApp />);
    screen.getByText('Loading');

    await waitFor(() => screen.getByText('I just got updated'));

  });


});
