Changelog
=========

0.4.0 (2020-05-12)
------------------

* Updated to latest Ketting 6 alpha.
* Both the hook and HoC listen for the `update` event and automatically
  re-render when they are triggered.
* The `state` property in the useResource hook is renamed to `resourceState`
  for consitancy with the HoC.
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
