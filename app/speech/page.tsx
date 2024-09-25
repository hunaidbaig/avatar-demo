"use client"
import React, { useState, useEffect, useRef } from "react";

export default function VoiceAssistant() {
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize the SpeechRecognition object
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Continue listening
      recognition.interimResults = false; // Return interim results
      // recognition.lang = "en-US"; // Set language to English
  
      recognition.onstart = () => {
        console.log("Voice recognition started.");
      };
      console.log('ss')

  
      recognition.onresult = (event:any) => {
        const transcript = event.results[event.resultIndex][0].transcript.trim();
        console.log(transcript, 'ss')
  
        // let currentTranscript = Array.from(event.results)
        //   .map((result) => result[0].transcript)
        //   .join("");
        setTranscript(transcript);
  
        // Reset the silence detection timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = setTimeout(() => {
          handleEndOfSpeech(transcript);
        }, 2000); // 2 seconds of silence detection
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
    
  }, []);

  const handleEndOfSpeech = (finalTranscript:any) => {
    if (finalTranscript.trim()) {
      setIsProcessing(true);
      console.log("Final Transcript:", finalTranscript);
      setTranscript("");

      // Send the transcript to the backend here
      // Example: sendToBackend(finalTranscript);

      setIsProcessing(false);
    }
    setTranscript(""); // Clear the transcript after sending it
  };

  return (
    <div>
      <h1>Voice Assistant</h1>
      <div>
        <h2>Transcript:</h2>
        <p>{transcript}</p>
        {isProcessing && <p>Processing...</p>}
      </div>
    </div>
  );
}
