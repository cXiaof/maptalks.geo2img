/*!
 * maptalks.geo2img v0.1.0-alpha.3
 * LICENSE : MIT
 * (c) 2016-2018 maptalks.org
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

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





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

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

var _arrayPush = arrayPush;

var _typeof$2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/** Detect free variable `global` from Node.js. */
var freeGlobal = _typeof$2(commonjsGlobal) == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

var _freeGlobal = freeGlobal;

var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/** Detect free variable `self`. */
var freeSelf = (typeof self === 'undefined' ? 'undefined' : _typeof$1(self)) == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = _freeGlobal || freeSelf || Function('return this')();

var _root = root;

/** Built-in value references. */
var _Symbol2 = _root.Symbol;

var _Symbol = _Symbol2;

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto$1.toString;

/** Built-in value references. */
var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty$1.call(value, symToStringTag$1),
      tag = value[symToStringTag$1];

  try {
    value[symToStringTag$1] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}

var _getRawTag = getRawTag;

/** Used for built-in method references. */
var objectProto$2 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$2.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

var _objectToString = objectToString;

/** `Object#toString` result references. */
var nullTag = '[object Null]';
var undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value) ? _getRawTag(value) : _objectToString(value);
}

var _baseGetTag = baseGetTag;

var _typeof$3 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && (typeof value === 'undefined' ? 'undefined' : _typeof$3(value)) == 'object';
}

var isObjectLike_1 = isObjectLike;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike_1(value) && _baseGetTag(value) == argsTag;
}

var _baseIsArguments = baseIsArguments;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = _baseIsArguments(function () {
  return arguments;
}()) ? _baseIsArguments : function (value) {
  return isObjectLike_1(value) && hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
};

var isArguments_1 = isArguments;

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

var isArray_1 = isArray;

/** Built-in value references. */
var spreadableSymbol = _Symbol ? _Symbol.isConcatSpreadable : undefined;

/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenable(value) {
  return isArray_1(value) || isArguments_1(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
}

var _isFlattenable = isFlattenable;

/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1,
      length = array.length;

  predicate || (predicate = _isFlattenable);
  result || (result = []);

  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        _arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

var _baseFlatten = baseFlatten;

var _typeof$4 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof$4(value);
  return value != null && (type == 'object' || type == 'function');
}

var isObject_1 = isObject;

var _typeof$5 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return (typeof value === 'undefined' ? 'undefined' : _typeof$5(value)) == 'symbol' || isObjectLike_1(value) && _baseGetTag(value) == symbolTag;
}

var isSymbol_1 = isSymbol;

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol_1(value)) {
    return NAN;
  }
  if (isObject_1(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject_1(other) ? other + '' : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}

var toNumber_1 = toNumber;

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;
var MAX_INTEGER = 1.7976931348623157e+308;

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber_1(value);
  if (value === INFINITY || value === -INFINITY) {
    var sign = value < 0 ? -1 : 1;
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}

var toFinite_1 = toFinite;

/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger(value) {
  var result = toFinite_1(value),
      remainder = result % 1;

  return result === result ? remainder ? result - remainder : result : 0;
}

var toInteger_1 = toInteger;

/**
 * Recursively flatten `array` up to `depth` times.
 *
 * @static
 * @memberOf _
 * @since 4.4.0
 * @category Array
 * @param {Array} array The array to flatten.
 * @param {number} [depth=1] The maximum recursion depth.
 * @returns {Array} Returns the new flattened array.
 * @example
 *
 * var array = [1, [2, [3, [4]], 5]];
 *
 * _.flattenDepth(array, 1);
 * // => [1, 2, [3, [4]], 5]
 *
 * _.flattenDepth(array, 2);
 * // => [1, 2, 3, [4], 5]
 */
function flattenDepth(array, depth) {
  var length = array == null ? 0 : array.length;
  if (!length) {
    return [];
  }
  depth = depth === undefined ? 1 : toInteger_1(depth);
  return _baseFlatten(array, depth);
}

var flattenDepth_1 = flattenDepth;

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

    Geo2img.prototype.convert = function convert(geometry, map) {
        if (map) this.setMap(map);
        this._savePrivateGeometry(geometry);
        var svg = this._geo2svg();
        svg = 'data:image/svg+xml,' + svg;
        return svg;
    };

    Geo2img.prototype.remove = function remove() {
        delete this.geometry;
        delete this.map;
    };

    Geo2img.prototype._savePrivateGeometry = function _savePrivateGeometry(geometry) {
        this.geometry = geometry;
        var map = this.geometry.getMap();
        if (map) this.map = map;
    };

    Geo2img.prototype._geo2svg = function _geo2svg() {
        var viewportSize = this._getViewportSize();
        var width = viewportSize.width,
            height = viewportSize.height;

        var style = this._getStyle();
        var mapExtent = this._getMapExtent();

        var option = {
            viewportSize: viewportSize,
            attributes: { style: style, 'vector-effect': 'non-scaling-stroke' },
            mapExtent: mapExtent
        };
        var converter = main(option);

        var svgText = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" x="0" y="0" style="transform: translateY(8%) scaleY(1.18);">';
        var svgStrings = converter.convert(this.geometry.toGeoJSON());
        svgText += svgStrings + '</svg>';

        return svgText;
    };

    Geo2img.prototype._getViewportSize = function _getViewportSize() {
        var _this2 = this;

        var type = this.geometry.getType();
        var coordinates = this.geometry.toGeoJSON().geometry.coordinates;

        var depth = type.startsWith('Multi') ? 2 : 1;
        if (!type.endsWith('Polygon')) depth--;
        var xmin = void 0,
            xmax = void 0,
            ymin = void 0,
            ymax = void 0;
        flattenDepth_1(coordinates, depth).forEach(function (coordArr, index) {
            var coordObj = new maptalks.Coordinate(coordArr);

            var _map$coordinateToCont = _this2.map.coordinateToContainerPoint(coordObj),
                x = _map$coordinateToCont.x,
                y = _map$coordinateToCont.y;

            if (index === 0) {
                xmin = x;
                xmax = x;
                ymin = y;
                ymax = y;
            } else {
                xmin = Math.min(x, xmin);
                xmax = Math.max(x, xmax);
                ymin = Math.min(y, ymin);
                ymax = Math.max(y, ymax);
            }
        });
        var safe = 2;
        var width = parseInt(xmax, 0) - parseInt(xmin, 0) + safe;
        var height = parseInt(ymax, 0) - parseInt(ymin, 0) + safe;
        return { width: width, height: height };
    };

    Geo2img.prototype._getStyle = function _getStyle() {
        var style = 'transform:translate(1%,1%) scale(0.98);';
        var symbol = this.geometry.getSymbol();
        if (!symbol) return style;
        var lineColor = symbol.lineColor,
            lineWidth = symbol.lineWidth,
            lineDasharray = symbol.lineDasharray,
            polygonFill = symbol.polygonFill,
            polygonOpacity = symbol.polygonOpacity;


        var stroke = lineColor ? lineColor : 'black';
        var strokeWidth = lineWidth ? lineWidth + 'px' : '2px';
        var strokeDasharray = lineDasharray ? lineDasharray.toString() : 'none';
        var fill = polygonFill ? polygonFill : 'transparent';
        var fillOpacity = polygonOpacity === 0 ? 0 : polygonOpacity ? polygonOpacity : 1;

        style += 'stroke:' + stroke + ';fill:' + fill + ';stroke-dasharray:' + strokeDasharray + ';fill-opacity:' + fillOpacity + ';stroke-width:' + strokeWidth + ';';
        return style;
    };

    Geo2img.prototype._getMapExtent = function _getMapExtent() {
        var extent = this.options['useGeoExtent'] ? this.geometry.getExtent() : this.map.getExtent();
        var xmin = extent.xmin,
            xmax = extent.xmax,
            ymin = extent.ymin,
            ymax = extent.ymax;

        return {
            left: xmin,
            right: xmax,
            bottom: ymin,
            top: ymax
        };
    };

    return Geo2img;
}(maptalks.Class);

Geo2img.mergeOptions(options);

export { Geo2img };

typeof console !== 'undefined' && console.log('maptalks.geo2img v0.1.0-alpha.3');
