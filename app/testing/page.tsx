import { FC, useEffect, useRef } from 'react';
import { Stage, Container, Sprite } from '@pixi/react';
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
        bunnyRef.current.parent.toLocal(event.global, undefined, bunnyRef.current.position);
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
  const bunnies = useRef<Array<JSX.Element>>([]);

  useEffect(() => {
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(Math.random() * window.innerWidth);
      const y = Math.floor(Math.random() * window.innerHeight);
      bunnies.current.push(<Bunny x={x} y={y} />);
    }
  }, []);

  return (
    <Stage options={{ backgroundColor: 0x1099bb, resizeTo: window }}>
      <Container interactive={true}>
        {bunnies.current}
      </Container>
    </Stage>
  );
};

export default Page;
