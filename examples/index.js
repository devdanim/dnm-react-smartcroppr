import React from 'react';
import { render } from 'react-dom';
import SmartCroppr from '../dist/dnm-react-smartcroppr.es';

render(
    <div style={{position: 'relative', maxWidth: '500px', width: '100%', margin: 'auto'}}>
      <SmartCroppr
        aspectRatio={2}
        //crop={{x:0, y:0, width: 450, height: 600}}
        maxAspectRatio={null}
        mode='real'
        onCropEnd={ data => console.log('onCropEnd', data)}
        onCropMove={ data => console.log('onCropMove', data)}
        onCropStart={ data => console.log('onCropStart', data)}
        onInit={instance => console.log('onInit', instance)}
        smartCrop={true}
        smartCropOptions={{
          minWidth: 200,
          minHeight: 200,
          minScaleTreshold: 0.7,
          face: false,
          onSmartCropDone: (data) => {
            console.log("Smartcrop", data)
          }
        }}
        //src="https://images.unsplash.com/photo-1554676187-e9a89ddb659e?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjF9"
        src="https://source.unsplash.com/random"
      />
    </div>,
    document.getElementById('root')
);
