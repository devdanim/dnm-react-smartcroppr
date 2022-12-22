### Easy-to-use JS cropper based on dnm-croppr (fork of Croppr.js) with smartcrop features of smartcrop.js.

dnm-smartcroppr is compatible with all options and methods of dnm-croppr.

**[dnm-croppr docs →](https://github.com/devdanim/dnm-croppr)**


## Installation

**Via NPM:**

```bash
npm install dnm-smartcroppr -—save
```

```javascript
// ES6 import - JS + CSS
import SmartCroppr from 'dnm-smartcroppr';
```


**Via script tag:**

```html
<link href="path/to/dnm-smartcroppr.min.css" rel="stylesheet"/>
<script src="path/to/dnm-smartcroppr.min.js"></script>
```


## Basic Usage

**In your HTML document:**

```html
<img src="path/to/image.jpg" id="croppr"/>
```

**In your JavaScript file:**

```javascript
var cropInstance = new SmartCroppr('#croppr', {
  // ...options
  returnMode: "real",
  responsive: true,
  aspectRatio: 1,
  preview: "#cropPreview",
  smartcrop: true,
  smartOptions: {
      minWidth: 500,
      //minHeight will automatically be set to 500 because aspectRatio is 1
      minHeight: 500,
      onSmartCropDone: data => { 
          console.log(data)
      }
  },
  onInitialize: (instance, mediaNode) => { console.log(instance, mediaNode) },
  onCropEnd: data => { console.log(data) },
  onCropStart: (data) => { console.log(data) },
  onCropMove: data => { console.log(data) }
});
```



## Options

All options in **[dnm-croppr docs #Options →](https://github.com/devdanim/dnm-croppr#Options)** are compatible with dnm-smartcroppr. 

dnm-smartcroppr is optimized to work with ratios. Set **aspectRatio**, and optionally **maxAspectRatio** to find the best crop region for smartcrop.js.


There is only these additional options for now :

#### **smartcrop**

If `false`, smartcrop is deactivated. Default value is `true`.

#### **smartOptions**

`Array` custom options for smartcrop. Default value is `null`. In this case, dnm-smartcroppr is able to define these different options with basic options of dnm-croppr.

This is the different entries of smartOptions (all optionnal) :


##### **minWidth**

Minimum width for smartcrop. Crop width will not be inferior to this value. Default is `null`.

##### **minHeight**

Minimum height for smartcrop. Crop height will not be inferior to this value. Default is `null`.

##### **minScale**

Minimum scale for smartcrop. Default is `null`.

_Note: If **minScale** is defined, **minWidth** and **minHeight** are ignored. If **minScale** is `null`, **minWidth** and / or **minHeight** will define **minScale** relatively to source image dimensions._

_If **minWidth** is defined but **minHeight** is `null`, **minHeight** will be calculated with **aspectRatio**._

##### **minScaleTreshold**

When minScale is calculated with **minWidth** and **minHeight**, it can be very small. To avoid to crop big images too much, you can use **minScaleTreshold**, and **minScale** will be >= to **minScaleTreshold**. Default is `0.5`.


##### **aspectRatio** and **maxAspectRatio** 

If you don't want to constrain **aspectRatio** and / or **maxAspectRatio** of dnp-croppr, you can add ratios in **smartOptions**, to automatically width and height of the smart crop. Default are `null`.

##### **onSmartCropDone**

A callback function that is called when smartcrop is done. Default value is `null`.

```javascript
onSmartCropDone: function(data) {
  console.log(data.x, data.y, data.width, data.height);
}
```




## Methods

All methods in **[dnm-croppr docs #Methods →](https://github.com/devdanim/dnm-croppr#Methods)** are compatible with dnm-smartcroppr. 

#### setBestCrop(smartOptions: Array, _crop?: boolean_)

Modify smartcrop. `smartOptions` has the same structure as in the Options doc. If `crop` is false, setBestCrop() will only calculate the best crop without cropping the image.


```javascript
var smartOptions = {
  aspectRatio: 1,
  maxAspectRatio: 2,
  minScale: 0.5,
  onSmartCropDone: data => {
    console.log(data.x, data.y, data.width, data.height);
  }
};

cropInstance.setBestCrop(smartOptions, true);
```

_Note: You can access the smart cropping informations with **cropperInstance.smartCropData**._


#### setImage(src: string, _callback?: function_, _smartcrop?: boolean_, _smartOptions?: Array_)

Changes the image src. Returns the Croppr instance and media node. If `smartcrop` is set to **false**, crop region will not be recalculated. Default value is **true**.

#### setVideo(src: string, _callback?: function_, _smartcrop?: boolean_, _smartOptions?: Array_)

Changes the video src. Returns the Croppr instance and media node. If `smartcrop` is set to **false**, crop region will not be recalculated. Default value is **true**.

#### setMedia(src: string, _callback?: function_, _smartcrop?: boolean_, _smartOptions?: Array_, _mediaType?: string_)

Changes the image or video src (depending on mediaType value). Returns the Croppr instance and media node. If `smartcrop` is set to **false**, crop region will not be recalculated. Default value is **true**.



- - -

Thanks to original author of Croppr.js (James Ooi) and smartcrop.js (Jonas Wagner).
Released under the MIT License.
