# maptalks.geo2img

A tool to get base64 data src for html-tag<img> by geometry.

## Examples

### [DEMO](https://cxiaof.github.io/maptalks.geo2img/demo/index.html)

## Install

-   Install with npm: `npm install maptalks.geo2img`.
-   Download from [dist directory](https://github.com/cXiaof/maptalks.geo2img/tree/master/dist).
-   Use unpkg CDN: `https://unpkg.com/maptalks.geo2img/dist/maptalks.geo2img.min.js`

## Usage

As a plugin, `maptalks.geo2img` must be loaded after `maptalks.js` in browsers. You can also use `'import { Geo2img } from "maptalks.geo2img"` when developing with webpack.

```html
<script type="text/javascript" src="https://unpkg.com/maptalks/dist/maptalks.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/maptalks.geo2img/dist/maptalks.geo2img.min.js"></script>
<script>
    // new Geo2img and layer
    const layer = new maptalks.VectorLayer('v').addTo(map)
    const geo2img = new maptalks.Geo2img()

    const base64src = geo2img.convert(geometry)
    // <img src=base64src >
</script>
```

## API Reference

```javascript
new maptalks.Geo2img()
```

-   options
    -   none

`convert(geometry)` The result is base64 data for img src="%s", geometry should be add to layer.

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

-   Tests

```shell
$ npm test
```

-   Watch source changes and run tests repeatedly

```shell
$ gulp tdd
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
