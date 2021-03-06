Changelog
=========

2.0.0 (????-??-??)
------------------

* Compatibility with Ketting 7.


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
