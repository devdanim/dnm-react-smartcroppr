/**
 * Box component
 */
export default class Box {
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
    const maxIfLeft = originX
    const maxIfTop = originY
    const maxIfRight = boundaryWidth - originX
    const maxIfBottom = boundaryHeight - originY

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
