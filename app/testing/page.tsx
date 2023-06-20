"use client"

import { FC, useEffect, useRef } from 'react';
import { Container, Sprite, Application } from '@pixi/react';
import { SCALE_MODES, Sprite as PixiSprite } from 'pixi.js';

const Bunny: FC<{ x: number; y: number }> = ({ x, y }) => {
  const bunnyRef = useRef<PixiSprite>(null);

  const onDragStart = () => {
    if (bunnyRef.current) {
      bunnyRef.current.alpha = 0.5;
      bunnyRef.current.parent.on('pointermove', onDragMove);
    }
  };

  const onDragMove = (event: any) => {
    if (bunnyRef.current) {
      bunnyRef.current.parent.toLocal(event.global, null, bunnyRef.current.position);
    }
  };

  const onDragEnd = () => {
    if (bunnyRef.current) {
      bunnyRef.current.parent.off('pointermove', onDragMove);
      bunnyRef.current.alpha = 1;
    }
  };

  return (
    <Sprite
      ref={bunnyRef}
      image="https://pixijs.com/assets/bunny.png"
      anchor={[0.5, 0.5]}
      scale={3}
      x={x}
      y={y}
      interactive={true}
      pointerdown={onDragStart}
      pointerup={onDragEnd}
      pointerupoutside={onDragEnd}
    />
  );
};

const Page: FC = () => {
  const appRef = useRef<Application>(null);

  useEffect(() => {
    if (appRef.current) {
      const texture = PixiSprite.from('https://pixijs.com/assets/bunny.png').texture;
      texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;

      for (let i = 0; i < 10; i++) {
        const x = Math.floor(Math.random() * appRef.current.screen.width);
        const y = Math.floor(Math.random() * appRef.current.screen.height);
        appRef.current.stage.addChild(<Bunny x={x} y={y} />);
      }
    }
  }, [appRef]);

  return (
    <Application ref={appRef} options={{ background: 0x1099bb, resizeTo: window }}>
      <Container interactive={true} hitArea={appRef.current?.screen} />
    </Application>
  );
};

export default Page;
