import React from 'react';
import PropTypes from 'prop-types';
import BaseSmartCroppr from 'dnm-smartcroppr';
// lodash
import isEqual from 'lodash-es/isEqual';

const _ = {isEqual};

export default class SmartCroppr extends React.Component {
    constructor(props) {
        super(props);
        this.handleLoad = this.handleLoad.bind(this);
    }

    componentWillUnmount() {
        if (this.croppr) this.croppr.destroy();
    }

    componentDidUpdate(prevProps) {
        const crop = this.props.crop ? JSON.parse(JSON.stringify(this.props.crop)) : null; // JSON.parse(JSON.stringify()) to avoid method to modify ours props!
        if (prevProps.src !== this.props.src) {
            if (this.props.smartCrop) this.croppr.setImage(
                this.props.src,
                null,
                true,
                this.props.smartCropOptions
            );
            else this.croppr.setImage(
                this.props.src,
                () => this.croppr.setValue(
                    crop || {x: 0, y: 0, width: 1, height: 1},
                    true,
                    crop ? this.props.mode : 'ratio'
                ),
                false
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

    handleLoad(ev) {
        if (typeof this.firstLoadDone === 'undefined') {
            this.firstLoadDone = true;

            const {
                smartCrop,
                crop,
                mode,
                aspectRatio,
                maxAspectRatio,
                smartCropOptions,
                onCropEnd,
                onCropStart,
                onCropMove,
                onInit,
            } = this.props;

            let startPosition = [0, 0, 'real'];
            let startSize = [1, 1, 'ratio'];
            if (crop) {
                const {x, y, width, height} = crop;
                startPosition = [x, y, crop.mode || mode];
                startSize = [width, height, crop.mode || mode];
            }

            this.croppr = new BaseSmartCroppr(this.refs.img, {
                returnMode: mode,
                responsive: true,
                aspectRatio,
                maxAspectRatio,
                smartcrop: crop ? false : smartCrop,
                smartOptions: smartCropOptions,
                startPosition,
                startSize,
                onCropEnd,
                onCropStart,
                onCropMove,
                onInitialize: onInit,
            });
        }
    }

    render() {
        return (
            <div className="cropper" style={this.props.style || null}>
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
    mode: PropTypes.oneOf(['ratio', 'raw', 'real']),
    onCropEnd: PropTypes.func,
    onCropMove: PropTypes.func,
    onCropStart: PropTypes.func,
    onInit: PropTypes.func,
    smartCrop: PropTypes.bool,
    smartCropOptions: PropTypes.object,
    style: PropTypes.object,
};

SmartCroppr.defaultProps = {
    aspectRatio: 1,
    crop: null,
    maxAspectRatio: null,
    mode: 'real',
    onCropEnd: data => null,
    onCropMove: data => null,
    onCropStart: data => null,
    onInit: instance => null,
    smartCrop: true,
    smartCropOptions: null,
};