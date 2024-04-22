import Croppr from '../../dnm-croppr/src/index'
import smartcrop from 'smartcrop'

class SmartCroppr extends Croppr {

  constructor(element, options) {
      super(element, options, true)

      element = this.getElement(element)
      
      let originalInit = null
      if(this.options.onInitialize) {
        originalInit = this.options.onInitialize
      }

      const init = (instance, mediaNode) => {
        if(originalInit) originalInit(instance, mediaNode)
        if(options.smartcrop) {
          this.parseSmartOptions(options)
          this.setBestCrop(this.smartOptions, true)
        }
      }
      this.options.onInitialize = init

      this.initialize(element);
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
    }

    this.smartOptions = {}

    for(var key in defaultSmartOptions) {
      let defaultValue = defaultSmartOptions[key]
      if(options.smartOptions && typeof options.smartOptions[key] !== "undefined") {
        defaultValue = options.smartOptions[key]
      } 
      this.smartOptions[key] = defaultValue 
    }

    let tempMinRatio = options.aspectRatio ? options.aspectRatio : this.smartOptions.aspectRatio ? this.smartOptions.aspectRatio : null
    let tempMaxRatio = options.maxAspectRatio ? options.maxAspectRatio : this.smartOptions.maxAspectRatio ? this.smartOptions.maxAspectRatio : null

    let minRatio = tempMinRatio
    let maxRatio = tempMaxRatio

    if(tempMaxRatio && tempMaxRatio < tempMinRatio) {
      minRatio = tempMaxRatio
      maxRatio = tempMinRatio
    } 

    this.smartOptions.minRatio = minRatio
    this.smartOptions.maxRatio = maxRatio

    return this.smartOptions

  }

  
  getSizeFromRatios() {

    let { width, height } = this.getSourceSize();
    let { minRatio, maxRatio, minWidth, minHeight, minScale, minScaleTreshold } = this.smartOptions
    if(this.debug) console.log("debug - Source Size : ", this.getSourceSize())
    let imageRatio = width / height

    if(!minRatio && minWidth && minHeight) {
        minRatio = minWidth / minHeight
    }
    
    //Find best ratio
    let cropRatio = imageRatio
    if(maxRatio) {
      if(imageRatio > maxRatio) cropRatio = maxRatio
      else if(imageRatio < minRatio) cropRatio = minRatio
    } else {
      cropRatio = minRatio
    }

    let perfectRatio = false
    if(imageRatio === cropRatio) perfectRatio = true

    //Define crop size
    let cropWidth = width
    let cropHeight = cropWidth / cropRatio
    if(cropHeight > height) {
      cropWidth = height * cropRatio
      cropHeight = height
    }  

    if(!minScale && (minWidth || minHeight) ) {
      if(!minWidth) minWidth = minHeight * cropRatio
      if(!minHeight) minHeight = minWidth / cropRatio
      minScale = Math.min(minWidth / width, minHeight / height)
      minScale = minScale > 1 ? 1 : minScale
    }

    minScale = minScale !== null ? minScale > minScaleTreshold ? minScale : minScaleTreshold : 1.0

    return {
      width: cropWidth*minScale,
      height: cropHeight*minScale,
      minScale: minScale,
      perfectRatio: perfectRatio
    }

  }

  setBestCrop(smartOptions, crop = true) {

    const size = this.getSizeFromRatios();

    smartOptions.minScale = size.minScale
    smartOptions.width = size.width
    smartOptions.height = size.height
    smartOptions.perfectRatio = size.perfectRatio

    if(!smartOptions.width || !smartOptions.height) {
      smartOptions.skipSmartCrop = true;
      this.launchSmartCrop(this.mediaEl, smartOptions)
    } else {
      
      const scaleImageCallback = (newMedia, scale) => {
        if(this.debug) console.log("debug - IMAGE IS SCALED : ", scale)
        this.launchSmartCrop(newMedia, smartOptions, scale, crop)
      }

      const captureImageFromVideo = (video, callback) => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = Math.round(video.duration / 2);
        video.addEventListener('seeked', () => {
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);  
          canvas.toBlob((blob) => {
            const img = new Image();
            img.onload = () => callback(img);
            img.src = URL.createObjectURL(blob);
          });
        }, { once: true });
      }

      const media = document.createElement(this.mediaType === 'video' ? 'video' : 'img');
      media.setAttribute('crossOrigin', 'anonymous');
      media.setAttribute('preload', 'metadata');
      media[this.mediaType === 'video' ? 'onloadedmetadata' : 'onload'] = () => {
        if (this.mediaType === 'video') {
          captureImageFromVideo(media, (img) => scaleImageCallback(img, 1));
        } else scaleImageCallback(media, 1);
      }
      if (this.mediaType === 'video') {
        media.setAttribute('muted', true);
        media.setAttribute('playsinline', '');
      }

      media.setAttribute('src', this.mediaEl.src);
    }

  }

  launchSmartCrop(img, smartOptions, scale = 1.0, crop = true) {
    //Scale smartOptions
    smartOptions.width *= scale
    smartOptions.height *= scale

    //Set crop callback when smartcrop return data
    const setSmartCrop = data => {
      if(!data) data = null
      this.smartCropData = null
      if(data && crop === true) {
        this.setValue(data, true, "real")
      }
    }

    const convertValuesWithScale = data => {
      return {
        x: data.x / scale,
        y: data.y / scale,
        width: data.width / scale,
        height: data.height / scale
      }
    }

    const smartCropFunc = (img, options) => {
      if(this.debug) console.log("debug - OPTIONS : ", options)

      const cropCallback = data => {
        const cloned_data = JSON.parse(JSON.stringify(data));
        setSmartCrop(data)
        if(options.onSmartCropDone) options.onSmartCropDone(cloned_data)
      }

      if(options.skipSmartCrop || (options.minScale === 1 && options.perfectRatio) ) {
        cropCallback(null)
      } else {
        smartcrop.crop(img, options).then(result => {
          if(this.debug) console.log("debug - RAW DATA : ", result)
          let smartCropData = convertValuesWithScale(result.topCrop, scale)
          if(this.debug) console.log("debug - CONVERTED DATA : ", smartCropData)
          cropCallback(smartCropData)
        }).catch(e => {
          if (this.debug) console.error(e);
        });
      }
    }

    smartCropFunc(img, smartOptions);
  }

  setMedia(src, callback = null, smartcrop = true, smartOptions = null, mediaType = 'image') {
    let smartCallback = callback
    if(smartcrop === true) {
      let options = this.options
      options.smartOptions = smartOptions
      this.parseSmartOptions(options)
      smartCallback = (instance, mediaNode) => {
        this.setBestCrop(this.smartOptions, true);
        if(callback) callback(instance, mediaNode)
      }
    }

    super[mediaType === 'image' ? 'setImage' : 'setVideo'](src, smartCallback)
    return this
  }

  setImage(src, callback = null, smartcrop = true, smartOptions = null) {
    return this.setMedia(src, callback, smartcrop, smartOptions, 'image');
  }

  setVideo(src, callback = null, smartcrop = true, smartOptions = null) {
    return this.setMedia(src, callback, smartcrop, smartOptions, 'video');
  }

}

export default SmartCroppr