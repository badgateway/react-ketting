import * as React from 'react';
import { ReactElement, FC } from 'react';
import { Client } from 'ketting';
import { KettingProvider } from '../src';
import { render, RenderOptions } from '@testing-library/react';


export const client = new Client('http://example');

// A super dumb interceptor for requests
const httpObjects = new Map<string, string>();

// Fake responses
client.use(async (req, next) => {

  const path = new URL(req.url).pathname;
  if (httpObjects.has(path)) {
    return new Response(httpObjects.get(path), { headers: {
      'Content-Type': 'application/json'
    }});
  }
  return next(req);
});

export function storeInCache(path: string, body: any) {
  httpObjects.set(path, JSON.stringify(body));
}

const Providers: FC = ({children}) => {

  return <KettingProvider client={client}>
    {children}
  </KettingProvider>;

};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, {wrapper: Providers, ...options});

export * from '@testing-library/react';
export { customRender as render };
