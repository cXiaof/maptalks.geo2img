const map = new maptalks.Map('map', {
    center: [121.387, 31.129],
    zoom: 14,
    baseLayer: new maptalks.TileLayer('base', {
        urlTemplate:
            'https://webrd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        subdomains: ['01', '02', '03', '04'],
        maxAvailableZoom: 18,
        placeholder: true
    })
})

const g2 = new maptalks.Geo2img().setMap(map)
const layer = new maptalks.VectorLayer('sketchPad').addTo(map)

const drawTool = new maptalks.DrawTool({ mode: 'Polygon' }).addTo(map).disable()
drawTool.on('drawend', (param) => {
    const { geometry } = param
    geometry.addTo(layer)
    drawTool.disable()
    convertGeoToIMG(geometry)
})

const convertGeoToIMG = (geometry) => {
    const id = '_demo'
    let imgDOM = document.getElementById(id)
    if (imgDOM) imgDOM.remove()
    const base64 = g2.convert(geometry)
    imgDOM = document.createElement('img')
    imgDOM.setAttribute('id', id)
    imgDOM.setAttribute('src', base64)
    imgDOM.setAttribute('style', 'position:absolute;top:0;')
    document.body.append(imgDOM)
}

const modes = ['LineString', 'Polygon', 'Rectangle', 'Circle', 'Ellipse']
let children = []
modes.map((item) =>
    children.push({
        item,
        click: () => drawTool.setMode(item).enable()
    })
)

const toolbar = new maptalks.control.Toolbar({
    items: [
        {
            item: 'Draw Once',
            children
        },
        {
            item: 'Convert As Multi',
            click: () => {
                let geos = []
                layer.getGeometries().forEach((geo) => {
                    if (geo.getType() === 'Polygon') geos.push(geo)
                })
                const multiGeo = new maptalks.MultiPolygon(geos)
                convertGeoToIMG(multiGeo)
            }
        },
        {
            item: 'Clear',
            click: () => layer.clear()
        }
    ]
}).addTo(map)
