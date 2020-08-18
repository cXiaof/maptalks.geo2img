import geojson2svg from 'geojson2svg'

const options = {
    useGeoExtent: true,
}

export class Geo2img extends maptalks.Class {
    constructor(options) {
        super(options)
    }

    setMap(map) {
        this.map = map
        return this
    }

    convert(geometry, svgDom) {
        this.geometry = geometry
        this.dom = svgDom
        const map = this.geometry.getMap()
        if (map) this.map = map

        const paths = this._geoJSON2svgPath()
        svgDom.innerHTML = paths.join('')

        return this
    }

    remove() {
        delete this.geometry
        delete this.map
        delete this.dom
        return this
    }

    _geoJSON2svgPath() {
        const width = this.dom.clientWidth
        const height = this.dom.clientHeight
        const converter = geojson2svg({
            viewportSize: { width, height },
            attributes: this._getAttributes(),
            mapExtent: this._getMapExtent(),
        })
        return converter.convert(this.geometry.toGeoJSON())
    }

    _getMapExtent() {
        let extent = this.map.getExtent()
        if (this.options['useGeoExtent']) {
            const geoExtent = this.geometry.getExtent()
            if (geoExtent) extent = geoExtent
        }
        const { xmin, xmax, ymin, ymax } = extent
        return { left: xmin, right: xmax, bottom: ymin, top: ymax }
    }

    _getAttributes() {
        let attributes = {
            'vector-effect': 'non-scaling-stroke',
            'stroke-width': 2,
        }
        const symbol = this.geometry.getSymbol()
        if (symbol) {
            const {
                lineColor,
                lineWidth,
                lineDasharray,
                polygonFill,
                polygonOpacity,
            } = symbol

            attributes.stroke = lineColor || 'black'
            attributes.fill = polygonFill || 'transparent'
            attributes['stroke-width'] = lineWidth || 2
            attributes['fill-opacity'] =
                polygonOpacity === 0 ? 0 : polygonOpacity || 1
            attributes['stroke-dasharray'] = lineDasharray
                ? lineDasharray.toString()
                : 'none'
        }
        const translate = attributes['stroke-width'] / 2
        attributes.transform = `scale(1 ${this._getScaleY()}) translate(${translate} ${translate})`
        return attributes
    }

    _getScaleY() {
        const center = this.geometry.getCenter()
        const latAbs = Math.abs(center.y)
        return (latAbs / 90) * (Math.sqrt(2) - 1) + 1
    }
}

Geo2img.mergeOptions(options)
