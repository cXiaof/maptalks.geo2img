/*!
 * maptalks.geo2img v0.2.0-beta.1
 * LICENSE : MIT
 * (c) 2016-2020 maptalks.org
 */
/*!
 * requires maptalks@>=0.31.0 
 */
// extend.js
// extend b to a with shallow copy
var extend = function extend(a, b) {
  var c = {};
  Object.keys(a).forEach(function (key) {
    c[key] = a[key];
  });
  Object.keys(b).forEach(function (key) {
    c[key] = b[key];
  });
  return c;
};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var multigeojson = createCommonjsModule(function (module) {
	//index.js 
	(function () {
		var singles = ['Point', 'LineString', 'Polygon'];
		var multies = ['MultiPoint', 'MultiLineString', 'MultiPolygon'];
		function explode(g) {
			if (multies.indexOf(g.type) > -1) {
				return g.coordinates.map(function (part) {
					var single = {};
					single.type = g.type.replace('Multi', '');
					single.coordinates = part;
					if (g.crs) single.crs = g.crs;
					return single;
				});
			} else {
				return false;
			}
		}
		function implode(gs) {
			var sameType = gs.every(function (g) {
				return singles.indexOf(g.type) > -1;
			});
			var crs = gs[0].crs || 0;
			var sameCrs = gs.every(function (g) {
				var gcrs = g.crs || 0;
				return gcrs == crs;
			});
			if (sameType && sameCrs) {
				var multi = {};
				multi.type = 'Multi' + gs[0].type;
				multi.coordinates = [];
				if (crs != 0) multi.crs = crs;
				gs.forEach(function (g) {
					multi.coordinates.push(g.coordinates);
				});
				return multi;
			} else {
				return false;
			}
		}
		var multigeojson = {
			explode: explode,
			implode: implode
		};
		if ('object' !== 'undefined' && module.exports) {
			module.exports = multigeojson;
		} else if (window) {
			window.multigeojson = multigeojson;
		}
	})();
});

//converter.js

function getCoordString(coords, res, origin) {
  //origin - svg image origin 
  var coordStr = coords.map(function (coord) {
    return (coord[0] - origin.x) / res + ',' + (origin.y - coord[1]) / res;
  });
  return coordStr.join(' ');
}
function point(geom, res, origin, opt) {
  var r = opt && opt.r ? opt.r : 1;
  var pointAsCircle = opt && opt.hasOwnProperty('pointAsCircle') ? opt.pointAsCircle : false;
  var coords = getCoordString([geom.coordinates], res, origin);
  if (pointAsCircle) {
    return [coords];
  } else {
    return ['M' + coords + ' m' + -r + ',0' + ' a' + r + ',' + r + ' 0 1,1 ' + 2 * r + ',' + 0 + ' a' + r + ',' + r + ' 0 1,1 ' + -2 * r + ',' + 0];
  }
}
function multiPoint(geom, res, origin, opt) {
  var explode = opt && opt.hasOwnProperty('explode') ? opt.explode : false;
  var paths = multigeojson.explode(geom).map(function (single) {
    return point(single, res, origin, opt)[0];
  });
  if (!explode) return [paths.join(' ')];
  return paths;
}
function lineString(geom, res, origin, otp) {
  var coords = getCoordString(geom.coordinates, res, origin);
  var path = 'M' + coords;
  return [path];
}
function multiLineString(geom, res, origin, opt) {
  var explode = opt && opt.hasOwnProperty('explode') ? opt.explode : false;
  var paths = multigeojson.explode(geom).map(function (single) {
    return lineString(single, res, origin, opt)[0];
  });
  if (!explode) return [paths.join(' ')];
  return paths;
}
function polygon(geom, res, origin, opt) {
  var mainStr, holes, holeStr;
  mainStr = getCoordString(geom.coordinates[0], res, origin);
  if (geom.coordinates.length > 1) {
    holes = geom.coordinates.slice(1, geom.coordinates.length);
  }
  var path = 'M' + mainStr;
  if (holes) {
    for (var i = 0; i < holes.length; i++) {
      path += ' M' + getCoordString(holes[i], res, origin);
    }
  }
  path += 'Z';
  return [path];
}
function multiPolygon(geom, res, origin, opt) {
  var explode = opt.hasOwnProperty('explode') ? opt.explode : false;
  var paths = multigeojson.explode(geom).map(function (single) {
    return polygon(single, res, origin, opt)[0];
  });
  if (!explode) return [paths.join(' ').replace(/Z/g, '') + 'Z'];
  return paths;
}
var converter = {
  Point: point,
  MultiPoint: multiPoint,
  LineString: lineString,
  MultiLineString: multiLineString,
  Polygon: polygon,
  MultiPolygon: multiPolygon
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

//g2svg as geojson2svg (shorthand)
var g2svg = function g2svg(options) {
  this.options = options || {};
  this.viewportSize = this.options.viewportSize || { width: 256, height: 256 };
  this.mapExtent = this.options.mapExtent || {
    left: -20037508.342789244,
    right: 20037508.342789244,
    bottom: -20037508.342789244,
    top: 20037508.342789244
  };
  this.res = this.calResolution(this.mapExtent, this.viewportSize, this.options.fitTo);
};
g2svg.prototype.calResolution = function (extent, size, fitTo) {
  var xres = (extent.right - extent.left) / size.width;
  var yres = (extent.top - extent.bottom) / size.height;
  if (fitTo) {
    if (fitTo.toLowerCase() === 'width') {
      return xres;
    } else if (fitTo.toLowerCase() === 'height') {
      return yres;
    } else {
      throw new Error('"fitTo" option should be "width" or "height" ');
    }
  } else {
    return Math.max(xres, yres);
  }
};
g2svg.prototype.convert = function (geojson, options) {
  var opt = extend(this.options, options || {});
  var multiGeometries = ['MultiPoint', 'MultiLineString', 'MultiPolygon'];
  var geometries = ['Point', 'LineString', 'Polygon'];
  var svgElements = [];
  if (geojson.type == 'FeatureCollection') {
    for (var i = 0; i < geojson.features.length; i++) {
      svgElements = svgElements.concat(this.convertFeature(geojson.features[i], opt));
    }
  } else if (geojson.type == 'Feature') {
    svgElements = this.convertFeature(geojson, opt);
  } else if (geojson.type == 'GeometryCollection') {
    for (var i = 0; i < geojson.geometries.length; i++) {
      svgElements = svgElements.concat(this.convertGeometry(geojson.geometries[i], opt));
    }
  } else if (converter[geojson.type]) {
    svgElements = this.convertGeometry(geojson, opt);
  } else {
    return;
  }
  if (opt.callback) opt.callback.call(this, svgElements);
  return svgElements;
};
g2svg.prototype.convertFeature = function (feature, options) {
  if (!feature && !feature.geometry) return;
  var opt = extend(this.options, options || {});
  if (opt.attributes && opt.attributes instanceof Array) {
    var arr = opt.attributes;
    opt.attributes = arr.reduce(function (sum, property) {
      if (typeof property === 'string') {
        var val,
            key = property.split('.').pop();
        try {
          val = valueAt(feature, property);
        } catch (e) {
          val = false;
        }
        if (val) sum[key] = val;
      } else if ((typeof property === 'undefined' ? 'undefined' : _typeof(property)) === 'object' && property.type && property.property) {
        if (property.type === 'dynamic') {
          var val,
              key = property.key ? property.key : property.property.split('.').pop();
          try {
            val = valueAt(feature, property.property);
          } catch (e) {
            val = false;
          }
          if (val) sum[key] = val;
        } else if (property.type === 'static' && property.value) {
          sum[property.property] = property.value;
        }
      }
      return sum;
    }, {});
  } else {
    opt.attributes = opt.attributes || {};
  }
  var id = opt.attributes.id || feature.id || (feature.properties && feature.properties.id ? feature.properties.id : null);
  if (id) opt.attributes.id = id;
  return this.convertGeometry(feature.geometry, opt);
};
g2svg.prototype.convertGeometry = function (geom, options) {
  if (converter[geom.type]) {
    var opt = extend(this.options, options || {});
    var output = opt.output || 'svg';
    var paths = converter[geom.type].call(this, geom, this.res, { x: this.mapExtent.left, y: this.mapExtent.top }, opt);
    var svgJsons, svgEles;
    if (output.toLowerCase() == 'svg') {
      svgJsons = paths.map(function (path) {
        return pathToSvgJson(path, geom.type, opt.attributes, opt);
      });
      svgEles = svgJsons.map(function (json) {
        return jsonToSvgElement(json, geom.type, opt);
      });
      return svgEles;
    } else {
      return paths;
    }
  } else {
    return;
  }
};

function pathToSvgJson(path, type, attributes, opt) {
  var svg = {};
  var pointAsCircle = opt && opt.hasOwnProperty('pointAsCircle') ? opt.pointAsCircle : false;
  if ((type == 'Point' || type == 'MultiPoint') && pointAsCircle) {
    svg['cx'] = path.split(',')[0];
    svg['cy'] = path.split(',')[1];
    svg['r'] = opt && opt.r ? opt.r : '1';
  } else {
    svg = { d: path };
    if (type == 'Polygon' || type == 'MultiPolygon') {
      svg['fill-rule'] == 'evenodd';
    }
  }
  for (var key in attributes) {
    svg[key] = attributes[key];
  }
  return svg;
}

function jsonToSvgElement(json, type, opt) {
  var pointAsCircle = opt && opt.hasOwnProperty('pointAsCircle') ? opt.pointAsCircle : false;
  var ele = '<path';
  if ((type == 'Point' || type == 'MultiPoint') && pointAsCircle) {
    ele = '<circle';
  }
  for (var key in json) {
    ele += ' ' + key + '="' + json[key] + '"';
  }
  ele += '/>';
  return ele;
}

function valueAt(obj, path) {
  //taken from http://stackoverflow.com/a/6394168/713573
  function index(prev, cur, i, arr) {
    if (prev.hasOwnProperty(cur)) {
      return prev[cur];
    } else {
      throw new Error(arr.slice(0, i + 1).join('.') + ' is not a valid property path');
    }
  }
  return path.split('.').reduce(index, obj);
}
var instance = g2svg;

var geojson2svg = function geojson2svg(options) {
  return new instance(options);
};

var main = geojson2svg;

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

var options = {
    useGeoExtent: true
};

var Geo2img = function (_maptalks$Class) {
    _inherits(Geo2img, _maptalks$Class);

    function Geo2img(options) {
        _classCallCheck(this, Geo2img);

        return _possibleConstructorReturn(this, _maptalks$Class.call(this, options));
    }

    Geo2img.prototype.setMap = function setMap(map) {
        this.map = map;
        return this;
    };

    Geo2img.prototype.convert = function convert(geometry, svgDom) {
        this.geometry = geometry;
        this.dom = svgDom;
        var map = this.geometry.getMap();
        if (map) this.map = map;

        var paths = this._geoJSON2svgPath();
        svgDom.innerHTML = paths.join('');

        return this;
    };

    Geo2img.prototype.remove = function remove() {
        delete this.geometry;
        delete this.map;
        delete this.dom;
        return this;
    };

    Geo2img.prototype._geoJSON2svgPath = function _geoJSON2svgPath() {
        var width = this.dom.clientWidth;
        var height = this.dom.clientHeight;
        var converter = main({
            viewportSize: { width: width, height: height },
            attributes: this._getAttributes(),
            mapExtent: this._getMapExtent()
        });
        return converter.convert(this.geometry.toGeoJSON());
    };

    Geo2img.prototype._getMapExtent = function _getMapExtent() {
        var extent = this.map.getExtent();
        if (this.options['useGeoExtent']) {
            var geoExtent = this.geometry.getExtent();
            if (geoExtent) extent = geoExtent;
        }
        var _extent = extent,
            xmin = _extent.xmin,
            xmax = _extent.xmax,
            ymin = _extent.ymin,
            ymax = _extent.ymax;

        return { left: xmin, right: xmax, bottom: ymin, top: ymax };
    };

    Geo2img.prototype._getAttributes = function _getAttributes() {
        var attributes = {
            'vector-effect': 'non-scaling-stroke',
            'stroke-width': 2
        };
        var symbol = this.geometry.getSymbol();
        if (symbol) {
            var lineColor = symbol.lineColor,
                lineWidth = symbol.lineWidth,
                lineDasharray = symbol.lineDasharray,
                polygonFill = symbol.polygonFill,
                polygonOpacity = symbol.polygonOpacity;


            attributes.stroke = lineColor || 'black';
            attributes.fill = polygonFill || 'transparent';
            attributes['stroke-width'] = lineWidth || 2;
            attributes['fill-opacity'] = polygonOpacity === 0 ? 0 : polygonOpacity || 1;
            attributes['stroke-dasharray'] = lineDasharray ? lineDasharray.toString() : 'none';
        }
        var translate = attributes['stroke-width'] / 2;
        attributes.transform = 'scale(1 ' + this._getScaleY() + ') translate(' + translate + ' ' + translate + ')';
        return attributes;
    };

    Geo2img.prototype._getScaleY = function _getScaleY() {
        var center = this.geometry.getCenter();
        var latAbs = Math.abs(center.y);
        return latAbs / 90 * (Math.sqrt(2) - 1) + 1;
    };

    return Geo2img;
}(maptalks.Class);

Geo2img.mergeOptions(options);

export { Geo2img };

typeof console !== 'undefined' && console.log('maptalks.geo2img v0.2.0-beta.1, requires maptalks@>=0.31.0.');
