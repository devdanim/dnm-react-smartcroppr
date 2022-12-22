import React from 'react';
import PropTypes from 'prop-types';
import BaseSmartCroppr from './dnm-smartcroppr/src/index';
// lodash
import isEqual from 'lodash-es/isEqual';

const _ = {isEqual};

export default class SmartCroppr extends React.Component {
    constructor(props) {
        super(props);
        this.handleLoad = this.handleLoad.bind(this);
        this.state = {
            mediaTypeOnInit: props.mediaType,
            srcOnInit: props.src,
        }
    }

    componentDidMount() {
        this.handleLoad();
    }

    componentWillUnmount() {
        if (this.croppr) this.croppr.destroy(true);
    }

    componentDidUpdate(prevProps) {
        const crop = this.props.crop ? JSON.parse(JSON.stringify(this.props.crop)) : null; // JSON.parse(JSON.stringify()) to avoid method to modify ours props!
        if (prevProps.src !== this.props.src) {
            if (this.props.smartCrop) this.croppr.setMedia(
                this.props.src,
                this.props.onMediaLoad,
                true,
                this.props.smartCropOptions,
                this.props.mediaType,
            );
            else this.croppr.setMedia(
                this.props.src,
                (instance, mediaNode) => {
                    if (this.props.onMediaLoad) this.props.onMediaLoad(instance, mediaNode);
                    this.croppr.setValue(
                        crop || {x: 0, y: 0, width: 1, height: 1},
                        true,
                        crop ? this.props.mode : 'ratio'
                    )
                },
                false,
                {},
                this.props.mediaType,
            );
        } else if (!_.isEqual(prevProps.crop, this.props.crop) || prevProps.mode !== this.props.mode) {
            let updateIsNeeded = true;
            if (crop) {
                const activeCrop = this.croppr.getValue(this.props.mode);
                if (isEqual(activeCrop, crop)) updateIsNeeded = false;
            }
            if (updateIsNeeded) {
                this.croppr.setValue(
                    crop || {x: 0, y: 0, width: 1, height: 1},
                    true,
                    crop ? this.props.mode : 'ratio'
                );
            }
        }
        if (!_.isEqual(prevProps.style, this.props.style)) this.croppr.forceRedraw();
    }

    handleLoad() {
        const {
            smartCrop,
            crop,
            mode,
            smartCropOptions,
            onCropEnd,
            onCropStart,
            onCropMove,
            onInit,
            onMediaLoad,
            onNotSupportedVideoLoad,
            autoPlayVideo,
            muteVideo,
            debug,
            resyncInterval,
            resyncMethod,
        } = this.props;

        let { aspectRatio, maxAspectRatio } = this.props;
        if (!aspectRatio && !maxAspectRatio) {
            aspectRatio = -Infinity;
            maxAspectRatio = Infinity;
        }

        let startPosition = [0, 0, 'real'];
        let startSize = [1, 1, 'ratio'];
        if (crop) {
            const {x, y, width, height} = crop;
            startPosition = [x, y, crop.mode || mode];
            startSize = [width, height, crop.mode || mode];
        }

        this.croppr = new BaseSmartCroppr(this.media, {
            returnMode: mode,
            responsive: true,
            aspectRatio,
            maxAspectRatio,
            debug,
            smartcrop: crop ? false : smartCrop,
            smartOptions: smartCropOptions,
            startPosition,
            startSize,
            onCropEnd,
            onCropStart,
            onCropMove,
            autoPlayVideo,
            muteVideo,
            resyncInterval,
            resyncMethod,
            onInitialize: (instance, mediaNode) => {
                if (onInit) onInit(instance, mediaNode);
                if (onMediaLoad) onMediaLoad(instance, mediaNode);
            },
            onNotSupportedVideoLoad,
        });
    }

    render() {
        const { mediaTypeOnInit, srcOnInit } = this.state;
        return (
            <div className="cropper" style={this.props.style || null}>
                {
                    mediaTypeOnInit === 'image' ? (
                        <img
                            alt=""
                            ref={obj => this.media = obj}
                            crossOrigin="anonymous"
                            src={srcOnInit}
                        />
                    ) : (
                        <video 
                            ref={obj => this.media = obj}
                            crossOrigin="anonymous"
                            src={srcOnInit}
                            loop
                        />
                    )
                }
            </div>
        );
    }
}

SmartCroppr.propTypes = {
    // required
    src: PropTypes.string.isRequired,
    // optional
    aspectRatio: PropTypes.number,
    autoPlayVideo: PropTypes.bool,
    crop: PropTypes.object,
    maxAspectRatio: PropTypes.number,
    mediaType: PropTypes.oneOf(['image', 'video']),
    mode: PropTypes.oneOf(['ratio', 'raw', 'real']),
    muteVideo: PropTypes.bool,
    onCropEnd: PropTypes.func,
    onCropMove: PropTypes.func,
    onCropStart: PropTypes.func,
    onInit: PropTypes.func,
    onMediaLoad: PropTypes.func,
    resyncInterval: PropTypes.number,
    resyncMethod:  PropTypes.oneOf(['none', 'interval', 'requestAnimationFrame']),
    smartCrop: PropTypes.bool,
    smartCropOptions: PropTypes.object,
    style: PropTypes.object,
};

SmartCroppr.defaultProps = {
    aspectRatio: null,
    autoPlayVideo: false,
    crop: null,
    maxAspectRatio: null,
    mediaType: 'image',
    mode: 'real',
    muteVideo: false,
    onCropEnd: data => null,
    onCropMove: data => null,
    onCropStart: data => null,
    onImageLoad: () => null,
    onInit: (instance, mediaNode) => null,
    onMediaLoad: () => null,
    onVideoLoad: () => null,
    resyncInterval: 1000,
    resyncMethod: 'requestAnimationFrame',
    smartCrop: true,
    smartCropOptions: null,
};