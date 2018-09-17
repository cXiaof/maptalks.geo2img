import geojson2svg from 'geojson2svg'
import flattenDeep from 'lodash/flattenDeep'

const options = {
    useGeoExtent: true
}

export class Geo2img extends maptalks.Class {
    constructor(options) {
        super(options)
    }

    setMap(map) {
        this.map = map
        return this
    }

    convert(geometry) {
        this._savePrivateGeometry(geometry)
        let svg = this.geo2svg()
        svg = `data:image/svg+xml,${svg}`
        return svg
    }

    remove() {
        delete this.geometry
        delete this.map
    }

    geo2svg() {
        const viewportSize = this._getViewportSize()
        const { width, height } = viewportSize
        const style = this._getStyle()
        const mapExtent = this._getMapExtent()

        const option = {
            viewportSize,
            attributes: { style, 'vector-effect': 'non-scaling-stroke' },
            mapExtent
        }
        const converter = geojson2svg(option)

        let svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" x="0" y="0" style="transform: translateY(8%) scaleY(1.18);">`
        const svgStrings = converter.convert(this.geometry.toGeoJSON())
        svgText += `${svgStrings}</svg>`

        return svgText
    }

    _savePrivateGeometry(geometry) {
        this.geometry = geometry
        const map = this.geometry.getMap()
        if (map) this.map = map
    }

    _getViewportSize() {
        const coords = this._getSafeCoords()
        let xmin, xmax, ymin, ymax
        flattenDeep(coords).forEach((coord, index) => {
            const { x, y } = this.map.coordinateToContainerPoint(coord)
            if (index === 0) {
                xmin = x
                xmax = x
                ymin = y
                ymax = y
            } else {
                xmin = Math.min(x, xmin)
                xmax = Math.max(x, xmax)
                ymin = Math.min(y, ymin)
                ymax = Math.max(y, ymax)
            }
        })
        const safe = 2
        const width = parseInt(xmax, 0) - parseInt(xmin, 0) + safe
        const height = parseInt(ymax, 0) - parseInt(ymin, 0) + safe
        return { width, height }
    }

    _getSafeCoords() {
        const coordinates = this.geometry.toGeoJSON().geometry.coordinates[0]
        let coords = []
        coordinates.forEach((coord) => coords.push(new maptalks.Coordinate(coord)))
        return [coords]
    }

    _getStyle() {
        let style = 'transform:translate(1%,1%) scale(0.98);'
        const symbol = this.geometry.getSymbol()
        if (!symbol) return style
        const { lineColor, lineWidth, lineDasharray, polygonFill, polygonOpacity } = symbol

        const stroke = lineColor ? lineColor : 'transparent'
        const strokeWidth = lineWidth ? `${lineWidth}px` : '1px'
        const strokeDasharray = lineDasharray ? lineDasharray.toString() : 'none'
        const fill = polygonFill ? polygonFill : 'transparent'
        const fillOpacity = polygonOpacity === 0 ? 0 : polygonOpacity ? polygonOpacity : 1

        style += `stroke:${stroke};fill:${fill};stroke-dasharray:${strokeDasharray};fill-opacity:${fillOpacity};stroke-width:${strokeWidth};`
        return style
    }

    _getMapExtent() {
        const extent = this.options['useGeoExtent']
            ? this.geometry.getExtent()
            : this.map.getExtent()
        const { xmin, xmax, ymin, ymax } = extent
        return {
            left: xmin,
            right: xmax,
            bottom: ymin,
            top: ymax
        }
    }
}

Geo2img.mergeOptions(options)
