Ketting bindings for React
==========================

This package provides [React][1] [hooks][2] and other integrations to
[Ketting][3], the generic REST client.

The API is heavily inspired by [Apollo Client][4].

Everything is written in Typescript, and it's recommended (but not required)
to use this package.

Installation
------------

    npm i ketting react-ketting

Examples
--------

In the following examples, we are assuming that the following HTTP requests
are available:

    POST https://api.example/article - Create a new article
    GET  https://api.example/article/1 - Retrieve an article
    PUT  https://api.example/article/1 - Update an article

Articles have the following general structure:

```json
{
  "title": "Hello world!",
  "body": "First post"
}
```

### Application setup

It's recommended to use the `<KettingProvider>` component at the top of your
application. It's not required for most features, but it makes some examples
easier.

```typescript
import React from 'react';
import { render } from 'react-dom';
import { Client } from 'ketting';
import { KettingProvider } from 'react-ketting';

// Create a new client, and set the base uri for the API.
// This URI will be used to resolve any relative uris.
const client = new Client('https://api.example/');

const App = () => (
  <KettingProvider client={client}>
    <ArticleView />
  </KettingProvider>
);

render(<App />, document.getElementById('root'));
```

### Viewing an article

Lets develop the `<ArticleView>` component.

```typescript
import { useResource } from 'react-ketting';

/**
 * Ideally you will want to generate this from a JSON Schema, or
 * OpenAPI definition.
 */
type Article = {
  title: string;
  body: string;
}

function ArticleView() {

  const { loading, error, data } = useResource<Article>('/article/1');
  if (loading) return <p>Loading...</p>;
  if (error) return <div class="error">{error.message}</div>;

  return <article>
    <h1>{data.title}</h1>
    <p>{data.body}</p>
  </article>;

}
```

Here `useResource` returns a few properties:

* `loading` - will turn to true as soon as loading is complete, or there was an error.
* `error` - will have a Javascript `Error` object.
* `data`- The data received from the server.


### Editing an article

Lets try a more advanced example. The following allows a user to make changes
to the body. For brevity the title is not changable.

```typescript
import { useResource } from 'react-ketting';

/**
 * Ideally you will want to generate this from a JSON Schema, or
 * OpenAPI definition.
 */
type Article = {
  title: string;
  body: string;
}

function ArticleView() {

  const { loading, error, data, setData, submit } = useResource<Article>('/article/1');
  if (loading) return <p>Loading...</p>;
  if (error) return <div class="error">{error.message}</div>;

  const handleChangeBody = (ev: React.FormEvent<any>) => {
    setData({
       ...data,
       body: ev.target.value
    });
  }

  const handleSubmit = async () => {

    await submit();

  }

  return <article>
    <h1>{data.title}</h1>
    <p><textarea onChange={handleChangeBody} value={data.body}</textarea>
    <input type="submit" onclick={handleSubmit} value="Save" />
  </article>;

}
```

A few new properties were returned from `useResource`.

* `setData()` updates the internal cache for the resource. One thing to note
  is if you use the same resource (with the same URI) in different components,
  all of them will receive an automatic state update.
* `submit()` when you are all done, `submit()` will turn your Article in a JSON
  object and send it to the server with `PUT`.


### Creating a new article.

Creating a new article is almost identical, the only difference is in the
first few lines:

```typescript
function ArticleView() {

  const { loading, error, data, setData, submit } = useResource<Article>(
    resource: '/article/',
    mode: 'POST',
    initialData: {
      title: 'New post!',
      body: 'Enter your content here',
    },
  );
  if (loading) return <p>Loading...</p>;
  if (error) return <div class="error">{error.message}</div>;
  
  /* Etc */
}
```

Of note is that you now pass an object to useResource. This object will
have the following properties:

* `resource` Where to send the request to
* `mode` Can be POST or PUT.
* `initialData` - The 'template'. Not too different from the argument to
  [useState()][5].

When `submit()` is eventually called, Ketting will send a `POST` request
to your server with the request body.

If the server responded with a [`201 Created`][6] header and a [`Location`][7]
header, Ketting will automatically follow that header and do a `GET` request
there to inspect the new state, causing an update to `data` as well.

Any subsequent calls to `submit()` will not do new `POST` requests. Instead,
it will do `PUT` requests to the newly created resource.


[1]: https://reactjs.org/
[2]: https://reactjs.org/docs/hooks-intro.html
[3]: https://github.com/badgateway/ketting
[4]: https://www.apollographql.com/docs/react/
[5]: https://reactjs.org/docs/hooks-state.html
[6]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201 "201 Created status code"
[7]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location "Location header"
