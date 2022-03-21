import * as React from 'react';
import { render, screen, storeInCache, waitFor } from '../test-utils';

import { useResource } from '../../src';

describe('useResource', () => {

  storeInCache('/test1', {title: 'Hello world'});

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

});
