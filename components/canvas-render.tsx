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

    // Green screen parameters
    const greenThreshold = 120; // Adjust as needed
    const tolerance = 1.6; // Strength of green compared to red and blue
    const feathering = 5; // Number of pixels for feathering (smooth edges)

    function processFrame() {
      if (!refCanvas.current || !ctx || !show) return;

      if (isStreaming && videoRef.current?.readyState === 4) {
        ctx.clearRect(0, 0, refCanvas.current.width, refCanvas.current.height);
        ctx.drawImage(videoRef.current, 0, 0, refCanvas.current.width, refCanvas.current.height);

        const imageData = ctx.getImageData(0, 0, refCanvas.current.width, refCanvas.current.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];

          // Check if the pixel is green enough to be removed
          if (green > greenThreshold && green > red * tolerance && green > blue * tolerance) {
            data[i + 3] = 0; // Set alpha to 0 for transparency

            // Feather the edges by checking neighboring pixels
            for (let f = 1; f <= feathering; f++) {
              // Get the surrounding pixels for feathering
              const prevPixelIndex = i - (4 * f);
              const nextPixelIndex = i + (4 * f);
              if (prevPixelIndex >= 0 && nextPixelIndex < data.length) {
                // Apply a gradual transparency effect for smoothing
                data[prevPixelIndex + 3] = Math.max(data[prevPixelIndex + 3] - f * 20, 0);
                data[nextPixelIndex + 3] = Math.max(data[nextPixelIndex + 3] - f * 20, 0);
              }
            }
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

  return <canvas className="w-[95%] h-[70vh] bg-cover bg-center z-10" style={style} ref={refCanvas} />;
}
