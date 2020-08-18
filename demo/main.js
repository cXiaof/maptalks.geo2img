// new Map
const map = new maptalks.Map('map', {
    center: [121.387, 31.129],
    zoom: 14,
    baseLayer: new maptalks.TileLayer('base', {
        urlTemplate:
            'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        attribution:
            '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>',
        maxAvailableZoom: 18,
        placeholder: true,
    }),
    scaleControl: { position: 'bottom-right', metric: true, imperial: true },
    zoomControl: {
        position: { top: 80, right: 20 },
        slider: false,
        zoomLevel: true,
    },
    spatialReference: {
        projection: 'EPSG:3857',
        resolutions: (function () {
            const resolutions = []
            const d = 2 * 6378137 * Math.PI
            for (let i = 0; i < 22; i++) {
                resolutions[i] = d / (256 * Math.pow(2, i))
            }
            return resolutions
        })(),
        fullExtent: {
            top: 6378137 * Math.PI,
            bottom: -6378137 * Math.PI,
            left: -6378137 * Math.PI,
            right: 6378137 * Math.PI,
        },
    },
})
new maptalks.CompassControl({
    position: 'top-right',
}).addTo(map)

const g2 = new maptalks.Geo2img().setMap(map)
const layer = new maptalks.VectorLayer('sketchPad').addTo(map)

const convertGeoToIMG = (geometry) => {
    const svgDom = document.getElementById('svg')
    g2.convert(geometry, svgDom)
}

// new DrawTool
const drawTool = new maptalks.DrawTool({ mode: 'Polygon' }).addTo(map).disable()
drawTool.on('drawend', ({ geometry }) => {
    geometry.addTo(layer)
    drawTool.disable()
    convertGeoToIMG(geometry)
})

// new Toolbar
const modes = ['LineString', 'Polygon', 'Rectangle', 'Circle', 'Ellipse']
let children = []
modes.map((item) =>
    children.push({ item, click: () => drawTool.setMode(item).enable() })
)

const toolbar = new maptalks.control.Toolbar({
    position: 'top-left',
    items: [
        { item: 'Draw Once', children },
        {
            item: 'Convert As Multi',
            click: () => {
                const geos = layer.getGeometries()
                const multiGeo = new maptalks.MultiPolygon(geos)
                convertGeoToIMG(multiGeo)
            },
        },
        { item: 'Clear', click: () => layer.clear() },
    ],
}).addTo(map)

// new tip Panel
const textPanel = new maptalks.control.Panel({
    position: 'bottom-left',
    draggable: true,
    custom: false,
    content: `
        Click a type in <b>Draw Once</b> to draw one geometry,<br />
        and a html img tag show now.<br />
        Click <b>Convert As Multi</b> to show the effect<br />
        with multiGeometry.<br />
        <br />
        点击<b>Draw</b>里的类型然后画一个相应的图形，<br />
        画完的同时将会出现一个img标签。<br />
        点击<b>Convert As Multi</b>查看multiGeometry的效果。
    `,
    closeButton: true,
})
map.addControl(textPanel)
