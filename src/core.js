import React from 'react';
import PropTypes from 'prop-types';
import BaseSmartCroppr from 'dnm-smartcroppr'
export default class SmartCroppr extends React.Component {
    constructor(props) {
        super(props);
        this.handleLoad = this.handleLoad.bind(this);
    }

    componentDidUpdate(prevProps) {
        const crop = this.props.crop ? JSON.parse(JSON.stringify(this.props.crop)) : null; // JSON.parse(JSON.stringify()) to avoid method to modify ours props!
        if (prevProps.src !== this.props.src) {
            if (this.props.smartCrop) {
                this.croppr.setImage(
                    this.props.src,
                    null,
                    true,
                    this.props.smartCropOptions
                );
            } else {
                this.croppr.setImage(
                    this.props.src,
                    () => this.croppr.setValue(
                        crop || {x: 0, y: 0, width: 100, height: 100},
                        true,
                        this.props.mode || '%'
                    ),
                    false
                );
            }
        } else if (!_.isEqual(prevProps.crop, this.props.crop) || prevProps.mode !== this.props.mode) {
            this.croppr.setValue(crop, true, this.props.mode);
        }
    }

    handleLoad(ev) {
        if (typeof this.firstLoadDone === 'undefined') {
            this.firstLoadDone = true;

            // startPosition
            let startPosition = [0, 0, 'px', false];
            if (this.props.crop) {
                startPosition[0] = this.props.crop.x;
                startPosition[1] = this.props.crop.y;
                if (this.props.mode === 'real') {
                    startPosition[2] = 'px';
                    startPosition[3] = true;
                } else {
                    startPosition[2] = this.props.mode;
                    startPosition[3] = false;
                }
            }

            // startSize
            let startSize = [100, 100, '%', false];
            if (this.props.crop) {
                startSize[0] = this.props.crop.width;
                startSize[1] = this.props.crop.height;
                if (this.props.mode === 'real') {
                    startSize[2] = 'px';
                    startSize[3] = true;
                } else {
                    startSize[2] = this.props.mode;
                    startSize[3] = false;
                }
            }
            
            this.croppr = new BaseSmartCroppr(this.refs.img, {
                returnMode: this.props.mode,
                responsive: true,
                aspectRatio: this.props.aspectRatio,
                maxAspectRatio: this.props.maxAspectRatio,
                smartcrop: this.props.crop ? false : this.props.smartCrop,
                smartOptions: this.props.smartCropOptions,
                startPosition: startPosition,
                startSize: startSize,
                onCropEnd: this.props.onCropEnd,
                onCropStart: this.props.onCropStart,
                onCropMove: this.props.onCropMove,
                onInitialize: this.props.onInit,
            });
        }
    }

    render() {
        return (
            <div className="cropper">
                <img alt="" ref="img" onLoad={this.handleLoad} src={this.props.src}/>
            </div>
        );
    }
}

SmartCroppr.propTypes = {
    // required
    src: PropTypes.string.isRequired,
    // optional
    aspectRatio: PropTypes.number,
    crop: PropTypes.object,
    maxAspectRatio: PropTypes.number,
    mode: PropTypes.string,
    onCropEnd: PropTypes.func,
    onCropMove: PropTypes.func,
    onCropStart: PropTypes.func,
    onInit: PropTypes.func,
    smartCrop: PropTypes.bool,
    smartCropOptions: PropTypes.object,
};

SmartCroppr.defaultProps = {
    aspectRatio: 1,
    crop: null,
    maxAspectRatio: null,
    mode: 'px',
    onCropEnd: data => null,
    onCropMove: data => null,
    onCropStart: data => null,
    onInit: instance => null,
    smartCrop: true,
    smartCropOptions: null,
};