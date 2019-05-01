import React from 'react';
import PropTypes from 'prop-types';
import BaseSmartCroppr from 'dnm-smartcroppr';
// lodash
import isEqual from 'lodash-es/isEqual';
const _ = { isEqual };

export default class SmartCroppr extends React.Component {
    constructor(props) {
        super(props);

        this.handleLoad = this.handleLoad.bind(this);
        this.handleCropprInit = this.handleCropprInit.bind(this);
        console.log("CONTRUCT");
    }

    componentWillUnmount() {
        console.log("UNMOUNT");
        if(this.croppr) {
            this.croppr.destroy();
        }
    }

    componentDidMount() {
        //window.dispatchEvent(new Event('resize'));
    }

    componentDidUpdate(prevProps) {
        const crop = this.props.crop ? JSON.parse(JSON.stringify(this.props.crop)) : null; // JSON.parse(JSON.stringify()) to avoid method to modify ours props!
        if (prevProps.src !== this.props.src) {
            if (this.props.smartCrop) {
                console.log("UPDATE", "setImage with smartcrop");
                this.croppr.setImage(
                    this.props.src,
                    null,
                    true,
                    this.props.smartCropOptions
                );
            } else {
                console.log("UPDATE", "setImage without smartcrop");
                this.croppr.setImage(
                    this.props.src,
                    () => this.croppr.setValue(
                        crop || {x: 0, y: 0, width: 1, height: 1},
                        true,
                        crop ? this.props.mode : 'ratio'
                    ),
                    false
                );
            }
        } else if (!_.isEqual(prevProps.crop, this.props.crop) || prevProps.mode !== this.props.mode) {
            let updateisNeeded = true;
            if(crop) {
                const activeCrop = this.croppr.getValue(this.props.mode);
                if(isEqual(activeCrop, crop)) updateisNeeded = false;
            }
            if(updateisNeeded) {
                console.log("UPDATE", "setValue", prevProps.crop, this.props.crop);
                this.croppr.setValue(
                    crop || { x: 0, y: 0, width: 1, height: 1 }, 
                    true, 
                    crop ? this.props.mode : 'ratio'
                );
            }
        }
    }

    handleCropprInit(croppr) {
        const { onInit } = this.props;
        croppr.forceRedraw();
        window.redraw = croppr.forceRedraw;
        if(onInit) onInit(croppr);
    }

    handleLoad(ev) {
        console.log("LOAD");
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
            } = this.props;

            let startPosition = [0, 0, 'real'];
            let startSize = [1, 1, 'ratio'];
            if (crop) {
                const { x, y, width, height } = crop;
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
                onInitialize: this.handleCropprInit,
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
    mode: PropTypes.oneOf(["ratio", "raw", "real"]),
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
    mode: 'real',
    onCropEnd: data => null,
    onCropMove: data => null,
    onCropStart: data => null,
    onInit: instance => null,
    smartCrop: true,
    smartCropOptions: null,
};