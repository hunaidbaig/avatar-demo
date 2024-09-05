import React, { useEffect, useRef } from 'react'
import { CanvasRender } from './canvas-render'
import { Button } from '@nextui-org/react';



function Avatar({ mediaStream, handleInterrupt, canPlay, setCanPlay, setSpeaking, setIsProcessing, setTranscript, handleSpeakWithMic  }:any) {
    const silenceTimeoutRef = useRef(null);
    const recognitionRef = useRef(null);


    useEffect(()=>{
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Continue listening
        recognition.interimResults = false; // Return interim results
        recognition.lang = "en-US"; // Set language to English
    
        recognition.onstart = () => {
          console.log("Voice recognition started.");
        };
    

        recognition.onresult = (event:any) => {
          setSpeaking(true); 
          const transcript = event.results[event.resultIndex][0].transcript.trim();
          console.log(transcript, 'ss')
    
          // let currentTranscript = Array.from(event.results)
          //   .map((result) => result[0].transcript)
          //   .join("");
        //   setTranscript(transcript);
    
          // Reset the silence detection timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          silenceTimeoutRef.current = setTimeout(() => {
            handleEndOfSpeech(transcript);
          setSpeaking(false);
          }, 100); // 2 seconds of silence detection
        };
    
        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
        };
    
        recognition.onend = () => {
          console.log("Voice recognition ended.");
          // Restart recognition to keep listening
        //   recognition.start();
        };
    
        recognitionRef.current = recognition;
        recognition.start(); // Start listening immediately when the component mounts
    
        return () => {
          recognition.stop();
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
        };
    
      },[])


      const handleEndOfSpeech = (finalTranscript:any) => {
        if (finalTranscript.trim()) {
          setIsProcessing(true);
          console.log("Final Transcript:", finalTranscript);
          setTranscript("");
    
          // Send the transcript to the backend here
          // Example: sendToBackend(finalTranscript);
    
          handleSpeakWithMic(finalTranscript);
    
    
          setIsProcessing(false);
        }
        setTranscript(""); // Clear the transcript after sending it
      };
    


  return (
    <div className="relative h-[80vh] w-[900px] justify-center items-center flex rounded-lg overflow-hidden">
              <video
                ref={mediaStream}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                className={`${canPlay && 'hidden'}`}
                onCanPlay={() => {
                  setCanPlay(true)
                }} 
                
              >
                <track kind="captions" />
              </video>
              {canPlay && <CanvasRender videoRef={mediaStream} />}
              {canPlay && <video autoPlay playsInline  src={'/bg.mp4'} loop
               className="absolute top-0 right-0 bottom-0 h-full w-full object-cover"
               />}

                <div className="flex flex-col gap-2 absolute bottom-3 right-3 z-10">
                 <Button
                   size="md"
                   onClick={handleInterrupt}
                   className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white rounded-lg"
                   variant="shadow"
                 >
                   Interrupt task
                 </Button>
                 {/* <Button
                   size="md"
                   onClick={endSession}
                   className="bg-gradient-to-tr from-indigo-500 to-indigo-300  text-white rounded-lg"
                   variant="shadow"
                 >
                   End session
                 </Button> */}
               </div>

            </div>
  )
}

export default Avatar