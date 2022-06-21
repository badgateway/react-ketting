import * as React from 'react';
import { ReactElement, FC } from 'react';
import { Client } from 'ketting';
import { KettingProvider } from '../src';
import { render, RenderOptions } from '@testing-library/react';


export const client = new Client('http://example');

// A super dumb interceptor for requests
const httpObjects = new Map<string, [BodyInit, ResponseInit?]>();

// Fake responses
client.use(async (req, next) => {

  const path = new URL(req.url).pathname;
  if (httpObjects.has(path)) {
    const r = httpObjects.get(path)!;
    const body = r[0];
    let responseInit = r[1];
    if (!responseInit) responseInit = {};
    responseInit.headers = {'Content-Type': 'application/json'};
    return new Response(body, responseInit);
  }
  return next(req);
});

export function storeInCache(path: string, body: any, responseInit?: ResponseInit) {
  httpObjects.set(path, [JSON.stringify(body), responseInit]);
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
