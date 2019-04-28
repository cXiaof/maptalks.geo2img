# maptalks.geo2img

A tool to get base64 data src for html-tag< img > by geometry.

## Examples

### [DEMO](https://cxiaof.github.io/maptalks.geo2img/demo/index.html)

## Install

-   Install with npm: `npm install maptalks.geo2img`.
-   Install with yarn: `yarn add maptalks.geo2img`.
-   Download from [dist directory](https://github.com/cXiaof/maptalks.geo2img/tree/master/dist).
-   Use unpkg CDN: `https://cdn.jsdelivr.net/npm/maptalks.geo2img/dist/maptalks.geo2img.min.js`

## Usage

As a plugin, `maptalks.geo2img` must be loaded after `maptalks.js` in browsers. You can also use `'import { Geo2img } from "maptalks.geo2img"` when developing with webpack.

```html
<!-- ... -->
<script src="https://cdn.jsdelivr.net/npm/maptalks.geo2img/dist/maptalks.geo2img.min.js"></script>
<!-- ... -->
```

```javascript
const geo2img = new maptalks.Geo2img()
const base64src = geo2img.convert(geometry)
// <img src=base64src >
```

## API Reference

```javascript
new maptalks.Geo2img(options)
```

-   options
    -   useGeoExtent **boolean** set true to use geometry extent and false to use map extent, default be true.

`convert(geometry, map)` The result is base64 data for img src="%s", geometry should be add to layer, the second attr is unessential.
`setMap(map)` if you geometry has not add to layer, you need set map for plugin(or push map to the second attr of **convert** ).
`remove()`

## BUG Already

-   svg-path often exceed boundary of SVG-tag

## Contributing

We welcome any kind of contributions including issue reportings, pull requests, documentation corrections, feature requests and any other helps.

## Develop

The only source file is `index.js`.

It is written in ES6, transpiled by [babel](https://babeljs.io/) and tested with [mocha](https://mochajs.org) and [expect.js](https://github.com/Automattic/expect.js).

### Scripts

-   Install dependencies

```shell
$ npm install
```

-   Watch source changes and generate runnable bundle repeatedly

```shell
$ gulp watch
```

-   Package and generate minified bundles to dist directory

```shell
$ gulp minify
```

-   Lint

```shell
$ npm run lint
```

## More Things

-   [maptalks.autoadsorb](https://github.com/cXiaof/maptalks.autoadsorb/issues)
-   [maptalks.multisuite](https://github.com/cXiaof/maptalks.multisuite/issues)
-   [maptalks.geosplit](https://github.com/cXiaof/maptalks.geosplit/issues)
-   [maptalks.polygonbool](https://github.com/cXiaof/maptalks.polygonbool/issues)
-   [maptalks.geo2img](https://github.com/cXiaof/maptalks.geo2img/issues)
-   [maptalks.control.compass](https://github.com/cXiaof/maptalks.control.compass/issues)
-   [maptalks.autogradual](https://github.com/cXiaof/maptalks.autogradual/issues)
