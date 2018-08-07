import geojson2svg from 'geojson2svg'

const options = {}

export class Geo2img extends maptalks.Class {
    constructor(options) {
        super(options)
    }

    convert(geometry) {
        const svg = this.geo2svg(geometry)
        return `data:image/svg+xml,${svg}`
    }

    geo2svg(geometry) {
        const mapExtent = this._getMapExtent(geometry)
        const style = this._getStyle(geometry)
        const option = {
            viewportSize: { width: 100, height: 100 },
            attributes: { style, 'vector-effect': 'non-scaling-stroke' },
            mapExtent
        }
        const converter = geojson2svg(option)

        let svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${
            option.viewportSize.width
        }" height="${option.viewportSize.height}" x="0" y="0">`

        const svgStrings = converter.convert(geometry.toGeoJSON())

        svgText += `${svgStrings}</svg>`
        return svgText
    }

    _getStyle(geo) {
        const { lineColor, lineWidth, lineDasharray, polygonFill, polygonOpacity } = geo.getSymbol()
        const stroke = lineColor ? lineColor : 'transparent'
        const strokeWidth = lineWidth ? `${lineWidth}px` : '1px'
        const strokeDasharray = lineDasharray ? lineDasharray.toString() : 'none'
        const fill = polygonFill ? polygonFill : 'transparent'
        const fillOpacity = polygonOpacity === 0 ? 0 : polygonOpacity ? polygonOpacity : 1
        const style = `stroke:${stroke};fill:${fill};stroke-dasharray:${strokeDasharray};fill-opacity:${fillOpacity};stroke-width:${strokeWidth};`
        return style
    }

    _getMapExtent(geo) {
        console.log(JSON.stringify(geo.toGeoJSON()))
        const extent = geo.getExtent()
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
