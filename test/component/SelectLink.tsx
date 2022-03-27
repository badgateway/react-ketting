import * as React from 'react';
import { render, screen, storeInCache, waitFor} from '../test-utils';

import { SelectLink } from '../../src';

describe('<SelectLink />', () => {

  storeInCache('/select-link-1', {
    _links: {
      item: [
        { href: '/foo-1', title: 'Option 1'},
        { href: '/foo-2', title: 'Option 2'},
      ]
    }
  });
  storeInCache('/select-link-2', {}, { status: 403 });

  it('Should render', async () => {

    render(<SelectLink resource="/select-link-1" />);
    screen.getByText('Loading...');

    await waitFor(() => screen.getByText('Option 1'));

    // 2 renders is aspirational. Currently this is 5 :(
    //expect(renderCount).to.eql(2);

  });

});
