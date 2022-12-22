![Croppr.js](https://raw.githubusercontent.com/devdanim/dnm-croppr/master/assets/logo.png)

### Fork from Cropper.js, a vanilla JavaScript image cropper that's lightweight, awesome, and has absolutely zero dependencies.

**[Original Project →](https://jamesssooi.github.io/Croppr.js)**

## Fork features

* Live preview 
* Responsive
* Works seamlessly with modal, just add your modal in the options
* Min and Max aspect ratio
* Set startPosition
* Set crop data with real image px values (for options : startSize, startPosition, minSize, maxSize + methods : moveTo(), resizeTo(), setValue())
* Support scaling with mousewheel 
* Video support


## Installation

**Via NPM:**

```bash
npm install dnm-croppr -—save
```

```javascript
// ES6 import - JS + CSS
import Croppr from 'dnm-croppr';
```


**Via script tag:**

```html
<link href="path/to/dnm-croppr.min.css" rel="stylesheet"/>
<script src="path/to/dnm-croppr.min.js"></script>
```


## Basic Usage

**In your HTML document:**

```html
<img src="path/to/image.jpg" id="croppr"/>
```

**In your JavaScript file:**

```javascript
var cropInstance = new Croppr('#croppr', {
  // ...options
});
```

_Protip: You can also pass an `Element` object directly instead of a selector._

**To retrieve crop region:**

```javascript
var data = cropInstance.getValue();
// data = {x: 20, y: 20: width: 120, height: 120}
```



## Options

#### **aspectRatio**

Constrain the crop region to an aspect ratio.

* Type: `Number`
* Default: `null`
* Example: `aspectRatio: 1` (Square)

#### **autoPlayVideo**

Autoplay the video after initialization.

* Type: `Boolean`
* Default: `false`


#### **maxAspectRatio**

If maxAspectRatio and aspectRatio aren't null, the crop region is constrained between these two aspect ratios.

* Type: `Number`
* Default: `null`
* Example: `aspectRatio: 1` (Square)



#### **maxSize**

Constrain the crop region to a maximum size.

* Type: `[width, height, unit?]`
* Default: `null`
* Example: `maxSize: [0.5, 0.5, 'ratio']` (A maximum size of 50% of the image size)



#### **minSize**

Constrain the crop region to a minimum size.

- Type: `[width, height, unit?]`
- Default: `null`
- Example: `minSize: [20, 20, 'real']` (A minimum width and height of 20px, relative to source image size)


#### **modal**

If you use dnm-croppr inside a modal, you have to define your modal parent element here.

* Type: `String` or `Element`
* Default: `null`
* Possible values: If modal ID is "myModal", value can be `"#myModal"` or an `Element` object as `document.getElementById("myModal")`

#### **muteVideo**

Mute the video after initialization.

* Type: `Boolean`
* Default: `false`


#### **preview**

Define the container for live preview.

* Type: `String` or `Element`
* Default: `null`
* Possible values: If container ID is "preview", value can be `"#preview"` or an `Element` object as `document.getElementById("preview")`


#### **startSize**

The starting size of the crop region when it is initialized.

- Type: `[width, height, unit?]`
- Default: `[1, 1, 'ratio']` (A starting crop region as large as possible)
- Example: `startSize: [0.5, 0.5]` (A starting crop region of 50% of the image size)


#### **startPosition**

The starting position of the crop region when it is initialized.

- Type: `[width, height, unit?]`
- Default: `null` (Crop region is centered)
- Example: `startSize: [250, 100, "real"]` (A starting crop region positioned at 250 px from left, and 100 px from top, relative to source image size)


_Note: `unit` accepts a value of **'raw'**, **'ratio'** or **'real'**. Defaults to **'raw'**._


#### **onCropStart**

A callback function that is called when the user starts modifying the crop region.

* Type: `Function`
* Arguments: `data = {x, y, width, height}`
* Example:
```javascript
onCropStart: function(data) {
  console.log(data.x, data.y, data.width, data.height);
}
```

#### **onCropMove**

A callback function that is called when the user is changing the crop region.

* Type: `Function`
* Arguments: `data = {x, y, width, height}`
* Example:
```javascript
onCropMove: function(data) {
  console.log(data.x, data.y, data.width, data.height);
}
```

#### **onCropEnd**

A callback function that is called when the modification of the crop region is finished (by the user, or programmatically). **onCropEnd** is called with methods **setImage()**, **moveTo()**, **resizeTo()**, **setValue()**, **scaleBy()**, **reset()**.

* Type: `Function`
* Arguments: `data = {x, y, width, height}`
* Example:
```javascript
onCropEnd: function(data) {
  console.log(data.x, data.y, data.width, data.height);
}
```

#### onInitialize

A callback function that is called when the Croppr instance is fully initialized.

* Type: `Function`
* Arguments: The Croppr instance and the media node (<img> or <video>)
* Example:
```javascript
onInitialize: function(instance, mediaNode) {
  // do things here
}
```


#### **returnMode**

Define how the crop region should be calculated.

* Type: `String`
* Default: `"real"`
* Possible values: `"real"`, `"ratio"` or `"raw"`
  * `real` returns the crop region values based on the size of the image's actual sizes. This ensures that the crop region values are the same regardless if the Croppr element is scaled or not.
  * `ratio` returns the crop region values as a ratio between 0 to 1. e.g. For example, an `x, y` position at the center will be `{x: 0.5, y: 0.5}`.
  * `raw` returns the crop region values as is based on the size of the Croppr element.



## Methods

#### getValue(_returnMode?: string_)

Returns the value of the crop region. `returnMode` inherits from options by default. Refer to [returnMode](#returnmode) for possible values.

```javascript
var value = cropInstance.getValue();
// value = {x: 21, y: 63: width: 120, height: 120}

var ratio = cropInstance.getValue('ratio');
// value = {x: 0.1, y: 0.3: width: 0.57, height: 0.57}
```

#### destroy()

Destroys the Croppr instance and restores the original `img` element.

#### setImage(src: string, _callback?: function_)

Changes the image src. Returns the Croppr instance and media node.

#### setVideo(src: string, _callback?: function_)

Changes the video src. Returns the Croppr instance and media node.

#### moveTo(x: number, y: number, _constrain?: boolean_, _mode?: string_)

Moves the crop region to the specified coordinates. Returns the Croppr instance.

_Note: If `constrain` is **false**, crop region isn't limited by options. Default value is **true**._

_`mode` can be **'raw'**, **'ratio'**, **'real'**. Default value is **'raw'**._

#### resizeTo(width: number, height: number, _origin?: Array_, _constrain?: boolean_, _mode?: string_)

Resizes the crop region to the specified size. `origin` is an optional argument that specifies the origin point (in ratio) to resize from in the format of `[x, y]`. Defaults to `[0.5, 0.5]` (center). Returns the Croppr instance.

_Note: `origin` default value is **[.5, .5]**._

_If `constrain` is **false**, crop region isn't limited by options. Default value is **true**._

_`mode` can be **'raw'**, **'ratio'**, **'real'**. Default value is **'raw'**._

#### setValue(data: Array, _constrain?: boolean_, _mode?: string_)

Move and resize the crop region. Returns the Croppr instance.

```javascript
//Example use of setValue() : The crop region will be moved and resized relatively to the source image size
var cropData = {
  x: 150,
  y: 50,
  width: 350,
  height: 200
};
cropInstance.setValue(cropData, true, "real");
```

_Note: If `constrain` is **false**, crop region isn't limited by options. Default value is **true**._

_`mode` can be **'raw'**, **'ratio'**, **'real'**. Default value is **'raw'**._


#### scaleBy(factor: number, _origin?: Array_)

Scales the crop region by a factor. `origin` is an optional argument that specifies the origin point (in ratio) to resize from in the format of `[x, y]`. Defaults to `[0.5, 0.5]` (center). Returns the Croppr instance.

#### reset()

Resets the crop region to its original position and size. Returns the Croppr instance.

- - -

Thanks to original author James Ooi.
Released under the MIT License.
