import * as React from 'react';
import { render, screen, storeInCache, waitFor} from '../test-utils';
import { expect } from 'chai';

import { useReadResource } from '../../src';

describe('useReadResource', () => {

  storeInCache('/use-read-resource-1', {title: 'Hello world'});
  storeInCache('/use-read-resource-2', {title: 'Error :('}, { status: 403 });

  it('should fetch and render data', async () => {

    let renderCount = 0;

    const MyApp = () => {

      renderCount++;
      const { loading, error, resourceState } = useReadResource<any>('/use-read-resource-1', {});

      if (loading) {
        return <div>Loading</div>;
      }
      if (error) {
        return <div>{error.message}</div>;
      }

      return <div>{resourceState.data.title}</div>;

    };

    render(<MyApp />);
    expect(renderCount).to.eql(1);
    screen.getByText('Loading');

    await waitFor(() => screen.getByText('Hello world'));

    // Currently this is 3 renders, but in React 18 apparently this should
    // automatically drop to 2 due to batch state updates.
    //
    // The reason it's 3 renders currently is becaused setLoading and
    // setResourceState each cause a render even though they are called
    // immediately after each other.
    expect(renderCount).to.be.lessThan(4);

  });

  it('should handle HTTP errors', async () => {

    let renderCount = 0;

    const MyApp = () => {

      renderCount++;
      const { loading, error, resourceState } = useReadResource<any>('/use-read-resource-2', {});

      if (loading) {
        return <div>Loading</div>;
      }
      if (error) {
        return <div>Error!</div>;
      }

      return <div>{resourceState.data.title}</div>;

    };

    render(<MyApp />);
    expect(renderCount).to.eql(1);
    screen.getByText('Loading');

    await waitFor(() => screen.getByText('Error!'));
    expect(renderCount).to.be.lessThan(4);

  });

});
