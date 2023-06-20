"use client"

import * as React from 'react';
import * as PIXI from 'pixi.js';
import { FederatedEvent } from '../../node_modules/@pixi/events';

interface TextToolProps {
  app: PIXI.Application;
}

interface TextLine {
  container: PIXI.Container;
  textObjects: PIXI.Text[];
}

const TextTool = ({ app }: TextToolProps) => {
  const [textLines, setTextLines] = React.useState<TextLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = React.useState(-1);
  const [cursorPosition, setCursorPosition] = React.useState<PIXI.Point>();
  const [textCursorActive, setTextCursorActive] = React.useState(false);
  const caret = React.useRef<PIXI.Graphics>();
  const [caretActive, setCaretActive] = React.useState(false);

  // Blink the caret every 500ms
  const blinkInterval = 50; // number of frames between blinks
  let frameCount = 0;

  const blink = () => {
    if (caret.current && caretActive) {
      frameCount++;
      if (frameCount >= blinkInterval) {
        caret.current.visible = !caret.current.visible;
        frameCount = 0;
      }
    }
  };

  // Create the caret graphics object
  React.useEffect(() => {
    app.ticker.add(blink);
    return () => {
      app.ticker.remove(blink);
    };
  }, []);

  const handleActivateClick = () => {
    setCaretActive(true);
    setTextCursorActive(true);
    // Reset the cursor position when the text cursor is activated
    setCursorPosition(undefined);
    setCurrentLineIndex(-1);

    // Change the cursor style to 'text'
    (app.view as HTMLCanvasElement).style.cursor = 'text';
  };

  const handleReturnToDefaultClick = () => {
    setCaretActive(false);
    setTextCursorActive(false);

    // Reset the cursor position when returning to the default state
    setCursorPosition(undefined);
    setCurrentLineIndex(-1);

    // Hide the caret when returning to the default state
    if (caret.current) {
      caret.current.visible = false;
    }

    // Reset the cursor style to the default value
    (app.view as HTMLCanvasElement).style.cursor = 'default';
  };

  // Update the position of the caret when the cursor position changes
  React.useEffect(() => {
    if (cursorPosition && caret.current) {
      caret.current.position.set(cursorPosition.x, cursorPosition.y);
    }
  }, [cursorPosition]);

  const handleTextClick = (event: FederatedEvent) => {
    // Get the clicked text object and its parent container
    const textObject = event.currentTarget as PIXI.Text;
    const container = textObject.parent as PIXI.Container;
  
    // Find the index of the text line that contains the clicked text object
    const lineIndex = textLines.findIndex((line) => line.container === container);
    if (lineIndex === -1) {
      return;
    }
  
    // Set the current line index to the index of the text line that contains the clicked text object
    setCurrentLineIndex(lineIndex);
  
    // Calculate the position of the end of the text line
    const currentLine = textLines[lineIndex];
    const lastTextObject = currentLine.textObjects[currentLine.textObjects.length - 1];
    const newPosition = new PIXI.Point(
      lastTextObject.x + lastTextObject.width + currentLine.container.x,
      lastTextObject.y + currentLine.container.y
    );
    setCursorPosition(newPosition);
  };

  // Add an event listener for the click event to each text object
  textLines.forEach((line) => {
    line.textObjects.forEach((textObject) => {
      textObject.eventMode = 'auto';
      textObject.on('click', handleTextClick);
    });
  });

  const handleCanvasClick = (event: PointerEvent) => {
    const position = new PIXI.Point();
    app.renderer.events.mapPositionToPoint(position, event.clientX, event.clientY);
    setCursorPosition(position);
  
    // Show the caret when the canvas is clicked
    if (caret.current && caretActive) {
      caret.current.position.set(position.x, position.y);
      caret.current.visible = true;
    }
  
    // Create a new text line when the canvas is clicked
    if (textCursorActive) {
      const newContainer = new PIXI.Container();
      newContainer.x = position.x;
      newContainer.y = position.y;
      app.stage.addChild(newContainer);
  
      setTextLines((lines) => [...lines, { container: newContainer, textObjects: [] }]);
      setCurrentLineIndex(textLines.length);
      
      // Add an event listener for the click event to the new container
      let clickCount = 0;
      let clickTimeout: NodeJS.Timeout;

      newContainer.on('click', () => {
        clickCount++;
        if (clickCount === 1) {
          clickTimeout = setTimeout(() => {
            clickCount = 0;
          }, 300);
        } else if (clickCount === 2) {
          clearTimeout(clickTimeout);
          clickCount = 0;

          // Handle double click here
          setCurrentLineIndex(textLines.length - 1);

          // Calculate the position of the end of the text line
          const currentLine = textLines[textLines.length - 1];
          const lastTextObject = currentLine.textObjects[currentLine.textObjects.length - 1];
          const newPosition = new PIXI.Point(
            lastTextObject.x + lastTextObject.width + currentLine.container.x,
            lastTextObject.y + currentLine.container.y
          );
          setCursorPosition(newPosition);
        }
      });
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key.length === 1 && cursorPosition && textCursorActive && currentLineIndex !== -1) {
      PIXI.Text.defaultResolution = 2;
      PIXI.Text.defaultAutoResolution = false;
      const style = new PIXI.TextStyle({ fontSize: 24 });
      const newText = new PIXI.Text(event.key, style);
      const fontSize =
        typeof style.fontSize === 'number' ? style.fontSize : parseInt(style.fontSize);

      // Add the new text object to the current text line container
      const currentLine = textLines[currentLineIndex];
      currentLine.container.addChild(newText);
      newText.x =
        currentLine.textObjects.length > 0
          ? currentLine.textObjects[currentLine.textObjects.length - 1].x +
            currentLine.textObjects[currentLine.textObjects.length - 1].width
          : 0;
      newText.y = -fontSize;

      setTextLines((lines) =>
        lines.map((line, index) =>
          index === currentLineIndex ? { ...line, textObjects: [...line.textObjects, newText] } : line
        )
      );

      // Adjust the size of the caret to match the height of the text
      if (!caret.current) {
        caret.current = new PIXI.Graphics();
        app.stage.addChild(caret.current);
      }
      caret.current.clear();
      caret.current.lineStyle(2, 0x000000);
      caret.current.moveTo(0, -fontSize);
      caret.current.lineTo(0, 0);

      setCursorPosition(
        new PIXI.Point(cursorPosition.x + newText.width, cursorPosition.y)
      );
    } else if (event.key === 'Backspace' && textLines.length > 0 && currentLineIndex !== -1) {
      const currentLine = textLines[currentLineIndex];
      if (currentLine.textObjects.length > 0) {
        const lastTextObject = currentLine.textObjects[currentLine.textObjects.length - 1];
        currentLine.container.removeChild(lastTextObject);

        setTextLines((lines) =>
          lines.map((line, index) =>
            index === currentLineIndex
              ? { ...line, textObjects: line.textObjects.slice(0, -1) }
              : line
          )
        );

        // Update the cursor position
        const fontSize =
          typeof lastTextObject.style.fontSize === 'number'
            ? lastTextObject.style.fontSize
            : parseInt(lastTextObject.style.fontSize);
        setCursorPosition(
          new PIXI.Point(lastTextObject.x + currentLine.container.x, lastTextObject.y + fontSize + currentLine.container.y)
        );
      }
    } else if (event.key === 'Enter' && textCursorActive && currentLineIndex !== -1) {
      // Create a new text line when the Enter key is pressed
      const currentLine = textLines[currentLineIndex];
      const newContainer = new PIXI.Container();
      newContainer.x = currentLine.container.x;
      newContainer.y = currentLine.container.y + 50;
      app.stage.addChild(newContainer);

      setTextLines((lines) => [...lines, { container: newContainer, textObjects: [] }]);
      setCurrentLineIndex(textLines.length);

      // Add an event listener for the click event to the new container
      let clickCount = 0;
      let clickTimeout: NodeJS.Timeout;
      newContainer.on('click', () => {
        clickCount++;
        if (clickCount === 1) {
          clickTimeout = setTimeout(() => {
            clickCount = 0;
          }, 300);
        } else if (clickCount === 2) {
          clearTimeout(clickTimeout);
          clickCount = 0;
          setCurrentLineIndex(textLines.length - 1);
          setCursorPosition(new PIXI.Point(newContainer.x, newContainer.y));
        }
      });

      // Update the cursor position
      setCursorPosition(new PIXI.Point(newContainer.x, newContainer.y));
    }
  };

  React.useEffect(() => {
    (app.view as HTMLCanvasElement).addEventListener('pointerdown', handleCanvasClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      (app.view as HTMLCanvasElement).removeEventListener('pointerdown', handleCanvasClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cursorPosition, textCursorActive, currentLineIndex]);

  return (
    <div className='toolbox'>
      <button onClick={handleActivateClick}>Activate Text Cursor</button>
      <button onClick={handleReturnToDefaultClick}>Return to Default</button>
    </div>
  );
};

export default TextTool;
