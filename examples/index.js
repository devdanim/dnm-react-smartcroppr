import React from 'react';
import { render } from 'react-dom';
import SmartCroppr from '../dist/dnm-react-smartcroppr.es';

const medias = [
  {
    src: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
    type: 'image'
  },
  {
    src: 'https://images.unsplash.com/photo-1480554840075-72cbdabbf689?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    type: 'image'
  },
  {
    src: '',
    type: 'video'
  }
];
class Example extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
        reinitCounter: 0,
        src: medias[0].src,
        type: medias[0].type
      }
  }

  handleReinitCounterClick = () => {
    const { reinitCounter } = this.state;
    this.setState({ reinitCounter: reinitCounter + 1 })
  }

  handleMediaChange = (media) => {
    this.setState({ ...media });
  }

  render() {
    const { src, type, reinitCounter } = this.state;
      return (
        <div key={reinitCounter}>
          <div>
            {
              medias.map((media, index) => (
                <button key={index} onClick={() => this.handleMediaChange(media)}>{`${index + 1} - ${media.type}`}</button>
              ))
            }
          </div>
          <div style={{position: 'relative', maxWidth: '500px', width: '100%', margin: 'auto'}}>
            <SmartCroppr
              aspectRatio={0.5}
              debug
              // crop={{x:40, y:60, width: 90, height: 90}}
              // maxAspectRatio={2}
              mode='real'
              onCropEnd={data => console.log('onCropEnd', data)}
              onCropMove={data => console.log('onCropMove', data)}
              onCropStart={data => console.log('onCropStart', data)}
              onInit={(instance, mediaNode) => {
                console.log('onInit', instance, mediaNode);
              }}
              smartCrop={true}
              smartCropOptions={{
                minWidth: 100,
                minHeight: 200,
                onSmartCropDone: (data) => {
                  console.log("Smartcrop", data)
                }
              }}
              mediaType={type}
              src={src}
            />
          </div>
          <div>
            <button onClick={this.handleReinitCounterClick}>Reset</button>
          </div>
        </div>
      );
  }
}

render(
    <Example/>,
    document.getElementById('root')
);
