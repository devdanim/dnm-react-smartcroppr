import React from 'react';
import { render } from 'react-dom';
import SmartCroppr from '../dist/dnm-react-smartcroppr.es';

render(
    <div style={{position: 'relative', maxWidth: '500px', width: '100%', margin: 'auto'}}>
      <SmartCroppr
        aspectRatio={1}
        crop={{x:40, y:60, width: 90, height: 90}}
        // maxAspectRatio={2}
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
          onSmartCropDone: (data) => {
            console.log("Smartcrop", data)
          }
        }}
        // src="https://images.unsplash.com/photo-1554676187-e9a89ddb659e?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjF9"
        src="https://s3.eu-west-3.amazonaws.com/com.danim.prod/bkd/app/user/file-store/9214ee05-83c4-40f7-ada6-8a2b248afd39.jpg"
      />
    </div>,
    document.getElementById('root')
);
