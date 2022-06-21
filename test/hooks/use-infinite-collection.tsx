import * as React from 'react';
import { useEffect } from 'react';
import { render, screen, storeInCache, waitFor } from '../test-utils';
import { useInfiniteCollection, Resource, useResource } from '../../src';

describe('useInfiniteCollection', () => {

  storeInCache('/page/1', {
    _links: {
      item: [
        { href: '/item/1' },
        { href: '/item/2' },
      ],
      next: { href: '/page/2' }
    },
  });
  storeInCache('/page/2', {
    _links: {
      item: [
        { href: '/item/3' },
        { href: '/item/4' },
      ],
      next: { href: '/page/3' }
    },
  });
  storeInCache('/page/3', {
    _links: {
      item: [
        { href: '/item/5' },
        { href: '/item/6' },
      ],
    },
  });
  for(let i = 1; i<100; i++) {
    storeInCache('/item/' + i, { title: 'Item ' + i});
  }

  it('should fetch and render the first page.', async () => {

    const Item = (props: { resource: Resource }) => {

      const { loading, data } = useResource(props.resource);

      if (loading) {
        return <div>Loading</div>;
      }

      return <div>{data.title}</div>;

    };

    const MyApp = () => {

      const { loading, error, items } = useInfiniteCollection<any>('/page/1');

      if (loading) {
        return <div>Loading</div>;
      }
      if (error) {
        return <div>{error.message}</div>;
      }
      return <ul>
        {items.map( item => <li key={item.uri}><Item resource={item} /></li> )}
      </ul>;

    };

    render(<MyApp />);
    screen.getByText('Loading');

    await waitFor(() => screen.getByText('Item 2'));

  });
  it('should fetch and render the second page.', async () => {

    const Item = (props: { resource: Resource }) => {

      const { loading, data } = useResource(props.resource);

      if (loading) {
        return <div>Loading</div>;
      }

      return <div>{data.title}</div>;

    };

    const MyApp = () => {

      const { loading, error, items, hasNextPage, loadNextPage  } = useInfiniteCollection<any>('/page/1');
      useEffect(() => {
        if (hasNextPage) loadNextPage();
      },[items]);

      if (loading) {
        return <div>Loading</div>;
      }
      if (error) {
        return <div>{error.message}</div>;
      }

      return <ul>
        {items.map( item => <li key={item.uri}><Item resource={item} /></li> )}
      </ul>;

    };

    render(<MyApp />);

    await waitFor(() => screen.getByText('Item 6'));

  });

});
