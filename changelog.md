Changelog
=========

4.0.10 (2022-10-12)
-------------------

* #98: Return type of `submit()` function is changed from `void` to
  `Promise<void>` @BeckyPollard
* #95: `loading` did not go back to `true` if an error occurred in some cases.


4.0.9 (2022-06-21)
------------------

* #94: Complete rewrite of `useInfiniteCollection` it had still more issues
 in edge-cases, so it needed a higher-approach to fixing it.

Note: a bunch of versions were skipped. They were all released as beta to test
issues with this hook.

4.0.3 (2022-06-20)
------------------

* #93: Reverted fix from for `useInfiniteCollection`, which had another
  negative side-effect. Both the side-effect and the original issue should
  be fixed with this release.


4.0.2 (2022-06-09)
------------------

* #90 `useInfiniteCollection` did not refresh correctly with if there was
  only 1 page.


4.0.1 (2022-06-07)
------------------

* #87 `useInfiniteCollection`'s `refreshOnStale` did not function correctly.
  it now fully resets the component.


4.0.0 (2022-05-19)
------------------

* Same as the last beta.


4.0.0-beta.1 (2022-04-10)
-------------------------

* `useNewResource` now assumes HAL as the default format.


4.0.0-beta.0 (2022-04-10)
-------------------------

* Added `<SelectLink>` component. This component renders
  a `<select>` element with a list of links from a resource.
* Added `useNewResource`, which lets you create new resources on collections
  using a `POST` request.
* Several optimizations, reducing renders for `useResource` from 5 down to
  2 in certain cases.
* `react-ketting` now re-exports everything from the `ketting` package.
* BC Break: `mode` option from `useResource` has been removed.
* Fixed an infinite rendering bug when passing a promise to `useResource`.


3.0.3 (2022-03-21)
------------------

* Fix Ketting dependency version.


3.0.2 (2022-03-19)
------------------

* #75: `usePagedCollection` is renamed to `useInfiniteCollection`. The old
  function name will continue to work until the next major version, but you
  are encouraged to rename all uses of it.
* #76 #61: `useCollection()` now returns the same `items` array every call.
  This can help avoid re-renders and potentially even render loops.


3.0.1 (2022-03-18)
------------------

* `useCollection` now returns 'resourceState' and 'resource', which makes it
  less likely that someone needs both `useResource` and `useCollection` in
  the same component. These objects were already readily available, so might
  as well return them.


3.0.0 (2022-02-21)
------------------

* BC Break: The signature of `useResource` has changed, but only if you were
  passing options. If you called `useResource(options)` before, it must now
  be structured as `useResource(resource, options)` to be consistent with
  every other hook.
* In some cases when a React component passes a new resource as a string to
  useResource, the useResource might return "undefined" for the resource,
  which can result in a white screen of death.
  This one was a bit of a doozy, check the PR for more information:
  https://github.com/badgateway/react-ketting/pull/67
* Remove an unneeded initial render in `useCollection`.


2.1.5 (2022-02-21)
------------------

* In some cases when a React component passes a new resource as a string to
  useResource, the useResource might return "undefined" for the resource,
  which can result in a white screen of death. See PR #67 #70


2.1.4 (2021-09-01)
------------------

* In some scenarios `RequireLogin` could crash due to a function sometimes
  being called before it's defined (@mihok).
* Works with Typescript 4.4 strict.


2.1.3 (2021-08-24)
------------------

* `usePagedCollection` did not behave correctly with pages or collections
  that were already cached. Now it doesn't care if the page was cached or not.


2.1.2 (2021-07-06)
------------------

* In `usePagedCollection`, when the resource property changes, the first pag
  was not reloaded, resulting in an empty collection.


2.1.1 (2021-06-29)
------------------

* If `usePagedCollection` was given a promise, it would go in an infinite
  render loop.


2.1.0 (2021-06-29)
------------------

* Added `usePagedCollection`, which allows users to create 'infinite scroll'
  interfaces.
* Some heavy duty refactoring to encourage better re-use of internal hooks.


2.0.0 (2021-03-14)
------------------

* Stable release
* No functional changes since 2.0.0-beta.0


2.0.0-beta.0 (2021-03-14)
-------------------------

* Compatibility with Ketting 7.
* `UseResourceOptions` is now exported


1.4.6 (2021-03-27)
------------------

* #43: Remove incorrect 'browser' property from `package.json`. This should
  never have been there and was causing issues for some build systems.


1.4.5 (2021-03-11)
------------------

* Correctly handle 'invalid_grant' errors from an OAuth2 server.


1.4.4 (2021-03-09)
------------------

* `useResolveResource` is now exported.


1.4.3 (2021-03-06)
------------------

* Add `refreshOnStale` option to `useResource`.


1.4.2 (2020-12-17)
------------------

* The 'type' of the result of useCollection is not dependent on the 'type'
  of the collection that was passed it. This was a bug in `useCollection`.


1.4.1 (2020-12-01)
------------------

* Update ketting and fetch-mw-oauth2
* expireAt for oauth2 token is now preserved via LocalStorage.


1.4.0 (2020-11-24)
------------------

* Add 'refreshOnStale' option to `useCollection`, to automatically fetch new
  items if the collection is known to have changed.


1.3.6 (2020-11-13)
------------------

* Refresh "items" in `useCollection` if the resource argument changed.


1.3.5 (2020-11-11)
------------------

* Cleanup bug in `useResource` hook.


1.3.4 (2020-11-11)
------------------

* Fixing another bug related to prop changes / effects / dependencies in
  useEffect.


1.3.3 (2020-11-11)
------------------

* Make sure `data` and `resourceState` get re-fetched when the resource arg
  changes in the `useResource` hook.


1.3.2 (2020-11-11)
------------------

* Guarantee re-render on when `setData()` or `setResourceState()` is used.


1.3.1 (2020-11-11)
------------------

* Fix an issue with RequireLogin trying to validate a 'code' twice.
* RequireLogin should be a bi snappier with fewer async ops.


1.3.0 (2020-11-09)
------------------

* Fewer renders and much faster first render if there's a cached state with
  `useResource`.
* Handle expired Access / Refresh tokens better. We now send the user back
  into the authentication process.
* Added the ability to override the endpoint `RequireLogin` uses to test if
  the Bearer token is correct.


1.2.0 (2020-10-20)
------------------

* Added a `useCollection` hook, for easily traversing a collection of
  resources.
* The `useResource` hook now also emits the 'real' resource that was used.


1.1.0 (2020-10-11)
-----------------

* Added a `RequireLogin` component. If you're using the OAuth2
 `authorization_code` flow, this component can do most of the work to set this
 up, and set the correct access/refresh tokens in Ketting. It uses
 LocalStorage to save the tokens. (@simistern)
* Fix a bug related to `useResource` and `setData`.


1.0.0 (2020-09-09)
------------------

* Ketting 6 got a stable release, so this package gets a 1.0 release as well.


0.7.1 (2020-08-21)
------------------

* `useResource` can now take a Promise that resolves to a resource from its
  first argument.
* `ResourceLike` is now exported.


0.7.0 (2020-06-22)
------------------

* `useResource()` can now take a URI argument instead of a Resource object.
* `useResource()` can also take a Promise that resolves to a resource.
* Added a `KettingProvider` component, giving any component access to the
  closest Ketting client via `useContext` / `contextType`.
* Added a `useClient` hook to easily find the Client object in functional
  components.



0.6.9 (2020-06-22)
------------------

* Rewrite of `useResource`. It can now fully manage updating state, submitting
  to the server.
* 'New resource' flow in useResource, allowing it be be used to create a new
  resource via `POST` request, and subsequent `PUT` requests.
* A simpler `useReadResource` hook. Providing read-only access to resources,
  and change subscriptions.


0.5.0 (2020-06-08)
------------------

* `useResource` now also returns `updateResourceState` and `updateData`
  functions, to easily store state changes in a local cache.
* `useResource` hook will avoid emitting state changes after a component
  is cleaned up.


0.4.1 (2020-06-03)
------------------

* `ketting` is now a peerDepedency.
* Updated dependencies.


0.4.0 (2020-05-14)
------------------

* Updated to latest Ketting 6 alpha.
* Both the hook and HoC listen for the `update` event and automatically
  re-render when they are triggered.
* The `state` property in the useResource hook is renamed to `resourceState`
  for consistency with the HoC.
* All `body` properties are renamed to `data`.


0.3.0 (2020-05-09)
------------------

* Added a `withResource` HoC for class-based React Components.


0.2.3 (2020-05-04)
------------------

* Remove race condition.


0.2.2 (2020-05-04)
------------------

* Remove webpack. Lets assume for now people have their own build pipeline.


0.2.1 (2020-05-04)
------------------

* Simplify result from `useResource`.


0.2.0 (2020-05-04)
------------------

* useResource now returns an object with `loading`, `error`, `body` and `state`
  properties.


0.1.0 (2020-05-04)
------------------

* First version!
