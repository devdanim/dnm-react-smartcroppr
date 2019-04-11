import React from 'react';
import { render } from 'react-dom';
import SmartCroppr from '../index'

render(
    <div style={{position: "relative", maxWidth: "500px", width:"100%", margin: "auto"}}>
      <SmartCroppr
        aspectRatio={1.2}
        crop={{x:0, y:0, width: 450, height: 600}}
        maxAspectRatio={null}
        mode='real'
        onCropEnd={ data => console.log('onCropEnd', data)}
        onCropMove={ data => console.log('onCropMove', data)}
        onCropStart={ data => console.log('onCropStart', data)}
        onInit={instance => console.log('onInit', instance)}
        smartCrop={false}
        smartCropOptions={{
          minWidth: 200,
          minHeight: 200,
          minScaleTreshold: 0.7,
          face: false,
          onSmartCropDone: (data) => {
            console.log("Smartcrop", data)
          }
        }}
        src="https://images.unsplash.com/photo-1554583797-69a28298654c?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjF9"
      />
    </div>,
    document.getElementById('root')
);
