import * as React from 'react';
import { render, screen } from './test-utils';

describe('Hello world', () => {

  it('should confirm that we can test React applications', () => {

    render(<div>Hello world</div>);
    screen.getByText('Hello world');

  });

});
