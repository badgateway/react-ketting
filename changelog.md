Changelog
=========

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
