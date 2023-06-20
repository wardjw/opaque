"use client"

import * as React from 'react';
import * as PIXI from 'pixi.js';

import TextTool from '../../components/bookcase/TextTool';

const Paper = () => {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const app = React.useRef<PIXI.Application>();
  const [appReady, setAppReady] = React.useState(false);

  React.useEffect(() => {
    app.current = new PIXI.Application({ backgroundColor: 0xFFFFFF });
    if (canvasRef.current && app.current) {
      canvasRef.current.appendChild(app.current.view as HTMLCanvasElement);
      setAppReady(true);
    }
    return () => {
      app.current?.destroy();
    };
  }, []);

  return (
    <div>
      <div ref={canvasRef} />
      {appReady && <TextTool app={app.current!} />}
    </div>
  );
};

export default Paper;
