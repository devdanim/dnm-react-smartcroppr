import React from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash-es/isEqual';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

/**
 * POLYFILLS
 */

// Request Animation Frame polyfill
(function () {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
      || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function (callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () { callback(currTime + timeToCall); },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
}());

// CustomEvents polyfill
(function () {

  if (typeof window.CustomEvent === "function") return false;

  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

// MouseEvents polyfill
(function (window) {
  try {
    new CustomEvent('test');
    return false; // No need to polyfill
  } catch (e) {
    // Need to polyfill - fall through
  }

  // Polyfills DOM4 CustomEvent
  function MouseEvent(eventType, params) {
    params = params || { bubbles: false, cancelable: false };
    var mouseEvent = document.createEvent('MouseEvent');
    mouseEvent.initMouseEvent(eventType, params.bubbles, params.cancelable, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

    return mouseEvent;
  }

  MouseEvent.prototype = Event.prototype;

  window.MouseEvent = MouseEvent;
})(window);

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css = ".croppr-container * {\n  user-select: none;\n  -moz-user-select: none;\n  -webkit-user-select: none;\n  -ms-user-select: none;\n  box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n}\n\n.croppr-container img {\n  vertical-align: middle;\n  max-width: 100%;\n}\n\n.croppr {\n  position: relative;\n  display: inline-block;\n}\n\n.croppr-overlay {\n  background: rgba(0,0,0,0.5);\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  z-index: 1;\n  cursor: crosshair;\n}\n\n.croppr-region {\n  position: absolute;\n  z-index: 3;\n  cursor: move;\n  top: 0;\n}\n\n.croppr-imageClipped {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  z-index: 2;\n  pointer-events: none;\n  background-color: white;\n}\n\n.croppr-handle {\n  border: 1px solid black;\n  border-radius: 5px;\n  background-color: white;\n  width: 10px;\n  height: 10px;\n  position: absolute;\n  z-index: 4;\n  top: 0;\n}\n\n.croppr-dark .croppr-image {\n  background-color: white;\n}\n\n.croppr-light .croppr-image, .croppr-light .croppr-imageClipped {\n  background-color: black;\n}\n\n";
styleInject(css);

/**
 * Handle component
 */
class Handle {

  /**
   * Creates a new Handle instance.
   * @constructor
   * @param {Array} position The x and y ratio position of the handle
   *      within the crop region. Accepts a value between 0 to 1 in the order
   *      of [X, Y].
   * @param {Array} constraints Define the side of the crop region that
   *      is to be affected by this handle. Accepts a value of 0 or 1 in the
   *      order of [TOP, RIGHT, BOTTOM, LEFT].
   * @param {String} cursor The CSS cursor of this handle.
   * @param {Element} eventBus The element to dispatch events to.
   */
  constructor(position, constraints, cursor, eventBus) {

    var self = this;
    this.position = position;
    this.constraints = constraints;
    this.cursor = cursor;
    this.eventBus = eventBus;

    // Create DOM element
    this.el = document.createElement('div');
    this.el.className = 'croppr-handle';
    this.el.style.cursor = cursor;

    // Attach initial listener
    this.el.addEventListener('mousedown', onMouseDown);

    function onMouseDown(e) {
      e.stopPropagation();
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('mousemove', onMouseMove);

      // Notify parent
      self.eventBus.dispatchEvent(new CustomEvent('handlestart', {
        detail: { handle: self }
      }));
    }

    function onMouseUp(e) {
      e.stopPropagation();
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);

      // Notify parent
      self.eventBus.dispatchEvent(new CustomEvent('handleend', {
        detail: { handle: self }
      }));
    }

    function onMouseMove(e) {
      e.stopPropagation();
      // Notify parent
      self.eventBus.dispatchEvent(new CustomEvent('handlemove', {
        detail: { mouseX: e.clientX, mouseY: e.clientY }
      }));
    }
  }
}

/**
 * Box component
 */
class Box {
  /**
   * Creates a new Box instance.
   * @constructor
   * @param {Number} x1
   * @param {Number} y1
   * @param {Number} x2
   * @param {Number} y2
   */
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  /** 
   * Sets the new dimensions of the box.
   * @param {Number} x1
   * @param {Number} y1
   * @param {Number} x2
   * @param {Number} y2
   */
  set(x1 = null, y1 = null, x2 = null, y2 = null) {
    this.x1 = x1 == null ? this.x1 : x1;
    this.y1 = y1 == null ? this.y1 : y1;
    this.x2 = x2 == null ? this.x2 : x2;
    this.y2 = y2 == null ? this.y2 : y2;
    return this;
  }

  /**
   * Calculates the width of the box.
   * @returns {Number}
   */
  width() {
    return Math.abs(this.x2 - this.x1);
  }

  /**
   * Calculates the height of the box.
   * @returns {Number}
   */
  height() {
    return Math.abs(this.y2 - this.y1);
  }

  /**
   * Resizes the box to a new size.
   * @param {Number} newWidth
   * @param {Number} newHeight
   * @param {Array} [origin] The origin point to resize from.
   *      Defaults to [0, 0] (top left).
   */
  resize(newWidth, newHeight, origin = [0, 0]) {
    const fromX = this.x1 + (this.width() * origin[0]);
    const fromY = this.y1 + (this.height() * origin[1]);

    this.x1 = fromX - (newWidth * origin[0]);
    this.y1 = fromY - (newHeight * origin[1]);
    this.x2 = this.x1 + newWidth;
    this.y2 = this.y1 + newHeight;

    return this;
  }

  /**
   * Scale the box by a factor.
   * @param {Number} factor
   * @param {Array} [origin] The origin point to resize from.
   *      Defaults to [0, 0] (top left).
   */
  scale(factor, origin = [0, 0], containerWidth = null, containerHeight = null) {
    const newWidth = this.width() * factor;
    const newHeight = this.height() * factor;
    this.resize(newWidth, newHeight, origin);
    return this;
  }

  /**
   * Move the box to the specified coordinates.
   */
  move(x = null, y = null) {
    let width = this.width();
    let height = this.height();
    x = x === null ? this.x1 : x;
    y = y === null ? this.y1 : y;

    this.x1 = x;
    this.y1 = y;
    this.x2 = x + width;
    this.y2 = y + height;
    return this;
  }

  /**
   * Get relative x and y coordinates of a given point within the box.
   * @param {Array} point The x and y ratio position within the box.
   * @returns {Array} The x and y coordinates [x, y].
   */
  getRelativePoint(point = [0, 0]) {
    const x = this.width() * point[0];
    const y = this.height() * point[1];
    return [x, y];
  }

  /**
   * Get absolute x and y coordinates of a given point within the box.
   * @param {Array} point The x and y ratio position within the box.
   * @returns {Array} The x and y coordinates [x, y].
   */
  getAbsolutePoint(point = [0, 0]) {
    const x = this.x1 + this.width() * point[0];
    const y = this.y1 + this.height() * point[1];
    return [x, y];
  }

  //Return constrained ratio
  getRatio(minRatio = null, maxRatio = null) {
    if(minRatio === null) return null;
    if(maxRatio === null) return minRatio;
    const imageRatio = this.width()/this.height();
    if(minRatio > maxRatio) {
      let tempRatio = minRatio;
      minRatio = maxRatio;
      maxRatio = tempRatio;
    }
    if(imageRatio > maxRatio) return maxRatio;
    else if(imageRatio < minRatio) return minRatio;
    else return imageRatio;
  }

  /**
   * Constrain the box to a fixed ratio.
   * @param {Number} ratio
   * @param {Array} [origin] The origin point to resize from.
   *     Defaults to [0, 0] (top left).
   * @param {String} [grow] The axis to grow to maintain the ratio.
   *     Defaults to 'height'.
   */
  constrainToRatio(ratio = null, origin = [0, 0], grow = 'height', maxRatio = null) {

    if (ratio === null) { return; }

    const width = this.width();
    const height = this.height();

    if(maxRatio !== null) {

      //If max ratio is defined, check if constraint is needed, then resize
      let minRatio = ratio;
      if(minRatio > maxRatio) {
          minRatio = maxRatio;
          maxRatio = ratio;
      }
      let cropRatio = width/height;

      if( cropRatio < minRatio || cropRatio > maxRatio ) {
        let constrainWidth = width;
        let constrainHeight = height;
        if(cropRatio > maxRatio) constrainHeight = width / maxRatio;
        else constrainWidth = height * minRatio;
        this.resize(constrainWidth, constrainHeight, origin);
      } 

    } else {

      //If constraint is needed, resize by ratio 
      switch (grow) {
        case 'height': // Grow height only
          this.resize(width, width / ratio, origin);
          break;
        case 'width': // Grow width only
          this.resize(height * ratio, height, origin);
          break;
        default: // Default: Grow height only
          this.resize(width, width / ratio, origin);
      }

    }

    return this;
  }

  /**
   * Constrain the box within a boundary.
   * @param {Number} boundaryWidth
   * @param {Number} boundaryHeight
   * @param {Array} [origin] The origin point to resize from.
   *     Defaults to [0, 0] (top left).
   */
  constrainToBoundary(boundaryWidth, boundaryHeight, origin = [0, 0]) {

    // Calculate the maximum sizes for each direction of growth
    const [originX, originY] = this.getAbsolutePoint(origin);
    const maxIfLeft = originX;
    const maxIfTop = originY;
    const maxIfRight = boundaryWidth - originX;
    const maxIfBottom = boundaryHeight - originY;

    // Express the direction of growth in terms of left, both,
    // and right as -1, 0, and 1 respectively. Ditto for top/both/down.
    const directionX = -2 * origin[0] + 1;
    const directionY = -2 * origin[1] + 1;

    // Determine the max size to use according to the direction of growth.
    let [maxWidth, maxHeight] = [null, null];
    switch (directionX) {
      case -1: maxWidth = maxIfLeft; break;
      case 0: maxWidth = Math.min(maxIfLeft, maxIfRight) * 2; break;
      case +1: maxWidth = maxIfRight; break;
    }
    switch (directionY) {
      case -1: maxHeight = maxIfTop; break;
      case 0: maxHeight = Math.min(maxIfTop, maxIfBottom) * 2; break;
      case +1: maxHeight = maxIfBottom; break;
    }

    // Resize if the box exceeds the calculated max width/height.
    if (this.width() > maxWidth) {
      const factor = maxWidth / this.width();
      this.scale(factor, origin);
    }
    if (this.height() > maxHeight) {
      const factor = maxHeight / this.height();
      this.scale(factor, origin);
    }

    return this;
  }

  /**
   * Constrain the box to a maximum/minimum size.
   * @param {Number} [maxWidth]
   * @param {Number} [maxHeight]
   * @param {Number} [minWidth]
   * @param {Number} [minHeight]
   * @param {Array} [origin] The origin point to resize from.
   *     Defaults to [0, 0] (top left).
   * @param {Number} [ratio] Ratio to maintain.
   */
  constrainToSize(maxWidth = null, maxHeight = null,
    minWidth = null, minHeight = null,
    origin = [0, 0], minRatio = null, maxRatio = null) {

    //Get ratio based on min and max values
    let ratio = this.getRatio(minRatio, maxRatio);

    if (maxWidth && this.width() > maxWidth) {
      const newWidth = maxWidth,
        newHeight = ratio === null ? this.height() : maxWidth / ratio;
      this.resize(newWidth, newHeight, origin);
    }

    if (maxHeight && this.height() > maxHeight) {
      const newWidth = ratio === null ? this.width() : maxHeight * ratio,
        newHeight = maxHeight;
      this.resize(newWidth, newHeight, origin);
    }

    if (minWidth && this.width() < minWidth) {
      const newWidth = minWidth,
        newHeight = ratio === null ? this.height() : minWidth / ratio;
      this.resize(newWidth, newHeight, origin);
    }

    if (minHeight && this.height() < minHeight) {
      const newWidth = ratio === null ? this.width() : minHeight * ratio,
        newHeight = minHeight;
      this.resize(newWidth, newHeight, origin);
    }

    return this;
  }
}

/**
 * Croppr Touch
 * Enables support for touch devices by translating touch events to
 * mouse events.
 */

/**
 * Binds an element's touch events to be simulated as mouse events.
 * @param {Element} element
 */
function enableTouch(element) {
  element.addEventListener('touchstart', simulateMouseEvent);
  element.addEventListener('touchend', simulateMouseEvent);
  element.addEventListener('touchmove', simulateMouseEvent);
}

/**
 * Translates a touch event to a mouse event.
 * @param {Event} e
 */
function simulateMouseEvent(e) {
  e.preventDefault();
  const touch = e.changedTouches[0];
  const eventMap = {
    'touchstart': 'mousedown',
    'touchmove': 'mousemove',
    'touchend': 'mouseup'
  };

  touch.target.dispatchEvent(new MouseEvent(eventMap[e.type], {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: touch.clientX,
    clientY: touch.clientY,
    screenX: touch.screenX,
    screenY: touch.screenY,
  }));
}

/*! Fast Average Color | © 2021 Denis Seleznev | MIT License | https://github.com/fast-average-color/fast-average-color */
function toHex(num) {
    const str = num.toString(16);

    return str.length === 1 ? '0' + str : str;
}

function arrayToHex(arr) {
    return '#' + arr.map(toHex).join('');
}

function isDark(color) {
    // http://www.w3.org/TR/AERT#color-contrast
    const result = (color[0] * 299 + color[1] * 587 + color[2] * 114) / 1000;

    return result < 128;
}

function prepareIgnoredColor(color) {
    if (!color) { return color; }

    if (Array.isArray(color)) {
        return typeof color[0] === 'number' ? [color.slice()] : color;
    }

    return [color];
}

function isIgnoredColor(data, index, ignoredColor) {
    for (let i = 0; i < ignoredColor.length; i++) {
        if (isIgnoredColorAsNumbers(data, index, ignoredColor[i])) {
            return true;
        }
    }

    return false;
}

function isIgnoredColorAsNumbers(data, index, ignoredColor) {
    switch (ignoredColor.length) {
        case 3:
            // [red, green, blue]
            if (isIgnoredRGBColor(data, index, ignoredColor)) {
                return true;
            }

            break;
        case 4:
            // [red, green, blue, alpha]
            if (isIgnoredRGBAColor(data, index, ignoredColor)) {
                return true;
            }

            break;
        case 5:
            // [red, green, blue, alpha, threshold]
            if (isIgnoredRGBAColorWithThreshold(data, index, ignoredColor)) {
                return true;
            }

            break;
        default:
            return false;
    }
}

function isIgnoredRGBColor(data, index, ignoredColor) {
    // Ignore if the pixel are transparent.
    if (data[index + 3] !== 255) {
        return true;
    }

    if (data[index] === ignoredColor[0] &&
        data[index + 1] === ignoredColor[1] &&
        data[index + 2] === ignoredColor[2]
    ) {
        return true;
    }

    return false;
}

function isIgnoredRGBAColor(data, index, ignoredColor) {
    if (data[index + 3] && ignoredColor[3]) {
        return data[index] === ignoredColor[0] &&
            data[index + 1] === ignoredColor[1] &&
            data[index + 2] === ignoredColor[2] &&
            data[index + 3] === ignoredColor[3];
    }

    // Ignore rgb components if the pixel are fully transparent.
    return data[index + 3] === ignoredColor[3];
}

function inRange(colorComponent, ignoredColorComponent, value) {
    return colorComponent >= (ignoredColorComponent - value) &&
        colorComponent <= (ignoredColorComponent + value);
}

function isIgnoredRGBAColorWithThreshold(data, index, ignoredColor) {
    const redIgnored = ignoredColor[0];
    const greenIgnored = ignoredColor[1];
    const blueIgnored = ignoredColor[2];
    const alphaIgnored = ignoredColor[3];
    const threshold = ignoredColor[4];
    const alphaData = data[index + 3];

    const alphaInRange = inRange(alphaData, alphaIgnored, threshold);
    if (!alphaIgnored) {
        return alphaInRange;
    }

    if (!alphaData && alphaInRange) {
        return true;
    }

    if (inRange(data[index], redIgnored, threshold) &&
        inRange(data[index + 1], greenIgnored, threshold) &&
        inRange(data[index + 2], blueIgnored, threshold) &&
        alphaInRange
    ) {
        return true;
    }

    return false;
}

function dominantAlgorithm(arr, len, options) {
    const colorHash = {};
    const divider = 24;
    const ignoredColor = options.ignoredColor;
    const step = options.step;
    let max = [0, 0, 0, 0, 0];
    
    for (let i = 0; i < len; i += step) {
        const red = arr[i];
        const green = arr[i + 1];
        const blue = arr[i + 2];
        const alpha = arr[i + 3];

        if (ignoredColor && isIgnoredColor(arr, i, ignoredColor)) {
            continue;
        }

        const key = Math.round(red / divider) + ',' +
                Math.round(green / divider) + ',' +
                Math.round(blue / divider);

        if (colorHash[key]) {
            colorHash[key] = [
                colorHash[key][0] + red * alpha,
                colorHash[key][1] + green * alpha,
                colorHash[key][2] + blue * alpha,
                colorHash[key][3] + alpha,
                colorHash[key][4] + 1
            ];
        } else {
            colorHash[key] = [red * alpha, green * alpha, blue * alpha, alpha, 1];
        }
        
        if (max[4] < colorHash[key][4]) {
            max = colorHash[key];
        }
    }

    const redTotal = max[0];
    const greenTotal = max[1];
    const blueTotal = max[2];

    const alphaTotal = max[3];
    const count = max[4];

    return alphaTotal ? [
        Math.round(redTotal / alphaTotal),
        Math.round(greenTotal / alphaTotal),
        Math.round(blueTotal / alphaTotal),
        Math.round(alphaTotal / count)
    ] : options.defaultColor;
}

function simpleAlgorithm(arr, len, options) {
    let redTotal = 0;
    let greenTotal = 0;
    let blueTotal = 0;
    let alphaTotal = 0;
    let count = 0;

    const ignoredColor = options.ignoredColor;
    const step = options.step;

    for (let i = 0; i < len; i += step) {
        const alpha = arr[i + 3];
        const red = arr[i] * alpha;
        const green = arr[i + 1] * alpha;
        const blue = arr[i + 2] * alpha;

        if (ignoredColor && isIgnoredColor(arr, i, ignoredColor)) {
            continue;
        }

        redTotal += red;
        greenTotal += green;
        blueTotal += blue;
        alphaTotal += alpha;

        count++;
    }

    return alphaTotal ? [
        Math.round(redTotal / alphaTotal),
        Math.round(greenTotal / alphaTotal),
        Math.round(blueTotal / alphaTotal),
        Math.round(alphaTotal / count)
    ] : options.defaultColor;
}

function sqrtAlgorithm(arr, len, options) {
    let redTotal = 0;
    let greenTotal = 0;
    let blueTotal = 0;
    let alphaTotal = 0;
    let count = 0;

    const ignoredColor = options.ignoredColor;
    const step = options.step;

    for (let i = 0; i < len; i += step) {
        const red = arr[i];
        const green = arr[i + 1];
        const blue = arr[i + 2];
        const alpha = arr[i + 3];

        if (ignoredColor && isIgnoredColor(arr, i, ignoredColor)) {
            continue;
        }

        redTotal += red * red * alpha;
        greenTotal += green * green * alpha;
        blueTotal += blue * blue * alpha;
        alphaTotal += alpha;

        count++;
    }

    return alphaTotal ? [
        Math.round(Math.sqrt(redTotal / alphaTotal)),
        Math.round(Math.sqrt(greenTotal / alphaTotal)),
        Math.round(Math.sqrt(blueTotal / alphaTotal)),
        Math.round(alphaTotal / count)
    ] : options.defaultColor;
}

function getDefaultColor(options) {
    return getOption(options, 'defaultColor', [0, 0, 0, 0]);
}

function getOption(options, name, defaultValue) {
    return typeof options[name] === 'undefined' ? defaultValue : options[name];
}

const MIN_SIZE = 10;
const MAX_SIZE = 100;

function isSvg(filename) {
    return filename.search(/\.svg(\?|$)/i) !== -1;
}

function getOriginalSize(resource) {
    if (resource instanceof HTMLImageElement) {
        let width = resource.naturalWidth;
        let height = resource.naturalHeight;

        // For SVG images with only viewBox attr.
        if (!resource.naturalWidth && isSvg(resource.src)) {
            width = height = MAX_SIZE;
        }

        return {
            width,
            height,
        };
    }

    if (resource instanceof HTMLVideoElement) {
        return {
            width: resource.videoWidth,
            height: resource.videoHeight
        };
    }

    return {
        width: resource.width,
        height: resource.height
    };
}

function prepareSizeAndPosition(originalSize, options) {
    const srcLeft = getOption(options, 'left', 0);
    const srcTop = getOption(options, 'top', 0);
    const srcWidth = getOption(options, 'width', originalSize.width);
    const srcHeight = getOption(options, 'height', originalSize.height);

    let destWidth = srcWidth;
    let destHeight = srcHeight;

    if (options.mode === 'precision') {
        return {
            srcLeft,
            srcTop,
            srcWidth,
            srcHeight,
            destWidth,
            destHeight
        };
    }

    let factor;

    if (srcWidth > srcHeight) {
        factor = srcWidth / srcHeight;
        destWidth = MAX_SIZE;
        destHeight = Math.round(destWidth / factor);
    } else {
        factor = srcHeight / srcWidth;
        destHeight = MAX_SIZE;
        destWidth = Math.round(destHeight / factor);
    }

    if (
        destWidth > srcWidth || destHeight > srcHeight ||
        destWidth < MIN_SIZE || destHeight < MIN_SIZE
    ) {
        destWidth = srcWidth;
        destHeight = srcHeight;
    }

    return {
        srcLeft,
        srcTop,
        srcWidth,
        srcHeight,
        destWidth,
        destHeight
    };
}

function makeCanvas() {
    return typeof window === 'undefined' ?
        new OffscreenCanvas(1, 1) :
        document.createElement('canvas');
}

const ERROR_PREFIX = 'FastAverageColor: ';

function outputError(options, text, details) {
    if (!options.silent) {
        console.error(ERROR_PREFIX + text);

        if (details) {
            console.error(details);
        }
    }
}

function getError(text) {
    return Error(ERROR_PREFIX + text);
}

class FastAverageColor {
    /**
     * Get asynchronously the average color from not loaded image.
     *
     * @param {string | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | null} resource
     * @param {FastAverageColorOptions} [options]
     *
     * @returns {Promise<FastAverageColorOptions>}
     */
    getColorAsync(resource, options) {
        if (!resource) {
            return Promise.reject(getError('call .getColorAsync() without resource.'));
        }

        if (typeof resource === 'string') {
            const img = new Image();
            img.crossOrigin = '';
            img.src = resource;

            return this._bindImageEvents(img, options);
        } else if (resource instanceof Image && !resource.complete) {
            return this._bindImageEvents(resource, options);
        } else {
            const result = this.getColor(resource, options);

            return result.error ? Promise.reject(result.error) : Promise.resolve(result);
        }
    }

    /**
     * Get the average color from images, videos and canvas.
     *
     * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | null} resource
     * @param {FastAverageColorOptions} [options]
     *
     * @returns {FastAverageColorResult}
     */
    getColor(resource, options) {
        options = options || {};

        const defaultColor = getDefaultColor(options);

        if (!resource) {
            outputError(options, 'call .getColor(null) without resource.');

            return this.prepareResult(defaultColor);
        }

        const originalSize = getOriginalSize(resource);
        const size = prepareSizeAndPosition(originalSize, options);

        if (!size.srcWidth || !size.srcHeight || !size.destWidth || !size.destHeight) {
            outputError(options, `incorrect sizes for resource "${resource.src}".`);

            return this.prepareResult(defaultColor);
        }

        if (!this._ctx) {
            this._canvas = makeCanvas();
            this._ctx = this._canvas.getContext && this._canvas.getContext('2d');

            if (!this._ctx) {
                outputError(options, 'Canvas Context 2D is not supported in this browser.');

                return this.prepareResult(defaultColor);
            }
        }

        this._canvas.width = size.destWidth;
        this._canvas.height = size.destHeight;

        let value = defaultColor;

        try {
            this._ctx.clearRect(0, 0, size.destWidth, size.destHeight);
            this._ctx.drawImage(
                resource,
                size.srcLeft, size.srcTop,
                size.srcWidth, size.srcHeight,
                0, 0,
                size.destWidth, size.destHeight
            );

            const bitmapData = this._ctx.getImageData(0, 0, size.destWidth, size.destHeight).data;
            value = this.getColorFromArray4(bitmapData, options);
        } catch (e) {
            outputError(options, `security error (CORS) for resource ${resource.src}.\nDetails: https://developer.mozilla.org/en/docs/Web/HTML/CORS_enabled_image`, e);
        }

        return this.prepareResult(value);
    }

    /**
     * Get the average color from a array when 1 pixel is 4 bytes.
     *
     * @param {number[]|Uint8Array|Uint8ClampedArray} arr
     * @param {Object} [options]
     * @param {string} [options.algorithm="sqrt"] "simple", "sqrt" or "dominant"
     * @param {number[]}  [options.defaultColor=[0, 0, 0, 0]] [red, green, blue, alpha]
     * @param {number[]}  [options.ignoredColor] [red, green, blue, alpha]
     * @param {number} [options.step=1]
     *
     * @returns {number[]} [red (0-255), green (0-255), blue (0-255), alpha (0-255)]
     */
    getColorFromArray4(arr, options) {
        options = options || {};

        const bytesPerPixel = 4;
        const arrLength = arr.length;
        const defaultColor = getDefaultColor(options);

        if (arrLength < bytesPerPixel) {
            return defaultColor;
        }

        const len = arrLength - arrLength % bytesPerPixel;
        const step = (options.step || 1) * bytesPerPixel;

        let algorithm;

        switch (options.algorithm || 'sqrt') {
            case 'simple':
                algorithm = simpleAlgorithm;
                break;
            case 'sqrt':
                algorithm = sqrtAlgorithm;
                break;
            case 'dominant':
                algorithm = dominantAlgorithm;
                break;
            default:
                throw getError(`${options.algorithm} is unknown algorithm.`);
        }

        return algorithm(arr, len, {
            defaultColor,
            ignoredColor: prepareIgnoredColor(options.ignoredColor),
            step
        });
    }

    /**
     * Get color data from value ([r, g, b, a]).
     *
     * @param {number[]} value
     *
     * @returns {FastAverageColorResult}
     */
    prepareResult(value) {
        const rgb = value.slice(0, 3);
        const rgba = [].concat(rgb, value[3] / 255);
        const isDarkColor = isDark(value);

        return {
            value,
            rgb: 'rgb(' + rgb.join(',') + ')',
            rgba: 'rgba(' + rgba.join(',') + ')',
            hex: arrayToHex(rgb),
            hexa: arrayToHex(value),
            isDark: isDarkColor,
            isLight: !isDarkColor
        };
    }

    /**
     * Destroy the instance.
     */
    destroy() {
        delete this._canvas;
        delete this._ctx;
    }

    _bindImageEvents(resource, options) {
        return new Promise((resolve, reject) => {
            const onload = () => {
                unbindEvents();

                const result = this.getColor(resource, options);

                if (result.error) {
                    reject(result.error);
                } else {
                    resolve(result);
                }
            };

            const onerror = () => {
                unbindEvents();

                reject(getError(`Error loading image "${resource.src}".`));
            };

            const onabort = () => {
                unbindEvents();

                reject(getError(`Image "${resource.src}" loading aborted.`));
            };

            const unbindEvents = () => {
                resource.removeEventListener('load', onload);
                resource.removeEventListener('error', onerror);
                resource.removeEventListener('abort', onabort);
            };

            resource.addEventListener('load', onload);
            resource.addEventListener('error', onerror);
            resource.addEventListener('abort', onabort);
        });
    }
}

/**
 * CropprCore
 * Here lies the main logic.
 */

/**
 * Define a list of handles to create.
 * 
 * @property {Array} position - The x and y ratio position of the handle within
 *      the crop region. Accepts a value between 0 to 1 in the order of [X, Y].
 * @property {Array} constraints - Define the side of the crop region that is to
 *      be affected by this handle. Accepts a value of 0 or 1 in the order of
 *      [TOP, RIGHT, BOTTOM, LEFT].
 * @property {String} cursor - The CSS cursor of this handle.
 */
const HANDLES = [
  { position: [0.0, 0.0], constraints: [1, 0, 0, 1], cursor: 'nw-resize' },
  { position: [0.5, 0.0], constraints: [1, 0, 0, 0], cursor: 'n-resize' },
  { position: [1.0, 0.0], constraints: [1, 1, 0, 0], cursor: 'ne-resize' },
  { position: [1.0, 0.5], constraints: [0, 1, 0, 0], cursor: 'e-resize' },
  { position: [1.0, 1.0], constraints: [0, 1, 1, 0], cursor: 'se-resize' },
  { position: [0.5, 1.0], constraints: [0, 0, 1, 0], cursor: 's-resize' },
  { position: [0.0, 1.0], constraints: [0, 0, 1, 1], cursor: 'sw-resize' },
  { position: [0.0, 0.5], constraints: [0, 0, 0, 1], cursor: 'w-resize' }
];

/**
 * Core class for Croppr containing most of its functional logic.
 */
class CropprCore {
  constructor(element, options, deferred = false) {    

    //Save options before parsing
    this.initOptions = options;

    // Parse options
    this.options = this.parseOptions(options);

    // Get target img element
    element = this.getElement(element);
    if (!element.getAttribute('src')) {
      throw 'Image src not provided.'
    }

    // Define internal props
    this._initialized = false;
    this._restore = {
      parent: element.parentNode,
      element: element
    };

    if(this.options.preview) {
      this._restore.preview = this.options.preview;
      this._restore.parentPreview = this.options.preview.parentNode;
    }

    // Wait until image is loaded before proceeding
    if (!deferred) {
      if (element.width === 0 || element.height === 0) {
        element.onload = () => { this.initialize(element); };
      } else {
        this.initialize(element);
      }
    }
  }

  /**
   * Initialize the Croppr instance
   */
  initialize(element) {

    // Create DOM elements
    this.createDOM(element);

    // Process option values
    this.getSourceSize();

    // Listen for events from children
    this.attachHandlerEvents();
    this.attachRegionEvents();
    this.attachOverlayEvents();

    // Bootstrap this cropper instance
    this.showModal("init");
    this.initializeBox(null, false);
    //Temporary FIX, see resizePreview() comments
    //Need a first redraw() to init cropprEl, imageEl dimensions
    this.strictlyConstrain();
    this.redraw();
    this.resetModal("init");

    // Set the initalized flag to true and call the callback
    this._initialized = true;
    if (this.options.onInitialize !== null) {
      this.options.onInitialize(this);
    }
    
    this.cropperEl.onwheel = event => {
      event.preventDefault();

      let { deltaY } = event;
      const maxDelta = 0.05;
      let coeff = deltaY > 0 ? 1 : -1;
      deltaY = Math.abs(deltaY) / 100;
      deltaY = deltaY > maxDelta ? maxDelta : deltaY;
      deltaY = 1 + coeff*deltaY;
      this.scaleBy(deltaY);

      // Trigger callback
      if(this.options.onCropMove !== null) {
        this.options.onCropMove(this.getValue());
      } 
      if(this.options.onCropStart !== null) {
        this.options.onCropStart(this.getValue());
      }

    };

    if(this.options.responsive) {
      let onResize;
      window.onresize = () => {
          clearTimeout(onResize);
          onResize = setTimeout(() => {
              this.forceRedraw();
          }, 100);
      };
    }

  }

  forceRedraw() {
    let newOptions = this.options;
    let cropData = this.responsiveData;

    const controlKeys = ["x","y","width","height"];
    for(var i=0; i<controlKeys.length; i++) {
      cropData[controlKeys[i]] = cropData[controlKeys[i]] > 1 ? 1 : cropData[controlKeys[i]] < 0 ? 0 : cropData[controlKeys[i]];
    }

    newOptions.startPosition = [cropData.x, cropData.y, "ratio"];
    newOptions.startSize = [cropData.width, cropData.height, "ratio"];
    newOptions = this.parseOptions(newOptions);
    
    this.showModal("onResize");
    this.initializeBox(newOptions);
    this.resetModal("onResize");
  }



  //Return element by html element or string
  getElement(element, type) {
    if(element) {
      if (!element.nodeName) {
        element = document.querySelector(element);
        if (element == null) { throw 'Unable to find element.' }
      }
    }
    return element
  }

  /**
   * Create Croppr's DOM elements
   */
  createDOM(targetEl) {
    // Create main container and use it as the main event listeners
    this.containerEl = document.createElement('div');
    this.containerEl.className = 'croppr-container';
    this.eventBus = this.containerEl;
    enableTouch(this.containerEl);

    // Create cropper element
    this.cropperEl = document.createElement('div');
    this.cropperEl.className = 'croppr';

    // Create image element
    this.imageEl = document.createElement('img');
    this.imageEl.setAttribute('crossOrigin', 'anonymous');
    this.imageEl.setAttribute('alt', targetEl.getAttribute('alt'));
    // Add onload listener to reinitialize box
    this.imageEl.onload = () => {
      this.getSourceSize();
      this.options = this.parseOptions(this.initOptions);
      this.showModal("setImage");
      this.initializeBox(null, false);
      //Temporary FIX, see initialize()
      this.strictlyConstrain();
      this.redraw();
      this.resetModal("setImage");
      if (this.options.onCropEnd !== null) {
        this.options.onCropEnd(this.getValue());
      }
      const fac = new FastAverageColor();
      const color = fac.getColor(this.imageEl);
      if (color) {
        this.isDark = color.isDark;
        if(this.isDark) this.cropperEl.className = "croppr croppr-dark";
        else this.cropperEl.className = "croppr croppr-light";
      }
      if(this.onImageLoad) this.onImageLoad();
    };
    this.imageEl.setAttribute('src', targetEl.getAttribute('src'));

    this.imageEl.className = 'croppr-image';

    // Create clipped image element
    this.imageClippedEl = this.imageEl.cloneNode();
    this.imageClippedEl.className = 'croppr-imageClipped';

    // Create region box element
    this.regionEl = document.createElement('div');
    this.regionEl.className = 'croppr-region';

    // Create overlay element
    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'croppr-overlay';

    // Create handles element
    let handleContainerEl = document.createElement('div');
    handleContainerEl.className = 'croppr-handleContainer';
    this.handles = [];
    for (let i = 0; i < HANDLES.length; i++) {
      const handle = new Handle(HANDLES[i].position,
        HANDLES[i].constraints,
        HANDLES[i].cursor,
        this.eventBus);
      this.handles.push(handle);
      handleContainerEl.appendChild(handle.el);
    }

    // And then we piece it all together!
    this.cropperEl.appendChild(this.imageEl);
    this.cropperEl.appendChild(this.imageClippedEl);
    this.cropperEl.appendChild(this.regionEl);
    this.cropperEl.appendChild(this.overlayEl);
    this.cropperEl.appendChild(handleContainerEl);
    this.containerEl.appendChild(this.cropperEl);

    // And then finally insert it into the document
    targetEl.parentElement.replaceChild(this.containerEl, targetEl);

    //Create Live Preview
    this.setLivePreview();

  }

  //If preview isn't null, create preview DOM
  setLivePreview() {

    if(this.options.preview) {

      this.preview = {};
      this.preview.parent = this.options.preview;
      this.preview.parent.style.position = "relative";

      let new_container = document.createElement("div");
      this.preview.container = this.preview.parent.appendChild(new_container);
      this.preview.container.style.overflow = "hidden";
      this.preview.container.style.position = "absolute";
      this.preview.container.style.top = "50%";
      this.preview.container.style.left = "50%";
      this.preview.container.style.transform = "translate(-50%, -50%)";

    }
  }

  resizePreview(cropData = null) {
    if(cropData === null) cropData = this.getValue("ratio");
    if(this.preview && cropData.width && cropData.height) {
      const targetWidth = this.preview.parent.offsetWidth;
      const targetHeight = this.preview.parent.offsetHeight;
      const targetRatio = targetWidth / targetHeight;

      const cropWidth = this.sourceSize.width * cropData.width;
      const cropHeight = this.sourceSize.height * cropData.height;

      const cropRatio = cropWidth / cropHeight;
      let containerWidth = targetWidth;
      let containerHeight = targetHeight;
      if (targetRatio > cropRatio) {
          containerWidth = containerHeight * cropRatio;
      } else {
          containerHeight = containerWidth / cropRatio;
      }

      //Can't explain why this affect this.getValue(), need to be fixed
      //console.log(1, this.getValue("ratio"));
      this.preview.container.style.width = containerWidth + "px";
      this.preview.container.style.height = containerHeight + "px";
      //console.log(2, this.getValue("ratio"));

      let resizeWidth = (this.sourceSize.width * containerWidth) / cropWidth;
      let resizeHeight = (this.sourceSize.height * containerHeight) / cropHeight;

      let deltaX = -cropData.x * resizeWidth;
      let deltaY = -cropData.y * resizeHeight;

      this.preview.image.style.width = resizeWidth + "px";
      this.preview.image.style.height = resizeHeight + "px";

      this.preview.image.style.left = deltaX + "px";
      this.preview.image.style.top = deltaY + "px";
    }
  }

  strictlyConstrain(opts = null, origin = null) {

    let origins;
    if(origin === null) {
      origins = [[0,0], [1,1]];
      origin = [.5, .5];
    } else {
      origins = [origin];
    }

    if(opts === null) opts = this.options;

    const { width: parentWidth, height: parentHeight } = this.imageEl.getBoundingClientRect();

    this.box.constrainToRatio(opts.aspectRatio, origin, "height", opts.maxAspectRatio);
    this.box.constrainToSize(opts.maxSize.width, opts.maxSize.height, opts.minSize.width, opts.minSize.height, origin, opts.aspectRatio, opts.maxAspectRatio);

    origins.map( newOrigin => {
      this.box.constrainToBoundary(parentWidth, parentHeight, newOrigin);
    } );
    
  }

  /**
   * Changes the image src.
   * @param {String} src
   */
  setImage(src, callback) {
    // Change image source
    this.onImageLoad = callback;
    this.imageEl.src = src;
    this.imageClippedEl.src = src;
    return this;
  }

  /**
   * Destroy the Croppr instance and replace with the original element.
   */
  destroy() {
    try {
      if (this.containerEl) {
        this._restore.parent.replaceChild(this._restore.element, this.containerEl);
        if(this.options.preview) {
          this.preview.image.parentNode.removeChild(this.preview.image);
          this.preview.container.parentNode.removeChild(this.preview.container);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Create a new box region with a set of options.
   * @param {Object} opts The options.
   * @returns {Box}
   */
  initializeBox(opts = null, constrain = true) {

    if(opts === null) opts = this.options;

    this.convertOptionsToPixels(opts);

    //Define box size
    let boxWidth = opts.startSize.width;
    let boxHeight = opts.startSize.height;

    if(opts.minSize) {
      if(boxWidth < opts.minSize.width) boxWidth = opts.minSize.width;
      else if(boxWidth < opts.maxSize.width) boxWidth = opts.maxSize.width;
    }
    if(opts.maxSize) {
      if(boxHeight < opts.minSize.height) boxHeight = opts.minSize.height;
      else if(boxHeight < opts.maxSize.height) boxHeight = opts.maxSize.height;
    }

    //Create initial box
    let box = new Box(0, 0, boxWidth, boxHeight);

    //Define crop position
    let x = 0;
    let y = 0;
    if(opts.startPosition === null) {
      // Move to center
      const { width: parentWidth, height: parentHeight } = this.imageEl.getBoundingClientRect();
      x = (parentWidth / 2) - (boxWidth / 2);
      y = (parentHeight / 2) - (boxHeight / 2);
    } else {
      x = opts.startPosition.x;
      y = opts.startPosition.y;
    }
    box.move(x, y);

    //Reset preview img
    if(this.preview) {

      //If image in live preview already exists, delete it
      if(this.preview.image) {
        this.preview.image.parentNode.removeChild(this.preview.image);
        this.preview.image = null;
      }
      let new_img = document.createElement("img");
      new_img.src = this.imageEl.src;

      this.preview.image = this.preview.container.appendChild(new_img);
      this.preview.image.style.position = "relative";

    }

    if(constrain === true) this.strictlyConstrain();
    this.box = box;
    this.redraw();

    //Hide some handles if there are 2 ratios
    for(var i=0; i<this.handles.length; i++) {
      if(this.options.maxAspectRatio && (this.handles[i].position[0] == 0.5 || this.handles[i].position[1] == 0.5) ) {
        this.handles[i].el.style.display = "none";
      } else {
        this.handles[i].el.style.display = "block";
      }
    }

    return box;
  }

  showModal(operationName="default") {

    let modalStyle = this.modalStyle;
    if(modalStyle && modalStyle.modalIsDisplayed === true) {
      return modalStyle
    }

    if(this.options.modal) {
      let { modal } = this.options;

      let display = modal.currentStyle ? modal.currentStyle.display :
      getComputedStyle(modal, null).display;
      let visibility =  modal.currentStyle ? modal.currentStyle.visibility :
      getComputedStyle(modal, null).visibility;

      modalStyle = {
        operationName: operationName,
        modalIsDisplayed: true,
        display: display,
        visibility: visibility
      };
      this.modalStyle = modalStyle;

      if(display === "none") {
        modal.style.visibility = "hidden";
        modal.style.display = "block";
      }
    }

    return modalStyle

  }

  resetModal(oldOperationName="default") {
    let modalStyle = this.modalStyle;
    if(modalStyle) {
      let { visibility, display, operationName, modalIsDisplayed } = modalStyle;
      if( modalIsDisplayed && oldOperationName === operationName  ) {
        let { modal } = this.options;
        modal.style.visibility = visibility;
        modal.style.display = display;
        this.modalStyle = {
          operationName: null,
          modalIsDisplayed: false
        };
      }
    }
  }

  getSourceSize() {
    //Get raw image dimensions
    this.sourceSize = {};
    this.sourceSize.width = this.imageEl.naturalWidth;
    this.sourceSize.height = this.imageEl.naturalHeight;
    return this.sourceSize;
  }

  convertor(data, inputMode, outputMode) {
    const convertRealDataToPixel = data => {
      this.showModal();
      const { width, height } = this.imageEl.getBoundingClientRect();
      this.resetModal();
      const factorX = this.sourceSize.width / width;
      const factorY = this.sourceSize.height / height;
      if(data.width) {
        data.width /= factorX;
      } 
      if(data.x) {
        data.x /= factorX;
      }
      if(data.height) {
        data.height /= factorY;
      } 
      if(data.y) {
        data.y /= factorY;
      }
      return data;
    };
    const convertPercentToPixel = data => {
      this.showModal();
      const { width, height } = this.imageEl.getBoundingClientRect();
      this.resetModal();
      if (data.width) {
        data.width *= width;
      } 
      if (data.x) {
        data.x *= width;
      }

      if (data.height) {
        data.height *= height;
      } 
      if (data.y) {
        data.y *= height;
      } 
      return data;
    };
    if(inputMode === "real" && outputMode === "raw") {
      return convertRealDataToPixel(data)
    } else if(inputMode === "ratio" && outputMode === "raw") {
      return convertPercentToPixel(data)
    }
    return null
  }

  convertOptionsToPixels(opts = null) {
    let setOptions = false;
    if(opts === null) {
      opts = this.options;
      setOptions = true;
    }
    const { width, height } = this.imageEl.getBoundingClientRect();
    // Convert sizes
    const sizeKeys = ['maxSize', 'minSize', 'startSize', 'startPosition'];
    for (let i = 0; i < sizeKeys.length; i++) {
      const key = sizeKeys[i];
      if (opts[key] !== null) {
        if (opts[key].unit == 'ratio') {
          opts[key] = this.convertor(opts[key], "ratio", "raw");
        } else if(opts[key].unit === 'real') {
          opts[key] = this.convertor(opts[key], "real", "raw");
        }
        delete opts[key].unit;
      }
    }
    if(opts.minSize) {
      if(opts.minSize.width > width) opts.minSize.width = width;
      if(opts.minSize.height > height) opts.minSize.height = height;
    }
    if(opts.startSize && opts.startPosition) {
      let xEnd = opts.startPosition.x + opts.startSize.width;
      if(xEnd > width) opts.startPosition.x -= (xEnd-width);
      let yEnd = opts.startPosition.y + opts.startSize.height;
      if(yEnd > height) opts.startPosition.y -= (yEnd-height);
    }
    if(setOptions) this.options = opts;
    return opts
  }


  /**
   * Draw visuals (border, handles, etc) for the current box.
   */
  redraw() {

    //Resize Live Preview
    this.resizePreview();

    // Round positional values to prevent subpixel coordinates, which can
    // result in element that is rendered blurly
    const width = Math.round(this.box.width()),
      height = Math.round(this.box.height()),
      x1 = Math.round(this.box.x1),
      y1 = Math.round(this.box.y1),
      x2 = Math.round(this.box.x2),
      y2 = Math.round(this.box.y2);

    window.requestAnimationFrame(() => {
      // Update region element
      this.regionEl.style.transform = `translate(${x1}px, ${y1}px)`;
      this.regionEl.style.width = width + 'px';
      this.regionEl.style.height = height + 'px';

      // Update clipped image element
      this.imageClippedEl.style.clip = `rect(${y1}px, ${x2}px, ${y2}px, ${x1}px)`;

      // Determine which handle to bring forward. The following code
      // calculates the quadrant the box is in using bitwise operators.
      // Reference: https://stackoverflow.com/questions/9718059
      const center = this.box.getAbsolutePoint([.5, .5]);
      const { width: parentWidth, height: parentHeight } = this.imageEl.getBoundingClientRect();
      const xSign = (center[0] - parentWidth / 2) >> 31;
      const ySign = (center[1] - parentHeight / 2) >> 31;
      const quadrant = (xSign ^ ySign) + ySign + ySign + 4;

      // The following equation calculates which handle index to bring
      // forward. The equation is derived using algebra (if youre curious)
      const foregroundHandleIndex = -2 * quadrant + 8;

      // Update handle positions
      for (let i = 0; i < this.handles.length; i++) {
        let handle = this.handles[i];

        // Calculate handle position
        const handleWidth = handle.el.offsetWidth;
        const handleHeight = handle.el.offsetHeight;
        const left = x1 + (width * handle.position[0]) - handleWidth / 2;
        const top = y1 + (height * handle.position[1]) - handleHeight / 2;

        // Apply new position. The positional values are rounded to
        // prevent subpixel positions which can result in a blurry element
        handle.el.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
        handle.el.style.zIndex = foregroundHandleIndex == i ? 5 : 4;
      }
    });
  }


  /**
   * Attach listeners for events emitted by the handles.
   * Enables resizing of the region element.
   */
  attachHandlerEvents() {
    const eventBus = this.eventBus;
    eventBus.addEventListener('handlestart', this.onHandleMoveStart.bind(this));
    eventBus.addEventListener('handlemove', this.onHandleMoveMoving.bind(this));
    eventBus.addEventListener('handleend', this.onHandleMoveEnd.bind(this));
  }

  /**
   * Attach event listeners for the crop region element.
   * Enables dragging/moving of the region element.
   */
  attachRegionEvents() {
    const eventBus = this.eventBus;

    this.regionEl.addEventListener('mousedown', onMouseDown);
    eventBus.addEventListener('regionstart', this.onRegionMoveStart.bind(this));
    eventBus.addEventListener('regionmove', this.onRegionMoveMoving.bind(this));
    eventBus.addEventListener('regionend', this.onRegionMoveEnd.bind(this));

    function onMouseDown(e) {
      e.stopPropagation();
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('mousemove', onMouseMove);

      // Notify parent
      eventBus.dispatchEvent(new CustomEvent('regionstart', {
        detail: { mouseX: e.clientX, mouseY: e.clientY }
      }));
    }

    function onMouseMove(e) {
      e.stopPropagation();

      // Notify parent
      eventBus.dispatchEvent(new CustomEvent('regionmove', {
        detail: { mouseX: e.clientX, mouseY: e.clientY }
      }));
    }

    function onMouseUp(e) {
      e.stopPropagation();
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);

      // Notify parent
      eventBus.dispatchEvent(new CustomEvent('regionend', {
        detail: { mouseX: e.clientX, mouseY: e.clientY }
      }));
    }
  }

  /**
   * Attach event listeners for the overlay element.
   * Enables the creation of a new selection by dragging an empty area.
   */
  attachOverlayEvents() {
    const SOUTHEAST_HANDLE_IDX = 4;
    const self = this;
    let tmpBox = null;
    this.overlayEl.addEventListener('mousedown', onMouseDown);

    function onMouseDown(e) {
      e.stopPropagation();
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('mousemove', onMouseMove);

      // Calculate mouse's position in relative to the container
      const container = self.cropperEl.getBoundingClientRect();
      const mouseX = e.clientX - container.left;
      const mouseY = e.clientY - container.top;

      // Create new box at mouse position
      tmpBox = self.box;
      self.box = new Box(mouseX, mouseY, mouseX + 1, mouseY + 1);

      // Activate the bottom right handle
      self.eventBus.dispatchEvent(new CustomEvent('handlestart', {
        detail: { handle: self.handles[SOUTHEAST_HANDLE_IDX] }
      }));
    }

    function onMouseMove(e) {
      e.stopPropagation();
      self.eventBus.dispatchEvent(new CustomEvent('handlemove', {
        detail: { mouseX: e.clientX, mouseY: e.clientY }
      }));
    }

    function onMouseUp(e) {
      e.stopPropagation();
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);

      // If the new box has no width and height, it suggests that
      // the user had just clicked on an empty area and did not drag
      // a new box (ie. an accidental click). In this scenario, we
      // simply replace it with the previous box.
      if (self.box.width() === 1 && self.box.height() === 1) {
        self.box = tmpBox;
        return;
      }

      self.eventBus.dispatchEvent(new CustomEvent('handleend', {
        detail: { mouseX: e.clientX, mouseY: e.clientY }
      }));
    }

  }

  /**
   * EVENT HANDLER
   * Executes when user begins dragging a handle.
   */
  onHandleMoveStart(e) {
    let handle = e.detail.handle;

    // The origin point is the point where the box is scaled from.
    // This is usually the opposite side/corner of the active handle.
    const originPoint = [1 - handle.position[0], 1 - handle.position[1]];
    let [originX, originY] = this.box.getAbsolutePoint(originPoint);

    this.activeHandle = { handle, originPoint, originX, originY };

    // Trigger callback
    if (this.options.onCropStart !== null) {
      this.options.onCropStart(this.getValue());
    }
  }

  /**
   * EVENT HANDLER
   * Executes on handle move. Main logic to manage the movement of handles.
   */
  onHandleMoveMoving(e) {
    let { mouseX, mouseY } = e.detail;

    // Calculate mouse's position in relative to the container
    let container = this.cropperEl.getBoundingClientRect();
    mouseX = mouseX - container.left;
    mouseY = mouseY - container.top;

    // Ensure mouse is within the boundaries
    if (mouseX < 0) { mouseX = 0; }
    else if (mouseX > container.width) { mouseX = container.width; }

    if (mouseY < 0) { mouseY = 0; }
    else if (mouseY > container.height) { mouseY = container.height; }

    // Bootstrap helper variables
    let origin = this.activeHandle.originPoint.slice();
    const originX = this.activeHandle.originX;
    const originY = this.activeHandle.originY;
    const handle = this.activeHandle.handle;
    const TOP_MOVABLE = handle.constraints[0] === 1;
    const RIGHT_MOVABLE = handle.constraints[1] === 1;
    const BOTTOM_MOVABLE = handle.constraints[2] === 1;
    const LEFT_MOVABLE = handle.constraints[3] === 1;
    const MULTI_AXIS = (LEFT_MOVABLE || RIGHT_MOVABLE) &&
      (TOP_MOVABLE || BOTTOM_MOVABLE);

    // Apply movement to respective sides according to the handle's
    // constraint values.
    let x1 = LEFT_MOVABLE || RIGHT_MOVABLE ? originX : this.box.x1;
    let x2 = LEFT_MOVABLE || RIGHT_MOVABLE ? originX : this.box.x2;
    let y1 = TOP_MOVABLE || BOTTOM_MOVABLE ? originY : this.box.y1;
    let y2 = TOP_MOVABLE || BOTTOM_MOVABLE ? originY : this.box.y2;
    x1 = LEFT_MOVABLE ? mouseX : x1;
    x2 = RIGHT_MOVABLE ? mouseX : x2;
    y1 = TOP_MOVABLE ? mouseY : y1;
    y2 = BOTTOM_MOVABLE ? mouseY : y2;

    // Check if the user dragged past the origin point. If it did,
    // we set the flipped flag to true.
    let [isFlippedX, isFlippedY] = [false, false];
    if (LEFT_MOVABLE || RIGHT_MOVABLE) {
      isFlippedX = LEFT_MOVABLE ? mouseX > originX : mouseX < originX;
    }
    if (TOP_MOVABLE || BOTTOM_MOVABLE) {
      isFlippedY = TOP_MOVABLE ? mouseY > originY : mouseY < originY;
    }

    // If it is flipped, we swap the coordinates and flip the origin point.
    if (isFlippedX) {
      const tmp = x1; x1 = x2; x2 = tmp; // Swap x1 and x2
      origin[0] = 1 - origin[0]; // Flip origin x point
    }
    if (isFlippedY) {
      const tmp = y1; y1 = y2; y2 = tmp; // Swap y1 and y2
      origin[1] = 1 - origin[1]; // Flip origin y point
    }

    // Create new box object
    let box = new Box(x1, y1, x2, y2);

    // Maintain aspect ratio
    if (this.options.aspectRatio) {
      let ratio = this.options.aspectRatio;
      let isVerticalMovement = false;
      if (MULTI_AXIS) {
        isVerticalMovement = (mouseY > box.y1 + ratio * box.width()) ||
          (mouseY < box.y2 - ratio * box.width());
      } else if (TOP_MOVABLE || BOTTOM_MOVABLE) {
        isVerticalMovement = true;
      }
      const ratioMode = isVerticalMovement ? 'width' : 'height';
      box.constrainToRatio(ratio, origin, ratioMode, this.options.maxAspectRatio);
    }

    // Maintain minimum/maximum size
    box.constrainToSize(this.options.maxSize.width, this.options.maxSize.height, this.options.minSize.width, this.options.minSize.height,
      origin, this.options.aspectRatio, this.options.maxAspectRatio);
    
    // Constrain to boundary
    const { width: parentWidth, height: parentHeight } = this.imageEl.getBoundingClientRect();
    let boundaryOrigins = [origin];
    if(this.options.maxAspectRatio) boundaryOrigins = [[0, 0], [1, 1]];
    boundaryOrigins.map( boundaryOrigin => {
      box.constrainToBoundary(parentWidth, parentHeight, boundaryOrigin);
    });
    
    // Finally, update the visuals (border, handles, clipped image, etc)
    this.box = box;
    this.redraw();

    // Trigger callback
    if (this.options.onCropMove !== null) {
      this.options.onCropMove(this.getValue());
    }
  }

  /**
   * EVENT HANDLER
   * Executes on handle move end.
   */
  onHandleMoveEnd(e) {

    // Trigger callback
    if (this.options.onCropEnd !== null) {
      this.options.onCropEnd(this.getValue());
    }
  }

  /**
   * EVENT HANDLER
   * Executes when user starts moving the crop region.
   */
  onRegionMoveStart(e) {
    let { mouseX, mouseY } = e.detail;

    // Calculate mouse's position in relative to the container
    let container = this.cropperEl.getBoundingClientRect();
    mouseX = mouseX - container.left;
    mouseY = mouseY - container.top;

    this.currentMove = {
      offsetX: mouseX - this.box.x1,
      offsetY: mouseY - this.box.y1
    };

    // Trigger callback
    if (this.options.onCropStart !== null) {
      this.options.onCropStart(this.getValue());
    }

  }

  /**
   * EVENT HANDLER
   * Executes when user moves the crop region.
   */
  onRegionMoveMoving(e) {
    let { mouseX, mouseY } = e.detail;
    let { offsetX, offsetY } = this.currentMove;

    // Calculate mouse's position in relative to the container
    let container = this.cropperEl.getBoundingClientRect();
    mouseX = mouseX - container.left;
    mouseY = mouseY - container.top;

    this.box.move(mouseX - offsetX, mouseY - offsetY);

    // Ensure box is within the boundaries
    if (this.box.x1 < 0) {
      this.box.move(0, null);
    }
    if (this.box.x2 > container.width) {
      this.box.move(container.width - this.box.width(), null);
    }
    if (this.box.y1 < 0) {
      this.box.move(null, 0);
    }
    if (this.box.y2 > container.height) {
      this.box.move(null, container.height - this.box.height());
    }

    // Update visuals
    this.redraw();

    // Trigger callback
    if (this.options.onCropMove !== null) {
      this.options.onCropMove(this.getValue());
    }
  }

  /**
   * EVENT HANDLER
   * Executes when user stops moving the crop region (mouse up).
   */
  onRegionMoveEnd(e) {
    // Trigger callback
    if (this.options.onCropEnd !== null) {
      this.options.onCropEnd(this.getValue());
    }
  }

  /**
   * Calculate the value of the crop region.
   */
  getValue(mode = null) {
    if (mode === null) { mode = this.options.returnMode; }
    let cropData = {};
    if (mode == 'real') {
      cropData = this.getValueAsRealData();
    } else if (mode == 'ratio') {
      cropData = this.getValueAsRatio();
    } else if (mode == 'raw') {
      cropData = {
        x: Math.round(this.box.x1),
        y: Math.round(this.box.y1),
        width: Math.round(this.box.width()),
        height: Math.round(this.box.height())
      };
    }
    if(this.options.responsive) {
      if(mode == "ratio") this.responsiveData = cropData;
      else this.responsiveData = this.getValueAsRatio();
    }
    return cropData;
  }

  getValueAsRealData() {
    this.showModal();
    const actualWidth = this.imageEl.naturalWidth;
    const actualHeight = this.imageEl.naturalHeight;
    const { width: elementWidth, height: elementHeight } = this.imageEl.getBoundingClientRect();
    const factorX = actualWidth / elementWidth;
    const factorY = actualHeight / elementHeight;
    this.resetModal();
    return {
      x: Math.round(this.box.x1 * factorX),
      y: Math.round(this.box.y1 * factorY),
      width: Math.round(this.box.width() * factorX),
      height: Math.round(this.box.height() * factorY)
    }
  }

  getValueAsRatio() {
    this.showModal();
    const { width: elementWidth, height: elementHeight } = this.imageEl.getBoundingClientRect();
    this.resetModal();
    return {
      x: this.box.x1 / elementWidth,
      y: this.box.y1 / elementHeight,
      width: this.box.width() / elementWidth,
      height: this.box.height() / elementHeight
    }
  }

  /**
   * Parse user options and set default values.
   */
  parseOptions(opts = null) {
    if(opts === null) opts = this.options;
    const defaults = {
      aspectRatio: null,
      maxAspectRatio: null,
      maxSize: { width: null, height: null, unit: 'raw' },
      minSize: { width: null, height: null, unit: 'raw' },
      startSize: { width: 1, height: 1, unit: 'ratio' },
      startPosition: null,
      returnMode: 'real',
      onInitialize: null,
      onCropStart: null,
      onCropMove: null,
      onCropEnd: null,
      preview: null,
      responsive: true,
      modal: null
    };

    //Parse preview
    let preview = null;
    if(opts.preview !== null) preview = this.getElement(opts.preview);

    //Parse preview
    let modal = null;
    if(opts.modal !== null) modal = this.getElement(opts.modal);

    //Parse responsive
    let responsive = null;
    if(opts.responsive !== null) responsive = opts.responsive;

    // Parse aspect ratio
    let aspectRatio = null;
    let maxAspectRatio = null;
    const ratioKeys = ["aspectRatio", "maxAspectRatio"];
    for(var i=0; i<ratioKeys.length; i++) {
      if (opts[ratioKeys[i]] !== undefined) {
        if (typeof (opts[ratioKeys[i]]) === 'number') {
          let ratio = opts[ratioKeys[i]];
          if(ratioKeys[i] === "aspectRatio") aspectRatio = ratio;
          else maxAspectRatio = ratio;
        } else if (opts[ratioKeys[i]] instanceof Array) {
          let ratio = opts[ratioKeys[i]][1] / opts[ratioKeys[i]][0];
          if(ratioKeys[i] === "aspectRatio") aspectRatio = ratio;
          else maxAspectRatio = ratio;
        }
      }
    }
    

    // Parse max width/height
    let maxSize = null;
    if (opts.maxSize !== undefined && opts.maxSize !== null) {
      maxSize = {
        width: opts.maxSize[0] || null,
        height: opts.maxSize[1] || null,
        unit: opts.maxSize[2] || 'raw'
      };
    }

    // Parse min width/height
    let minSize = null;
    if (opts.minSize !== undefined && opts.minSize !== null) {
      minSize = {
        width: opts.minSize[0] || null,
        height: opts.minSize[1] || null,
        unit: opts.minSize[2] || 'raw'
      };
    }

    // Parse start size
    let startSize = null;
    if (opts.startSize !== undefined && opts.startSize !== null) {
      startSize = {
        width: opts.startSize[0] || null,
        height: opts.startSize[1] || null,
        unit: opts.startSize[2] || 'ratio'
      };
    }

    // Parse start position
    let startPosition = null;
    if (opts.startPosition !== undefined && opts.startPosition !== null) {
      startPosition = {
        x: opts.startPosition[0] || null,
        y: opts.startPosition[1] || null,
        unit: opts.startPosition[2] || 'ratio'
      };
    }

    // Parse callbacks
    let onInitialize = null;
    if (typeof opts.onInitialize === 'function') {
      onInitialize = opts.onInitialize;
    }

    let onCropStart = null;
    if (typeof opts.onCropStart === 'function') {
      onCropStart = opts.onCropStart;
    }

    let onCropEnd = null;
    if (typeof opts.onCropEnd === 'function') {
      onCropEnd = opts.onCropEnd;
    }

    let onCropMove = null;
    if (typeof opts.onUpdate === 'function') {
      // DEPRECATED: onUpdate is deprecated to create a more uniform
      // callback API, such as: onCropStart, onCropMove, onCropEnd
      console.warn('Croppr.js: `onUpdate` is deprecated and will be removed in the next major release. Please use `onCropMove` or `onCropEnd` instead.');
      onCropMove = opts.onUpdate;
    }
    if (typeof opts.onCropMove === 'function') {
      onCropMove = opts.onCropMove;
    }

    // Parse returnMode value
    let returnMode = null;
    if (opts.returnMode !== undefined) {
      const s = opts.returnMode.toLowerCase();
      if (['real', 'ratio', 'raw'].indexOf(s) === -1) {
        throw "Invalid return mode.";
      }
      returnMode = s;
    } 


    const defaultValue = (v, d) => (v !== null ? v : d);
    return {
      aspectRatio: defaultValue(aspectRatio, defaults.aspectRatio),
      maxAspectRatio: defaultValue(maxAspectRatio, defaults.maxAspectRatio),
      maxSize: defaultValue(maxSize, defaults.maxSize),
      minSize: defaultValue(minSize, defaults.minSize),
      startSize: defaultValue(startSize, defaults.startSize),
      startPosition: defaultValue(startPosition, defaults.startPosition),
      returnMode: defaultValue(returnMode, defaults.returnMode),
      onInitialize: defaultValue(onInitialize, defaults.onInitialize),
      onCropStart: defaultValue(onCropStart, defaults.onCropStart),
      onCropMove: defaultValue(onCropMove, defaults.onCropMove),
      onCropEnd: defaultValue(onCropEnd, defaults.onCropEnd),
      preview: defaultValue(preview, defaults.preview),
      responsive: defaultValue(responsive, defaults.responsive),
      modal: defaultValue(modal, defaults.modal)
    }
  }
}

/**
 * Fork from Croppr.js : https://github.com/jamesssooi/Croppr.js
 * 
 * A JavaScript image cropper that's lightweight, awesome, and has
 * zero dependencies.
 * 
 * (C) 2017 James Ooi. Released under the MIT License.
 *
 * Fork by Adrien du Repaire : https://github.com/devdanim/dnm-croppr
 * 
 * 
 */

/**
 * This class is a wrapper for CropprCore that merely implements the main
 * interfaces for the Croppr instance. Look into CropprCore for all the
 * main logic.
 */
class Croppr extends CropprCore {
  /**
   * @constructor
   * Calls the CropprCore's constructor.
   */
  constructor(element, options, _deferred = false) {
    super(element, options, _deferred);
  }

  /**
   * Gets the value of the crop region.
   * @param {String} [mode] Which mode of calculation to use: 'real', 'ratio' or
   *      'raw'.
   */
  getValue(mode) {
    return super.getValue(mode);
  }

  /**
   * Changes the image src.
   * @param {String} src
   */
  setImage(src, callback = null) {
    return super.setImage(src, callback);
  }

  /**
   * Destroys the Croppr instance
   */
  destroy() {
    return super.destroy();
  }

  /**
   * Moves the crop region to a specified coordinate.
   * @param {Number} x
   * @param {Number} y
   */
  moveTo(x, y, constrain = true, mode = "raw") {

    this.showModal("moveTo");

    if(mode === "ratio" || mode === "real") {
      let data = this.convertor( {x, y} , mode, "raw");
      x = data.x;
      y = data.y;
    }

    this.box.move(x, y);
    if(constrain === true) this.strictlyConstrain(null, [0,0]);
    
    this.redraw();

    this.resetModal("moveTo");

    // Call the callback
    if (this.options.onCropEnd !== null) {
      this.options.onCropEnd(this.getValue());
    }
    return this;
  }

  /**
   * Resizes the crop region to a specified width and height.
   * @param {Number} width
   * @param {Number} height
   * @param {Array} origin The origin point to resize from.
   *      Defaults to [0.5, 0.5] (center).
   */
  resizeTo(width, height, origin = null, constrain = true, mode = "raw") {

    this.showModal("resize");

    if(mode === "ratio" || mode === "real") {
      let data = {
        width: width,
        height: height
      };
      data = this.convertor( data, mode, "raw");
      width = data.width;
      height = data.height;
    }

    if(origin === null) origin = [.5, .5];

    this.box.resize(width, height, origin);
    if(constrain === true) this.strictlyConstrain();

    this.redraw();

    this.resetModal("resize");

    // Call the callback
    if (this.options.onCropEnd !== null) {
      this.options.onCropEnd(this.getValue());
    }
    return this;
  }

  setValue(data, constrain = true, mode = "ratio") {

    this.showModal("setValue");

    if(mode === "ratio" || mode === "real") {
      data = this.convertor(data, mode, "raw");
    }

    this.moveTo(data.x, data.y, false);
    this.resizeTo(data.width, data.height, [0,0], constrain);

    this.resetModal("setValue");
    
    return this

  }

  /**
   * Scale the crop region by a factor.
   * @param {Number} factor
   * @param {Array} origin The origin point to resize from.
   *      Defaults to [0.5, 0.5] (center).
   */
  scaleBy(factor, origin = null, constrain = true) {

    if(origin === null) origin = [.5, .5];
    
    this.showModal("scaleBy");
    this.box.scale(factor, origin);
    if(constrain === true) this.strictlyConstrain();
    this.redraw();
    this.resetModal("scaleBy");

    // Call the callback
    if (this.options.onCropEnd !== null) {
      this.options.onCropEnd(this.getValue());
    }
    return this;
  }

  /**
   * Resets the crop region to the initial settings.
   */
  reset() {

    this.showModal("reset");

    this.box = this.initializeBox(this.options);
    this.redraw();

    this.resetModal("reset");

    // Call the callback
    if (this.options.onCropEnd !== null) {
      this.options.onCropEnd(this.getValue());
    }
    return this;
  }
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var smartcrop = createCommonjsModule(function (module, exports) {
/**
 * smartcrop.js
 * A javascript library implementing content aware image cropping
 *
 * Copyright (C) 2018 Jonas Wagner
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function() {

  var smartcrop = {};
  // Promise implementation to use
  smartcrop.Promise =
    typeof Promise !== 'undefined'
      ? Promise
      : function() {
        throw new Error('No native promises and smartcrop.Promise not set.');
      };

  smartcrop.DEFAULTS = {
    width: 0,
    height: 0,
    aspect: 0,
    cropWidth: 0,
    cropHeight: 0,
    detailWeight: 0.2,
    skinColor: [0.78, 0.57, 0.44],
    skinBias: 0.01,
    skinBrightnessMin: 0.2,
    skinBrightnessMax: 1.0,
    skinThreshold: 0.8,
    skinWeight: 1.8,
    saturationBrightnessMin: 0.05,
    saturationBrightnessMax: 0.9,
    saturationThreshold: 0.4,
    saturationBias: 0.2,
    saturationWeight: 0.1,
    // Step * minscale rounded down to the next power of two should be good
    scoreDownSample: 8,
    step: 8,
    scaleStep: 0.1,
    minScale: 1.0,
    maxScale: 1.0,
    edgeRadius: 0.4,
    edgeWeight: -20.0,
    outsideImportance: -0.5,
    boostWeight: 100.0,
    ruleOfThirds: true,
    prescale: true,
    imageOperations: null,
    canvasFactory: defaultCanvasFactory,
    // Factory: defaultFactories,
    debug: false
  };

  smartcrop.crop = function(inputImage, options_, callback) {
    var options = extend({}, smartcrop.DEFAULTS, options_);

    if (options.aspect) {
      options.width = options.aspect;
      options.height = 1;
    }

    if (options.imageOperations === null) {
      options.imageOperations = canvasImageOperations(options.canvasFactory);
    }

    var iop = options.imageOperations;

    var scale = 1;
    var prescale = 1;

    // open the image
    return iop
      .open(inputImage, options.input)
      .then(function(image) {
        // calculate desired crop dimensions based on the image size
        if (options.width && options.height) {
          scale = min(
            image.width / options.width,
            image.height / options.height
          );
          options.cropWidth = ~~(options.width * scale);
          options.cropHeight = ~~(options.height * scale);
          // Img = 100x100, width = 95x95, scale = 100/95, 1/scale > min
          // don't set minscale smaller than 1/scale
          // -> don't pick crops that need upscaling
          options.minScale = min(
            options.maxScale,
            max(1 / scale, options.minScale)
          );

          // prescale if possible
          if (options.prescale !== false) {
            prescale = min(max(256 / image.width, 256 / image.height), 1);
            if (prescale < 1) {
              image = iop.resample(
                image,
                image.width * prescale,
                image.height * prescale
              );
              options.cropWidth = ~~(options.cropWidth * prescale);
              options.cropHeight = ~~(options.cropHeight * prescale);
              if (options.boost) {
                options.boost = options.boost.map(function(boost) {
                  return {
                    x: ~~(boost.x * prescale),
                    y: ~~(boost.y * prescale),
                    width: ~~(boost.width * prescale),
                    height: ~~(boost.height * prescale),
                    weight: boost.weight
                  };
                });
              }
            } else {
              prescale = 1;
            }
          }
        }
        return image;
      })
      .then(function(image) {
        return iop.getData(image).then(function(data) {
          var result = analyse(options, data);

          var crops = result.crops || [result.topCrop];
          for (var i = 0, iLen = crops.length; i < iLen; i++) {
            var crop = crops[i];
            crop.x = ~~(crop.x / prescale);
            crop.y = ~~(crop.y / prescale);
            crop.width = ~~(crop.width / prescale);
            crop.height = ~~(crop.height / prescale);
          }
          if (callback) callback(result);
          return result;
        });
      });
  };

  // Check if all the dependencies are there
  // todo:
  smartcrop.isAvailable = function(options) {
    if (!smartcrop.Promise) return false;

    var canvasFactory = options ? options.canvasFactory : defaultCanvasFactory;

    if (canvasFactory === defaultCanvasFactory) {
      var c = document.createElement('canvas');
      if (!c.getContext('2d')) {
        return false;
      }
    }

    return true;
  };

  function edgeDetect(i, o) {
    var id = i.data;
    var od = o.data;
    var w = i.width;
    var h = i.height;

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var p = (y * w + x) * 4;
        var lightness;

        if (x === 0 || x >= w - 1 || y === 0 || y >= h - 1) {
          lightness = sample(id, p);
        } else {
          lightness =
            sample(id, p) * 4 -
            sample(id, p - w * 4) -
            sample(id, p - 4) -
            sample(id, p + 4) -
            sample(id, p + w * 4);
        }

        od[p + 1] = lightness;
      }
    }
  }

  function skinDetect(options, i, o) {
    var id = i.data;
    var od = o.data;
    var w = i.width;
    var h = i.height;

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var p = (y * w + x) * 4;
        var lightness = cie(id[p], id[p + 1], id[p + 2]) / 255;
        var skin = skinColor(options, id[p], id[p + 1], id[p + 2]);
        var isSkinColor = skin > options.skinThreshold;
        var isSkinBrightness =
          lightness >= options.skinBrightnessMin &&
          lightness <= options.skinBrightnessMax;
        if (isSkinColor && isSkinBrightness) {
          od[p] =
            (skin - options.skinThreshold) *
            (255 / (1 - options.skinThreshold));
        } else {
          od[p] = 0;
        }
      }
    }
  }

  function saturationDetect(options, i, o) {
    var id = i.data;
    var od = o.data;
    var w = i.width;
    var h = i.height;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var p = (y * w + x) * 4;

        var lightness = cie(id[p], id[p + 1], id[p + 2]) / 255;
        var sat = saturation(id[p], id[p + 1], id[p + 2]);

        var acceptableSaturation = sat > options.saturationThreshold;
        var acceptableLightness =
          lightness >= options.saturationBrightnessMin &&
          lightness <= options.saturationBrightnessMax;
        if (acceptableLightness && acceptableSaturation) {
          od[p + 2] =
            (sat - options.saturationThreshold) *
            (255 / (1 - options.saturationThreshold));
        } else {
          od[p + 2] = 0;
        }
      }
    }
  }

  function applyBoosts(options, output) {
    if (!options.boost) return;
    var od = output.data;
    for (var i = 0; i < output.width; i += 4) {
      od[i + 3] = 0;
    }
    for (i = 0; i < options.boost.length; i++) {
      applyBoost(options.boost[i], options, output);
    }
  }

  function applyBoost(boost, options, output) {
    var od = output.data;
    var w = output.width;
    var x0 = ~~boost.x;
    var x1 = ~~(boost.x + boost.width);
    var y0 = ~~boost.y;
    var y1 = ~~(boost.y + boost.height);
    var weight = boost.weight * 255;
    for (var y = y0; y < y1; y++) {
      for (var x = x0; x < x1; x++) {
        var i = (y * w + x) * 4;
        od[i + 3] += weight;
      }
    }
  }

  function generateCrops(options, width, height) {
    var results = [];
    var minDimension = min(width, height);
    var cropWidth = options.cropWidth || minDimension;
    var cropHeight = options.cropHeight || minDimension;
    for (
      var scale = options.maxScale;
      scale >= options.minScale;
      scale -= options.scaleStep
    ) {
      for (var y = 0; y + cropHeight * scale <= height; y += options.step) {
        for (var x = 0; x + cropWidth * scale <= width; x += options.step) {
          results.push({
            x: x,
            y: y,
            width: cropWidth * scale,
            height: cropHeight * scale
          });
        }
      }
    }
    return results;
  }

  function score(options, output, crop) {
    var result = {
      detail: 0,
      saturation: 0,
      skin: 0,
      boost: 0,
      total: 0
    };

    var od = output.data;
    var downSample = options.scoreDownSample;
    var invDownSample = 1 / downSample;
    var outputHeightDownSample = output.height * downSample;
    var outputWidthDownSample = output.width * downSample;
    var outputWidth = output.width;

    for (var y = 0; y < outputHeightDownSample; y += downSample) {
      for (var x = 0; x < outputWidthDownSample; x += downSample) {
        var p =
          (~~(y * invDownSample) * outputWidth + ~~(x * invDownSample)) * 4;
        var i = importance(options, crop, x, y);
        var detail = od[p + 1] / 255;

        result.skin += od[p] / 255 * (detail + options.skinBias) * i;
        result.detail += detail * i;
        result.saturation +=
          od[p + 2] / 255 * (detail + options.saturationBias) * i;
        result.boost += od[p + 3] / 255 * i;
      }
    }

    result.total =
      (result.detail * options.detailWeight +
        result.skin * options.skinWeight +
        result.saturation * options.saturationWeight +
        result.boost * options.boostWeight) /
      (crop.width * crop.height);
    return result;
  }

  function importance(options, crop, x, y) {
    if (
      crop.x > x ||
      x >= crop.x + crop.width ||
      crop.y > y ||
      y >= crop.y + crop.height
    ) {
      return options.outsideImportance;
    }
    x = (x - crop.x) / crop.width;
    y = (y - crop.y) / crop.height;
    var px = abs(0.5 - x) * 2;
    var py = abs(0.5 - y) * 2;
    // Distance from edge
    var dx = Math.max(px - 1.0 + options.edgeRadius, 0);
    var dy = Math.max(py - 1.0 + options.edgeRadius, 0);
    var d = (dx * dx + dy * dy) * options.edgeWeight;
    var s = 1.41 - sqrt(px * px + py * py);
    if (options.ruleOfThirds) {
      s += Math.max(0, s + d + 0.5) * 1.2 * (thirds(px) + thirds(py));
    }
    return s + d;
  }
  smartcrop.importance = importance;

  function skinColor(options, r, g, b) {
    var mag = sqrt(r * r + g * g + b * b);
    var rd = r / mag - options.skinColor[0];
    var gd = g / mag - options.skinColor[1];
    var bd = b / mag - options.skinColor[2];
    var d = sqrt(rd * rd + gd * gd + bd * bd);
    return 1 - d;
  }

  function analyse(options, input) {
    var result = {};
    var output = new ImgData(input.width, input.height);

    edgeDetect(input, output);
    skinDetect(options, input, output);
    saturationDetect(options, input, output);
    applyBoosts(options, output);

    var scoreOutput = downSample(output, options.scoreDownSample);

    var topScore = -Infinity;
    var topCrop = null;
    var crops = generateCrops(options, input.width, input.height);

    for (var i = 0, iLen = crops.length; i < iLen; i++) {
      var crop = crops[i];
      crop.score = score(options, scoreOutput, crop);
      if (crop.score.total > topScore) {
        topCrop = crop;
        topScore = crop.score.total;
      }
    }

    result.topCrop = topCrop;

    if (options.debug && topCrop) {
      result.crops = crops;
      result.debugOutput = output;
      result.debugOptions = options;
      // Create a copy which will not be adjusted by the post scaling of smartcrop.crop
      result.debugTopCrop = extend({}, result.topCrop);
    }
    return result;
  }

  function ImgData(width, height, data) {
    this.width = width;
    this.height = height;
    if (data) {
      this.data = new Uint8ClampedArray(data);
    } else {
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  }
  smartcrop.ImgData = ImgData;

  function downSample(input, factor) {
    var idata = input.data;
    var iwidth = input.width;
    var width = Math.floor(input.width / factor);
    var height = Math.floor(input.height / factor);
    var output = new ImgData(width, height);
    var data = output.data;
    var ifactor2 = 1 / (factor * factor);
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var i = (y * width + x) * 4;

        var r = 0;
        var g = 0;
        var b = 0;
        var a = 0;

        var mr = 0;
        var mg = 0;

        for (var v = 0; v < factor; v++) {
          for (var u = 0; u < factor; u++) {
            var j = ((y * factor + v) * iwidth + (x * factor + u)) * 4;
            r += idata[j];
            g += idata[j + 1];
            b += idata[j + 2];
            a += idata[j + 3];
            mr = Math.max(mr, idata[j]);
            mg = Math.max(mg, idata[j + 1]);
            // unused
            // mb = Math.max(mb, idata[j + 2]);
          }
        }
        // this is some funky magic to preserve detail a bit more for
        // skin (r) and detail (g). Saturation (b) does not get this boost.
        data[i] = r * ifactor2 * 0.5 + mr * 0.5;
        data[i + 1] = g * ifactor2 * 0.7 + mg * 0.3;
        data[i + 2] = b * ifactor2;
        data[i + 3] = a * ifactor2;
      }
    }
    return output;
  }
  smartcrop._downSample = downSample;

  function defaultCanvasFactory(w, h) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function canvasImageOperations(canvasFactory) {
    return {
      // Takes imageInput as argument
      // returns an object which has at least
      // {width: n, height: n}
      open: function(image) {
        // Work around images scaled in css by drawing them onto a canvas
        var w = image.naturalWidth || image.width;
        var h = image.naturalHeight || image.height;
        var c = canvasFactory(w, h);
        var ctx = c.getContext('2d');
        if (
          image.naturalWidth &&
          (image.naturalWidth != image.width ||
            image.naturalHeight != image.height)
        ) {
          c.width = image.naturalWidth;
          c.height = image.naturalHeight;
        } else {
          c.width = image.width;
          c.height = image.height;
        }
        ctx.drawImage(image, 0, 0);
        return smartcrop.Promise.resolve(c);
      },
      // Takes an image (as returned by open), and changes it's size by resampling
      resample: function(image, width, height) {
        return Promise.resolve(image).then(function(image) {
          var c = canvasFactory(~~width, ~~height);
          var ctx = c.getContext('2d');

          ctx.drawImage(
            image,
            0,
            0,
            image.width,
            image.height,
            0,
            0,
            c.width,
            c.height
          );
          return smartcrop.Promise.resolve(c);
        });
      },
      getData: function(image) {
        return Promise.resolve(image).then(function(c) {
          var ctx = c.getContext('2d');
          var id = ctx.getImageData(0, 0, c.width, c.height);
          return new ImgData(c.width, c.height, id.data);
        });
      }
    };
  }
  smartcrop._canvasImageOperations = canvasImageOperations;

  // Aliases and helpers
  var min = Math.min;
  var max = Math.max;
  var abs = Math.abs;
  var sqrt = Math.sqrt;

  function extend(o) {
    for (var i = 1, iLen = arguments.length; i < iLen; i++) {
      var arg = arguments[i];
      if (arg) {
        for (var name in arg) {
          o[name] = arg[name];
        }
      }
    }
    return o;
  }

  // Gets value in the range of [0, 1] where 0 is the center of the pictures
  // returns weight of rule of thirds [0, 1]
  function thirds(x) {
    x = (((x - 1 / 3 + 1.0) % 2.0) * 0.5 - 0.5) * 16;
    return Math.max(1.0 - x * x, 0.0);
  }

  function cie(r, g, b) {
    return 0.5126 * b + 0.7152 * g + 0.0722 * r;
  }
  function sample(id, p) {
    return cie(id[p], id[p + 1], id[p + 2]);
  }
  function saturation(r, g, b) {
    var maximum = max(r / 255, g / 255, b / 255);
    var minumum = min(r / 255, g / 255, b / 255);

    if (maximum === minumum) {
      return 0;
    }

    var l = (maximum + minumum) / 2;
    var d = maximum - minumum;

    return l > 0.5 ? d / (2 - maximum - minumum) : d / (maximum + minumum);
  }
  // Common js
  exports.smartcrop = smartcrop;
  // Nodejs
  {
    module.exports = smartcrop;
  }
})();
});
var smartcrop_1 = smartcrop.smartcrop;

class SmartCroppr extends Croppr {

  constructor(element, options) {

      super(element, options, true);

      if(options.debug) this.debug = true;
      
      let originalInit = null;
      if(this.options.onInitialize) {
        originalInit = this.options.onInitialize;
      }
      const init = (instance) => {
        if(originalInit) originalInit(instance);
        if(options.smartcrop) {
          this.parseSmartOptions(options);
          this.setBestCrop(this.smartOptions, true);
        }
      };
      this.options.onInitialize = init;

      element = this.getElement(element);
      if (element.width === 0 || element.height === 0) {
        element.onload = () => { 
          this.initialize(element); 
        };
      } else {
        this.initialize(element);
      }
            
  }

  parseSmartOptions(options) {

    let defaultSmartOptions = {
      minScale: null,
      minWidth: null,
      minHeight: null,
      aspectRatio: null,
      maxAspectRatio: null,
      onSmartCropDone: null,
      minScaleTreshold: 0.5
    };

    this.smartOptions = {};

    for(var key in defaultSmartOptions) {
      let defaultValue = defaultSmartOptions[key];
      if(options.smartOptions && typeof options.smartOptions[key] !== "undefined") {
        defaultValue = options.smartOptions[key];
      } 
      this.smartOptions[key] = defaultValue; 
    }

    let tempMinRatio = options.aspectRatio ? options.aspectRatio : this.smartOptions.aspectRatio ? this.smartOptions.aspectRatio : null;
    let tempMaxRatio = options.maxAspectRatio ? options.maxAspectRatio : this.smartOptions.maxAspectRatio ? this.smartOptions.maxAspectRatio : null;

    let minRatio = tempMinRatio;
    let maxRatio = tempMaxRatio;

    if(tempMaxRatio && tempMaxRatio < tempMinRatio) {
      minRatio = tempMaxRatio;
      maxRatio = tempMinRatio;
    } 

    this.smartOptions.minRatio = minRatio;
    this.smartOptions.maxRatio = maxRatio;

    return this.smartOptions

  }

  
  getSizeFromRatios() {

    let { width, height } = this.sourceSize;
    let { minRatio, maxRatio, minWidth, minHeight, minScale, minScaleTreshold } = this.smartOptions;
    if(this.debug) console.log("debug - Source Size : ", this.sourceSize);
    let imageRatio = width/height;

    if(!minRatio && minWidth && minHeight) {
        minRatio = minWidth / minHeight;
    }
    
    //Find best ratio
    let cropRatio = imageRatio;
    if(maxRatio) {
      if(imageRatio > maxRatio) cropRatio = maxRatio;
      else if(imageRatio < minRatio) cropRatio = minRatio;
    } else {
      cropRatio = minRatio;
    }

    let perfectRatio = false;
    if(imageRatio === cropRatio) perfectRatio = true;

    //Define crop size
    let cropWidth = width;
    let cropHeight = cropWidth/cropRatio;
    if(cropHeight > height) {
      cropWidth = height * cropRatio;
      cropHeight = height;
    }  

    if(!minScale && (minWidth || minHeight) ) {
      if(!minWidth) minWidth = minHeight * cropRatio;
      if(!minHeight) minHeight = minWidth / cropRatio;
      minScale = Math.min(minWidth / width, minHeight / height);
      minScale = minScale > 1 ? 1 : minScale;
    }

    minScale = minScale !== null ? minScale > minScaleTreshold ? minScale : minScaleTreshold : 1.0;

    return {
      width: cropWidth*minScale,
      height: cropHeight*minScale,
      minScale: minScale,
      perfectRatio: perfectRatio
    }

  }

  setBestCrop(smartOptions, crop = true) {

    const size = this.getSizeFromRatios();

    smartOptions.minScale = size.minScale;
    smartOptions.width = size.width;
    smartOptions.height = size.height;
    smartOptions.perfectRatio = size.perfectRatio;

    if(!smartOptions.width || !smartOptions.height) {
      smartOptions.skipSmartCrop = true;
      this.launchSmartCrop(this.imageEl, smartOptions);
    } else {
      
      const scaleImageCallback = (new_img, scale) => {
        if(this.debug) console.log("debug - IMAGE IS SCALED : ", scale);
        this.launchSmartCrop(new_img, smartOptions, scale, crop);
      };
  
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        scaleImageCallback(img, 1);
      };
      img.src = this.imageEl.src; 
    }

  }

  launchSmartCrop(img, smartOptions, scale = 1.0, crop = true) {

    //Scale smartOptions
    smartOptions.width *= scale;
    smartOptions.height *= scale;


    //Set crop callback when smartcrop return data
    const setSmartCrop = data => {
      if(!data) data = null;
      this.smartCropData = null;
      if(data && crop === true) {
        this.setValue(data, true, "real");
      }
    };

    const convertValuesWithScale = data => {
      return {
        x: data.x / scale,
        y: data.y / scale,
        width: data.width / scale,
        height: data.height / scale
      }
    };

    const smartCropFunc = (img, options) => {
      if(this.debug) console.log("debug - OPTIONS : ", options);

      const cropCallback = data => {
        const cloned_data = JSON.parse(JSON.stringify(data));
        setSmartCrop(data);
        if(options.onSmartCropDone) options.onSmartCropDone(cloned_data);
      };

      if(options.skipSmartCrop || (options.minScale === 1 && options.perfectRatio) ) {
        cropCallback(null);
      } else {
        smartcrop.crop(img, options).then( result => {
          if(this.debug) console.log("debug - RAW DATA : ", result.topCrop);
          let smartCropData = convertValuesWithScale(result.topCrop, scale);
          if(this.debug) console.log("debug - CONVERTED DATA : ", smartCropData);
          cropCallback(smartCropData);
        });
      }
    };

    smartCropFunc(img, smartOptions);

  }

  setImage(src, callback = null, smartcrop = true, smartOptions = null) {

    let smartCallback = callback;
    if(smartcrop === true) {
      let options = this.options;
      options.smartOptions = smartOptions;
      this.parseSmartOptions(options);
      smartCallback = () => {
        this.setBestCrop(this.smartOptions, true);
        if(callback) callback();
      };
    }

    super.setImage(src, smartCallback);
    return this
  }

}

var _ = {
  isEqual: isEqual
};

var SmartCroppr$1 =
/*#__PURE__*/
function (_React$Component) {
  _inherits(SmartCroppr$1, _React$Component);

  function SmartCroppr$1(props) {
    var _this;

    _classCallCheck(this, SmartCroppr$1);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SmartCroppr$1).call(this, props));
    _this.handleLoad = _this.handleLoad.bind(_assertThisInitialized(_this));
    return _this;
  }

  _createClass(SmartCroppr$1, [{
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.croppr) this.croppr.destroy();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      var _this2 = this;

      var crop = this.props.crop ? JSON.parse(JSON.stringify(this.props.crop)) : null; // JSON.parse(JSON.stringify()) to avoid method to modify ours props!

      if (prevProps.src !== this.props.src) {
        if (this.props.smartCrop) this.croppr.setImage(this.props.src, null, true, this.props.smartCropOptions);else this.croppr.setImage(this.props.src, function () {
          return _this2.croppr.setValue(crop || {
            x: 0,
            y: 0,
            width: 1,
            height: 1
          }, true, crop ? _this2.props.mode : 'ratio');
        }, false);
      } else if (!_.isEqual(prevProps.crop, this.props.crop) || prevProps.mode !== this.props.mode) {
        var updateIsNeeded = true;

        if (crop) {
          var activeCrop = this.croppr.getValue(this.props.mode);
          if (isEqual(activeCrop, crop)) updateIsNeeded = false;
        }

        if (updateIsNeeded) {
          this.croppr.setValue(crop || {
            x: 0,
            y: 0,
            width: 1,
            height: 1
          }, true, crop ? this.props.mode : 'ratio');
        }
      }

      if (!_.isEqual(prevProps.style, this.props.style)) this.croppr.forceRedraw();
    }
  }, {
    key: "handleLoad",
    value: function handleLoad(ev) {
      if (typeof this.firstLoadDone === 'undefined') {
        this.firstLoadDone = true;
        var _this$props = this.props,
            smartCrop = _this$props.smartCrop,
            crop = _this$props.crop,
            mode = _this$props.mode,
            smartCropOptions = _this$props.smartCropOptions,
            onCropEnd = _this$props.onCropEnd,
            onCropStart = _this$props.onCropStart,
            onCropMove = _this$props.onCropMove,
            onInit = _this$props.onInit;
        var _this$props2 = this.props,
            aspectRatio = _this$props2.aspectRatio,
            maxAspectRatio = _this$props2.maxAspectRatio;

        if (!aspectRatio && !maxAspectRatio) {
          aspectRatio = -Infinity;
          maxAspectRatio = Infinity;
        }

        var startPosition = [0, 0, 'real'];
        var startSize = [1, 1, 'ratio'];

        if (crop) {
          var x = crop.x,
              y = crop.y,
              width = crop.width,
              height = crop.height;
          startPosition = [x, y, crop.mode || mode];
          startSize = [width, height, crop.mode || mode];
        }

        this.croppr = new SmartCroppr(this.img, {
          returnMode: mode,
          responsive: true,
          aspectRatio: aspectRatio,
          maxAspectRatio: maxAspectRatio,
          smartcrop: crop ? false : smartCrop,
          smartOptions: smartCropOptions,
          startPosition: startPosition,
          startSize: startSize,
          onCropEnd: onCropEnd,
          onCropStart: onCropStart,
          onCropMove: onCropMove,
          onInitialize: onInit
        });
      }

      this.props.onImageLoad();
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;

      return React.createElement("div", {
        className: "cropper",
        style: this.props.style || null
      }, React.createElement("img", {
        alt: "",
        ref: function ref(obj) {
          return _this3.img = obj;
        },
        crossOrigin: "anonymous",
        onLoad: this.handleLoad,
        src: this.props.src
      }));
    }
  }]);

  return SmartCroppr$1;
}(React.Component);
SmartCroppr$1.propTypes = {
  // required
  src: PropTypes.string.isRequired,
  // optional
  aspectRatio: PropTypes.number,
  crop: PropTypes.object,
  maxAspectRatio: PropTypes.number,
  mode: PropTypes.oneOf(['ratio', 'raw', 'real']),
  onCropEnd: PropTypes.func,
  onCropMove: PropTypes.func,
  onCropStart: PropTypes.func,
  onImageLoad: PropTypes.func,
  onInit: PropTypes.func,
  smartCrop: PropTypes.bool,
  smartCropOptions: PropTypes.object,
  style: PropTypes.object
};
SmartCroppr$1.defaultProps = {
  aspectRatio: null,
  maxAspectRatio: null,
  crop: null,
  mode: 'real',
  onCropEnd: function onCropEnd(data) {
    return null;
  },
  onCropMove: function onCropMove(data) {
    return null;
  },
  onCropStart: function onCropStart(data) {
    return null;
  },
  onImageLoad: function onImageLoad() {
    return null;
  },
  onInit: function onInit(instance) {
    return null;
  },
  smartCrop: true,
  smartCropOptions: null
};

export default SmartCroppr$1;
