/**
 * CropprCore
 * Here lies the main logic.
 */

import Handle from './handle';
import Box from './box';
import enableTouch from './touch';
import FastAverageColor from 'fast-average-color';

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
]

/**
 * Core class for Croppr containing most of its functional logic.
 */
export default class CropprCore {
  constructor(element, options, deferred = false) {    
    this.debug = options.debug || false;

    this.onRegionMoveStart = this._onRegionMoveStart.bind(this);
    this.onRegionMoveMoving = this._onRegionMoveMoving.bind(this);
    this.onRegionMoveEnd = this._onRegionMoveEnd.bind(this);
    this.onHandleMoveStart = this._onHandleMoveStart.bind(this);
    this.onHandleMoveMoving = this._onHandleMoveMoving.bind(this);
    this.onHandleMoveEnd = this._onHandleMoveEnd.bind(this);
    this.onOverlayMouseDown = this._onOverlayMouseDown.bind(this);
    this.onOverlayMouseMove = this._onOverlayMouseMove.bind(this);
    this.onOverlayMouseUp = this._onOverlayMouseUp.bind(this);
    this.onEventBusMouseDown = this._onEventBusMouseDown.bind(this);
    this.onEventBusMouseMove = this._onEventBusMouseMove.bind(this);
    this.onEventBusMouseUp = this._onEventBusMouseUp.bind(this);
    this.onVideoSeeking = this._onVideoSeeking.bind(this);
    this.onVideoPlayOrPause = this._onVideoPlayOrPause.bind(this);
    this.onVideoAutoPlay = this._onVideoAutoPlay.bind(this);
    this.onVideoResync = this._onVideoResync.bind(this);

    //Save options before parsing
    this.initOptions = options;

    // Parse options
    this.options = this.parseOptions(options);

    // Get target img element
    element = this.getElement(element)
    if (!element.getAttribute('src')) {
      throw 'Image src not provided.'
    }

    // Define internal props
    this.lastDestroyedDate = 0;
    this._videoSyncOnRequestAnimationFrame = false;
    this._initialized = false;
    this._restore = {
      parent: element.parentNode,
      element: element
    }

    if(this.options.preview) {
      this._restore.preview = this.options.preview;
      this._restore.parentPreview = this.options.preview.parentNode;
    }
    
    if (!deferred) this.initialize(element);
  }

  /**
   * Initialize the Croppr instance
   */
  initialize(element) {
    // Create DOM elements
    this.createDOM(element, () => {
      // Listen for events from children
      this.attachHandlerEvents();
      this.attachRegionEvents();
      this.attachOverlayEvents();
  
      // Bootstrap this cropper instance
      this.showModal("init")
      this.initializeBox(null, false)
  
      // Need a first redraw() to init cropprEl, imageEl dimensions
      this.strictlyConstrain()
      this.redraw()
      this.resetModal("init")
  
      // Set the initalized flag to true and call the callback
      this._initialized = true;
      if (this.options.onInitialize !== null) {
        this.options.onInitialize(this, this.mediaEl);
      }

      this.cropperEl.onwheel = event => {
        event.preventDefault();
  
        let { deltaY } = event;
        const maxDelta = 0.05;
        let coeff = deltaY > 0 ? 1 : -1;
        deltaY = Math.abs(deltaY) / 100;
        deltaY = deltaY > maxDelta ? maxDelta : deltaY
        deltaY = 1 + coeff*deltaY;
        this.scaleBy(deltaY);
  
        // Trigger callback
        if(this.options.onCropMove !== null) {
          this.options.onCropMove(this.getValue());
        } 
        if(this.options.onCropStart !== null) {
          this.options.onCropStart(this.getValue());
        }
  
      }
  
      if(this.options.responsive) {
        let onResize;
        window.onresize = () => {
            clearTimeout(onResize);
            onResize = setTimeout(() => {
                this.forceRedraw();
            }, 100);
        };
      }
    });
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

  // Return created media node 
  getMedia() {
    return this.mediaEl;
  }

  /**
   * Create Croppr's DOM elements
   */
  createDOM(targetEl, onInit) {
    // Create main container and use it as the main event listeners
    this.containerEl = document.createElement('div');
    this.containerEl.className = 'croppr-container';
    this.eventBus = this.containerEl;
    enableTouch(this.containerEl);

    // Create cropper element
    this.cropperEl = document.createElement('div');
    this.cropperEl.className = 'croppr';

    // Create image element
    this.mediaType = targetEl.nodeName.toLowerCase() === 'video' ? 'video' : 'image';
    this.mediaEl = document.createElement(this.mediaType === 'video' ? 'video' : 'img');
    if (this.mediaType === 'video') ['loop', ...(this.options.muteVideo ? ['muted'] : [])].forEach(attr => this.mediaEl.setAttribute(attr, true));
    else this.mediaEl.setAttribute('alt', targetEl.getAttribute('alt'));
    this.mediaEl.setAttribute('crossOrigin', 'anonymous');
    
    // Detect if video is not supported by web browser
    if (this.mediaType === 'video') {
      this.mediaEl.onerror = (event) => {
        const { error } = event.target;
        if (error && error.code === 4) {
            if (this.options.onNotSupportedVideoLoad) this.options.onNotSupportedVideoLoad(error.message);
        }
      }
      this.mediaEl.onloadedmetadata = (event) => {
        const { videoHeight } = event.target;
        if (videoHeight === 0) {
          if (this.options.onNotSupportedVideoLoad) this.options.onNotSupportedVideoLoad('Video format is not supported');
        }
      }
    }

    // Add onload listener to reinitialize box
    this.lastMediaReload = new Date().getTime();
    this.mediaEl[this.mediaType === 'image' ? 'onload' : 'onloadeddata'] = () => {
      if (this.lastMediaReload >= this.lastDestroyedDate) {
        this.showModal("setImage")
        this.initializeBox(null, false);
        // Temporary FIX, see initialize()
        this.strictlyConstrain();
        this.redraw();
        this.resetModal("setImage")
        if (this.options.onCropEnd !== null) {
          this.options.onCropEnd(this.getValue());
        }
        if (this.mediaType === 'image') {
          const fac = new FastAverageColor();
          const color = fac.getColor(this.mediaEl);
          if (color) {
            this.isDark = color.isDark;
            if(this.isDark) this.cropperEl.className = "croppr croppr-dark";
            else this.cropperEl.className = "croppr croppr-light";
          }
          if (this.onMediaLoad) this.onMediaLoad(this, this.mediaEl);
        } else this.syncVideos();
      }
      if (onInit) onInit();
    }
    this.mediaEl.setAttribute('src', targetEl.getAttribute('src'));

    this.mediaEl.className = 'croppr-image';

    // Create clipped image element
    this.mediaClippedEl = this.mediaEl.cloneNode();
    this.mediaClippedEl.className = 'croppr-imageClipped';

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
    this.cropperEl.appendChild(this.mediaEl);
    this.cropperEl.appendChild(this.mediaClippedEl);
    this.cropperEl.appendChild(this.regionEl);
    this.cropperEl.appendChild(this.overlayEl);
    this.cropperEl.appendChild(handleContainerEl);
    this.containerEl.appendChild(this.cropperEl);

    // And then finally insert it into the document
    targetEl.parentElement.replaceChild(this.containerEl, targetEl);

    //Create Live Preview
    this.setLivePreview();

  }

  _onVideoSeeking(e) {
    this.videosToSync.forEach(videoToSync => {
      videoToSync.currentTime = this.videoRef.currentTime;
    });
  }

  _onVideoPlayOrPause(e) {
    this.videosToSync.forEach(videoToSync => {
      videoToSync[e.type]();
    });
  }

  _onVideoAutoPlay() {
    if (this.debug) console.log('Try to autoplay', this.debug);
    if (this.videoRef && this.videoRef.paused) this.videoRef.play();
    if (this.videoRef && !this.videoRef.paused) clearInterval(this.autoPlayInterval);
  }

  _onVideoResync() {
    if (this.debug) console.log('Resync with method ' + this.options.resyncMethod, this.debug);
    if (this.videoRef && this.videosToSync.length > 0) {
      this.videosToSync.forEach(videoToSync => {
        if (videoToSync.readyState === 4) {
          // Do not resync if videos are already in sync
          if (Math.abs(this.videoRef.currentTime - videoToSync.currentTime) > 0.1){
            videoToSync.currentTime = this.videoRef.currentTime;
          }
        }
      });
    }
  }

  attachVideosToSyncHandlers() {
    this.videoRef.addEventListener('play', this.onVideoPlayOrPause);
    this.videoRef.addEventListener('pause', this.onVideoPlayOrPause);
    this.videoRef.addEventListener('seeking', this.onVideoSeeking);
    if (this.options.autoPlayVideo) {
      this.onVideoAutoPlay();
      this.autoPlayInterval = setInterval(this.onVideoAutoPlay, 500);
    }
    if (this.options.resyncMethod !== 'none') {
      if (this.options.resyncMethod === 'interval') this.resyncInterval = setInterval(this.onVideoResync, this.options.resyncInterval);
      else if (this.options.resyncMethod === 'requestAnimationFrame' && !this._videoSyncOnRequestAnimationFrame) {
        this._videoSyncOnRequestAnimationFrame = true;
        this.resyncVideosOnRequestAnimationFrame();
      }
    }
  }

  detachVideosToSyncHandlers() {
    this._videoSyncOnRequestAnimationFrame = false;
    if (this.videoRef) {
      this.videoRef.removeEventListener('play', this.onVideoPlayOrPause);
      this.videoRef.removeEventListener('pause', this.onVideoPlayOrPause);
      this.videoRef.removeEventListener('seeking', this.onVideoSeeking);
    }
    clearInterval(this.resyncInterval);
    clearInterval(this.autoPlayInterval);
    this.videosToSync = [];
    this.videoRef = null;
  }

  // Sync videos if needed, inspired by https://bocoup.com/blog/html5-video-synchronizing-playback-of-two-videos
  syncVideos() {
    const videos = [this.mediaEl, this.mediaClippedEl];
    this.videoRef = videos[0];
    this.videosToSync = videos.filter(videoToSync => videoToSync !== this.videoRef);

    const checkIfAllVideosAreReady = () => {
      return videos.filter(video => video.readyState === 4).length === videos.length;
    }
    const attachHandlerEvents = () => {
      if (this.lastMediaReload >= this.lastDestroyedDate) {
        this.attachVideosToSyncHandlers();
        this.videosToSync.forEach(videoToSync => videoToSync.muted = true);
        if (this.options.muteVideo) this.videoRef.muted = true;
        if (this.onMediaLoad) this.onMediaLoad(this, this.mediaEl);
      }
    }
    
    if (checkIfAllVideosAreReady()) attachHandlerEvents();
    else {
      let handlersHaveBeenAttached = false;
      videos.forEach((video, v) => {
        video.addEventListener('canplaythrough', () => {
          if (!handlersHaveBeenAttached && checkIfAllVideosAreReady()) {
            handlersHaveBeenAttached = true;
            attachHandlerEvents();
          }
        }, { once: true });
      });
    }
  }

  resyncVideosOnRequestAnimationFrame() {
    this.onVideoResync();
    if (this._videoSyncOnRequestAnimationFrame === true) requestAnimationFrame(this.resyncVideosOnRequestAnimationFrame.bind(this));
  }

  //If preview isn't null, create preview DOM
  setLivePreview() {

    if(this.options.preview) {

      this.preview = {};
      this.preview.parent = this.options.preview;
      this.preview.parent.style.position = "relative";

      const newContainer = document.createElement("div");
      this.preview.container = this.preview.parent.appendChild(newContainer);
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

      const cropWidth = this.getSourceSize().width * cropData.width;
      const cropHeight = this.getSourceSize().height * cropData.height;

      const cropRatio = cropWidth / cropHeight;
      let containerWidth = targetWidth;
      let containerHeight = targetHeight;
      if (targetRatio > cropRatio) {
          containerWidth = containerHeight * cropRatio;
      } else {
          containerHeight = containerWidth / cropRatio;
      }

      this.preview.container.style.width = containerWidth + "px";
      this.preview.container.style.height = containerHeight + "px";

      let resizeWidth = (this.getSourceSize().width * containerWidth) / cropWidth;
      let resizeHeight = (this.getSourceSize().height * containerHeight) / cropHeight;

      let deltaX = -cropData.x * resizeWidth;
      let deltaY = -cropData.y * resizeHeight;

      this.preview.media.style.width = resizeWidth + "px";
      this.preview.media.style.height = resizeHeight + "px";

      this.preview.media.style.left = deltaX + "px";
      this.preview.media.style.top = deltaY + "px";
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

    const { width: parentWidth, height: parentHeight } = this.mediaEl.getBoundingClientRect();

    this.box.constrainToRatio(opts.aspectRatio, origin, "height", opts.maxAspectRatio);
    this.box.constrainToSize(opts.maxSize.width, opts.maxSize.height, opts.minSize.width, opts.minSize.height, origin, opts.aspectRatio, opts.maxAspectRatio);

    origins.map( newOrigin => {
      this.box.constrainToBoundary(parentWidth, parentHeight, newOrigin);
    } )
    
  }

  /**
   * Changes the image src.
   * @param {String} src
   */
  setImage(src, callback) {
    this.mediaType = 'image';
    this.onMediaLoad = callback;

    this.destroy(true);
    const newMedia = document.createElement('img');
    newMedia.setAttribute('src', src);
    this._restore.parent.appendChild(newMedia);

    this.initialize(newMedia);
    return this;
  }

  /**
   * Changes the video src.
   * @param {String} src
   */
  setVideo(src, callback) {
    this.mediaType = 'video';
    this.onMediaLoad = callback;

    this.destroy(true);
    const newMedia = document.createElement('video');
    newMedia.setAttribute('src', src);
    this._restore.parent.appendChild(newMedia);

    this.initialize(newMedia); 
    return this;
  }

  /**
   * Destroy the Croppr instance and replace with the original element.
   */
  destroy(doNotRestore) {
    // Sometimes, Croppr is destroyed before being totally initialized, so we have to check this datetime
    this.lastDestroyedDate = new Date().getTime();
    try {
      this.detachVideosToSyncHandlers();
      this.detachRegionEvents();
      this.detachOverlayEvents();
      if (this.containerEl) {
        if (!doNotRestore) this._restore.parent.replaceChild(this._restore.element, this.containerEl);
        else this._restore.parent.removeChild(this.containerEl);
        if(this.options.preview) {
          this.preview.media.parentNode.removeChild(this.preview.media);
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

    // Define box size
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

    //C reate initial box
    let box = new Box(0, 0, boxWidth, boxHeight);

    // Define crop position
    let x = 0;
    let y = 0;
    if(opts.startPosition === null) {
      // Move to center
      const { width: parentWidth, height: parentHeight } = this.mediaEl.getBoundingClientRect();
      x = (parentWidth / 2) - (boxWidth / 2);
      y = (parentHeight / 2) - (boxHeight / 2);
    } else {
      x = opts.startPosition.x;
      y = opts.startPosition.y;
    }
    box.move(x, y);

    // Reset preview img
    if(this.preview) {

      //If image in live preview already exists, delete it
      if(this.preview.media) {
        this.preview.media.parentNode.removeChild(this.preview.media);
        this.preview.media = null;
      }
      let newMedia = document.createElement(this.mediaType === 'video' ? 'video' : 'img');
      newMedia.src = this.mediaEl.src;
      if (this.mediaType === 'video') {
        ['loop', 'muted'].forEach(attr => newMedia.setAttribute(attr, true));
        newMedia.setAttribute('crossOrigin', 'anonymous');
      }

      this.preview.media = this.preview.container.appendChild(newMedia);
      this.preview.media.style.position = "relative";

    }

    if(constrain === true) this.strictlyConstrain();
    this.box = box;
    this.redraw();

    // Hide some handles if there are 2 ratios
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

    let modalStyle = this.modalStyle
    if(modalStyle && modalStyle.modalIsDisplayed === true) {
      return modalStyle
    }

    if(this.options.modal) {
      let { modal } = this.options

      let display = modal.currentStyle ? modal.currentStyle.display :
      getComputedStyle(modal, null).display
      let visibility =  modal.currentStyle ? modal.currentStyle.visibility :
      getComputedStyle(modal, null).visibility

      modalStyle = {
        operationName: operationName,
        modalIsDisplayed: true,
        display: display,
        visibility: visibility
      }
      this.modalStyle = modalStyle

      if(display === "none") {
        modal.style.visibility = "hidden";
        modal.style.display = "block";
      }
    }

    return modalStyle

  }

  resetModal(oldOperationName="default") {
    let modalStyle = this.modalStyle
    if(modalStyle) {
      let { visibility, display, operationName, modalIsDisplayed } = modalStyle
      if( modalIsDisplayed && oldOperationName === operationName  ) {
        let { modal } = this.options
        modal.style.visibility = visibility
        modal.style.display = display
        this.modalStyle = {
          operationName: null,
          modalIsDisplayed: false
        }
      }
    }
  }

  // Get raw media dimensions
  getSourceSize() {
    return {
      width: this.mediaEl[this.mediaType === 'image' ? 'naturalWidth' : 'videoWidth'],
      height: this.mediaEl[this.mediaType === 'image' ? 'naturalHeight' : 'videoHeight'],
    };
  }

  convertor(data, inputMode, outputMode) {
    const convertRealDataToPixel = data => {
      this.showModal()
      const { width, height } = this.mediaEl.getBoundingClientRect();
      this.resetModal()
      const factorX = this.getSourceSize().width / width;
      const factorY = this.getSourceSize().height / height;
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
    }
    const convertPercentToPixel = data => {
      this.showModal()
      const { width, height } = this.mediaEl.getBoundingClientRect();
      this.resetModal()
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
    }
    if(inputMode === "real" && outputMode === "raw") {
      return convertRealDataToPixel(data)
    } else if(inputMode === "ratio" && outputMode === "raw") {
      return convertPercentToPixel(data)
    }
    return null
  }

  convertOptionsToPixels(opts = null) {
    let setOptions = false
    if(opts === null) {
      opts = this.options
      setOptions = true
    }
    const { width, height } = this.mediaEl.getBoundingClientRect();
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
    if(setOptions) this.options = opts
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

    requestAnimationFrame(() => {
      // Update region element
      this.regionEl.style.transform = `translate(${x1}px, ${y1}px)`
      this.regionEl.style.width = width + 'px';
      this.regionEl.style.height = height + 'px';

      // Update clipped image element
      this.mediaClippedEl.style.clip = `rect(${y1}px, ${x2}px, ${y2}px, ${x1}px)`;

      // Determine which handle to bring forward. The following code
      // calculates the quadrant the box is in using bitwise operators.
      // Reference: https://stackoverflow.com/questions/9718059
      const center = this.box.getAbsolutePoint([.5, .5]);
      const { width: parentWidth, height: parentHeight } = this.mediaEl.getBoundingClientRect();
      const xSign = (center[0] - parentWidth / 2) >> 31;
      const ySign = (center[1] - parentHeight / 2) >> 31;
      const quadrant = (xSign ^ ySign) + ySign + ySign + 4;

      // The following equation calculates which handle index to bring
      // forward. The equation is derived using algebra (if youre curious)
      const foregroundHandleIndex = -2 * quadrant + 8

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
    this.eventBus.addEventListener('handlestart', this.onHandleMoveStart);
    this.eventBus.addEventListener('handlemove', this.onHandleMoveMoving);
    this.eventBus.addEventListener('handleend', this.onHandleMoveEnd);
  }

  /**
   * Attach event listeners for the crop region element.
   * Enables dragging/moving of the region element.
   */
  attachRegionEvents() {
    this.regionEl.addEventListener('mousedown', this.onEventBusMouseDown);
    this.eventBus.addEventListener('regionstart', this.onRegionMoveStart);
    this.eventBus.addEventListener('regionmove', this.onRegionMoveMoving);
    this.eventBus.addEventListener('regionend', this.onRegionMoveEnd);
  }

  detachRegionEvents() {
    if (this.regionEl) this.regionEl.removeEventListener('mousedown', this.onEventBusMouseDown);
    if (this.eventBus) {
      this.eventBus.removeEventListener('regionstart', this.onRegionMoveStart);
      this.eventBus.removeEventListener('regionmove', this.onRegionMoveMoving);
      this.eventBus.removeEventListener('regionend', this.onRegionMoveEnd);
    }
  }

  _onEventBusMouseDown(e) {
    e.stopPropagation();
    document.addEventListener('mouseup', this.onEventBusMouseUp);
    document.addEventListener('mousemove', this.onEventBusMouseMove);

    // Notify parent
    this.eventBus.dispatchEvent(new CustomEvent('regionstart', {
      detail: { mouseX: e.clientX, mouseY: e.clientY }
    }));
  }

  _onEventBusMouseMove(e) {
    e.stopPropagation();

    // Notify parent
    this.eventBus.dispatchEvent(new CustomEvent('regionmove', {
      detail: { mouseX: e.clientX, mouseY: e.clientY }
    }));
  }

  _onEventBusMouseUp(e) {
    e.stopPropagation();
    document.removeEventListener('mouseup', this.onEventBusMouseUp);
    document.removeEventListener('mousemove', this.onEventBusMouseMove);

    // Notify parent
    this.eventBus.dispatchEvent(new CustomEvent('regionend', {
      detail: { mouseX: e.clientX, mouseY: e.clientY }
    }));
  }

  /**
   * Attach event listeners for the overlay element.
   * Enables the creation of a new selection by dragging an empty area.
   */
  attachOverlayEvents() {
    this.tmpBox = null;
    this.overlayEl.addEventListener('mousedown', this.onOverlayMouseDown);
  }

  detachOverlayEvents() {
    this.tmpBox = null;
    if (this.overlayEl) this.overlayEl.removeEventListener('mousedown', this.onOverlayMouseDown);
  }

  _onOverlayMouseDown(e) {
    e.stopPropagation();
    document.addEventListener('mouseup', this.onOverlayMouseUp);
    document.addEventListener('mousemove', this.onOverlayMouseMove);

    // Calculate mouse's position in relative to the container
    const container = this.cropperEl.getBoundingClientRect();
    const mouseX = e.clientX - container.left;
    const mouseY = e.clientY - container.top;

    // Create new box at mouse position
    this.tmpBox = this.box;
    this.box = new Box(mouseX, mouseY, mouseX + 1, mouseY + 1);

    // Activate the bottom right handle
    this.eventBus.dispatchEvent(new CustomEvent('handlestart', {
      detail: { handle: this.handles[4] }
    }));
  }

  _onOverlayMouseMove(e) {
    e.stopPropagation();
    this.eventBus.dispatchEvent(new CustomEvent('handlemove', {
      detail: { mouseX: e.clientX, mouseY: e.clientY }
    }));
  }

  _onOverlayMouseUp(e) {
    e.stopPropagation();
    document.removeEventListener('mouseup', this.onOverlayMouseUp);
    document.removeEventListener('mousemove', this.onOverlayMouseMove);

    // If the new box has no width and height, it suggests that
    // the user had just clicked on an empty area and did not drag
    // a new box (ie. an accidental click). In this scenario, we
    // simply replace it with the previous box.
    if (this.box.width() === 1 && this.box.height() === 1) {
      this.box = this.tmpBox;
      return;
    }

    this.eventBus.dispatchEvent(new CustomEvent('handleend', {
      detail: { mouseX: e.clientX, mouseY: e.clientY }
    }));
  }

  /**
   * EVENT HANDLER
   * Executes when user begins dragging a handle.
   */
  _onHandleMoveStart(e) {
    let handle = e.detail.handle;

    // The origin point is the point where the box is scaled from.
    // This is usually the opposite side/corner of the active handle.
    const originPoint = [1 - handle.position[0], 1 - handle.position[1]];
    let [originX, originY] = this.box.getAbsolutePoint(originPoint);

    this.activeHandle = { handle, originPoint, originX, originY }

    // Trigger callback
    if (this.options.onCropStart !== null) {
      this.options.onCropStart(this.getValue());
    }
  }

  /**
   * EVENT HANDLER
   * Executes on handle move. Main logic to manage the movement of handles.
   */
  _onHandleMoveMoving(e) {
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
    const { width: parentWidth, height: parentHeight } = this.mediaEl.getBoundingClientRect();
    let boundaryOrigins = [origin];
    if(this.options.maxAspectRatio) boundaryOrigins = [[0, 0], [1, 1]];
    boundaryOrigins.map( boundaryOrigin => {
      box.constrainToBoundary(parentWidth, parentHeight, boundaryOrigin);
    })
    
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
  _onHandleMoveEnd(e) {

    // Trigger callback
    if (this.options.onCropEnd !== null) {
      this.options.onCropEnd(this.getValue());
    }
  }

  /**
   * EVENT HANDLER
   * Executes when user starts moving the crop region.
   */
  _onRegionMoveStart(e) {
    let { mouseX, mouseY } = e.detail;

    // Calculate mouse's position in relative to the container
    let container = this.cropperEl.getBoundingClientRect();
    mouseX = mouseX - container.left;
    mouseY = mouseY - container.top;

    this.currentMove = {
      offsetX: mouseX - this.box.x1,
      offsetY: mouseY - this.box.y1
    }

    // Trigger callback
    if (this.options.onCropStart !== null) {
      this.options.onCropStart(this.getValue());
    }

  }

  /**
   * EVENT HANDLER
   * Executes when user moves the crop region.
   */
  _onRegionMoveMoving(e) {
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
  _onRegionMoveEnd(e) {
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
      }
    }
    if(this.options.responsive) {
      if(mode == "ratio") this.responsiveData = cropData;
      else this.responsiveData = this.getValueAsRatio();
    }
    return cropData;
  }

  getValueAsRealData() {
    this.showModal()
    const { width: actualWidth, height: actualHeight } = this.getSourceSize();
    const { width: elementWidth, height: elementHeight } = this.mediaEl.getBoundingClientRect();
    const factorX = actualWidth / elementWidth;
    const factorY = actualHeight / elementHeight;
    this.resetModal()
    return {
      x: Math.round(this.box.x1 * factorX),
      y: Math.round(this.box.y1 * factorY),
      width: Math.round(this.box.width() * factorX),
      height: Math.round(this.box.height() * factorY)
    }
  }

  getValueAsRatio() {
    this.showModal()
    const { width: elementWidth, height: elementHeight } = this.mediaEl.getBoundingClientRect();
    this.resetModal()
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
    if(opts === null) opts = this.options
    const defaults = {
      aspectRatio: null,
      autoPlayVideo: false,
      maxAspectRatio: null,
      maxSize: { width: null, height: null, unit: 'raw' },
      minSize: { width: null, height: null, unit: 'raw' },
      muteVideo: false,
      startSize: { width: 1, height: 1, unit: 'ratio' },
      startPosition: null,
      returnMode: 'real',
      onInitialize: null,
      onCropStart: null,
      onCropMove: null,
      onCropEnd: null,
      onNotSupportedVideoLoad: null,
      preview: null,
      responsive: true,
      resyncInterval: 1000,
      resyncMethod: 'requestAnimationFrame',
      modal: null
    }

    //Parse preview
    let preview = null;
    if(opts.preview !== null) preview = this.getElement(opts.preview);

    //Parse preview
    let modal = null;
    if(opts.modal !== null) modal = this.getElement(opts.modal);

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
      }
    }

    // Parse min width/height
    let minSize = null;
    if (opts.minSize !== undefined && opts.minSize !== null) {
      minSize = {
        width: opts.minSize[0] || null,
        height: opts.minSize[1] || null,
        unit: opts.minSize[2] || 'raw'
      }
    }

    // Parse start size
    let startSize = null;
    if (opts.startSize !== undefined && opts.startSize !== null) {
      startSize = {
        width: opts.startSize[0] || null,
        height: opts.startSize[1] || null,
        unit: opts.startSize[2] || 'ratio'
      }
    }

    // Parse start position
    let startPosition = null;
    if (opts.startPosition !== undefined && opts.startPosition !== null) {
      startPosition = {
        x: opts.startPosition[0] || null,
        y: opts.startPosition[1] || null,
        unit: opts.startPosition[2] || 'ratio'
      }
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
    
    let onNotSupportedVideoLoad = null;
    if (typeof opts.onNotSupportedVideoLoad === 'function') {
      onNotSupportedVideoLoad = opts.onNotSupportedVideoLoad;
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
      autoPlayVideo: defaultValue(opts.autoPlayVideo, defaults.autoPlayVideo),
      maxAspectRatio: defaultValue(maxAspectRatio, defaults.maxAspectRatio),
      maxSize: defaultValue(maxSize, defaults.maxSize),
      minSize: defaultValue(minSize, defaults.minSize),
      muteVideo: defaultValue(opts.muteVideo, defaults.muteVideo),
      startSize: defaultValue(startSize, defaults.startSize),
      startPosition: defaultValue(startPosition, defaults.startPosition),
      returnMode: defaultValue(returnMode, defaults.returnMode),
      onInitialize: defaultValue(onInitialize, defaults.onInitialize),
      onCropStart: defaultValue(onCropStart, defaults.onCropStart),
      onCropMove: defaultValue(onCropMove, defaults.onCropMove),
      onCropEnd: defaultValue(onCropEnd, defaults.onCropEnd),
      onNotSupportedVideoLoad: defaultValue(onNotSupportedVideoLoad, defaults.onNotSupportedVideoLoad),
      preview: defaultValue(preview, defaults.preview),
      responsive: defaultValue(opts.responsive, defaults.responsive),
      resyncInterval: defaultValue(opts.resyncInterval, defaults.resyncInterval),
      resyncMethod: defaultValue(opts.resyncMethod, defaults.resyncMethod),
      modal: defaultValue(modal, defaults.modal)
    }
  }
}

/**
 * HELPER FUNCTIONS
 */

function round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}
