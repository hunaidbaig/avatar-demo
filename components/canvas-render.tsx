import React, { useEffect, useRef } from 'react';

type CanvasRenderProps = {
  style?: React.CSSProperties;
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
};

export function CanvasRender(props: CanvasRenderProps) {
  const { videoRef, style, isStreaming } = props;
  const refCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!refCanvas.current || !videoRef.current) return;

    // Set the canvas size to match the video size
    refCanvas.current.width = videoRef.current.videoWidth;
    refCanvas.current.height = videoRef.current.videoHeight;
    const ctx = refCanvas.current?.getContext('2d');
    let show = true;

    function processFrame() {
      if (!refCanvas.current || !ctx || !show) return;

      // If streaming is active, draw the video frames
      if (isStreaming && videoRef.current?.readyState === 4) {
        ctx.clearRect(0, 0, refCanvas.current.width, refCanvas.current.height);
        ctx.drawImage(videoRef.current, 0, 0, refCanvas.current.width, refCanvas.current.height);

        // Optional: Image data processing (e.g., green screen effect)
        const imageData = ctx.getImageData(0, 0, refCanvas.current.width, refCanvas.current.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];

          // Adjust green screen removal based on the actual scenario
          if (green > 90 && red < 90 && blue < 90) {
            data[i + 3] = 0; // Set green pixels to transparent
          }
        }

        // Put the processed image data back into the canvas
        ctx.putImageData(imageData, 0, 0);

        // Continue processing frames
        requestAnimationFrame(processFrame);
      } else {
        // If streaming has stopped, clear the canvas to avoid black screen
        ctx.clearRect(0, 0, refCanvas.current.width, refCanvas.current.height);
      }
    }

    // Start processing video frames if streaming
    processFrame();

    return () => {
      show = false; // Stop frame processing on unmount
    };
  }, [videoRef]);

  return <canvas className="w-[95%] bg-cover bg-center z-10" style={style} ref={refCanvas} />;
}
