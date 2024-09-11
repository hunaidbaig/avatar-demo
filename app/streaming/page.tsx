"use client"
import { useEffect, useRef, useState } from "react";

const App: () => JSX.Element = () => {
  const [caption, setCaption] = useState<string | undefined>("Powered by Deepgram");
  const captionTimeout = useRef<any>();
  const audioStream = useRef<MediaStream | null>(null);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize microphone and Deepgram WebSocket
    const startDeepgram = async () => {
      // STEP 1: Get user microphone stream
      try {
        
        navigator.mediaDevices.getUserMedia({ audio : true }).then(stream=>{
            const mediaRecorder = new MediaRecorder(stream, { mimeType : 'audio/webm' })

            const socket = new WebSocket('wss://api.deepgram.com/v1/listen',
            ['token', '77510d6b9912d8def820cdb9a445f9b2020fee7b'])

            socket.onopen = ()=>{
                console.log('open   ')
                mediaRecorder.addEventListener('dataavailable',(event)=>{
                    socket.send(event.data)
                })
                mediaRecorder.start();
            }

            socket.onmessage = (message)=>{
                const received = JSON.parse(message.data);
                const transcript = received.channel.alternatives[0].transcript

                console.log(transcript);
            }
        })

      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    startDeepgram();

    return () => {
      // Clean up on unmount
      if (audioStream.current) {
        const tracks = audioStream.current.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);

  return (
    <>
      <div className="flex h-full antialiased">
        <div className="flex flex-row h-full w-full overflow-x-hidden">
          <div className="flex flex-col flex-auto h-full">
            <div className="relative w-full h-full">
              <div className="absolute bottom-[8rem] inset-x-0 max-w-4xl mx-auto text-center">
                {caption && <span className="bg-black/70 p-8">{caption}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
