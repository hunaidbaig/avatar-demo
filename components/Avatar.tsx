import React, { useEffect, useRef, useState } from "react";
import { CanvasRender } from "./canvas-render";
import { Button } from "@nextui-org/react";
import { 
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
 } from "@/app/context/MicrophoneContextProvider";
import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  useDeepgram,
} from "@/app/context/DeepgramContextProvider";


function Avatar({
  mediaStream,
  handleInterrupt,
  canPlay,
  setCanPlay,
  setSpeaking,
  speaking,
  setIsProcessing,
  setTranscript,
  handleSpeakWithMic,
  setAvatarIsSpeaking,
  avatarIsSpeaking,
  setMessages,
  isStreaming,
  messages
}: any) {
  const silenceTimeoutRef = useRef(null);
  const recognitionRef = useRef(null);

  //deepgram sdk
  let caption = '';
  const [finalScript, setFinalScript] = useState<string>()
  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, microphoneState, isTyping } =
    useMicrophone();
  const captionTimeout = useRef<any>();
  const keepAliveInterval = useRef<any>();

  const handleEndOfSpeech = (finalTranscript: any) => {
    if (finalTranscript.trim()) {
      setIsProcessing(true);
      console.log("Final Transcript:", finalTranscript);
      setTranscript("");

      // Send the transcript to the backend here
      // Example: sendToBackend(finalTranscript);
      setMessages((prevMessages:any) => [
        ...prevMessages,
        {
          user: 'user',
          message: finalTranscript,
        }
      ]);
      handleSpeakWithMic(finalTranscript);

      setIsProcessing(false);
    }
    setTranscript(""); // Clear the transcript after sending it
  };


  //starting....
  useEffect(() => {
    setupMicrophone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaStream]);

  useEffect(() => {
    console.log('chala', microphoneState , MicrophoneState.Ready)
    if (microphoneState === MicrophoneState.Ready) {
      connectToDeepgram({
        // model: "nova-2",
        punctuate: true,
        // language: "en-US",
        // encoding: "linear16",
        channels: 1,
        sample_rate: 16000,
        // endpointing: 500,
        // smart_format: true,
        model: "nova-2",
        interim_results: true,
        // smart_format: true,
        filler_words: true,
        // utterance_end_ms: 2000,
        endpointing: 5000,

      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState]);

  useEffect(() => {
    if (!microphone) return;
    if (!connection) return;

    const onData = (e: BlobEvent) => {
      // iOS SAFARI FIX:
      // Prevent packetZero from being sent. If sent at size 0, the connection will close. 
      console.log('onData')
      if (e.data.size > 0) {
        console.log(e, '====>')
        connection?.send(e.data);
      }
    };

    const onTranscript = (data: LiveTranscriptionEvent) => {
      
      const { is_final: isFinal, speech_final: speechFinal } = data;

      let received = data.channel.alternatives[0].transcript;
      console.log(isFinal, 'isFinal', received);
      if (isFinal && !speechFinal) {
        setSpeaking(false)
        if(received.length > 0){
          console.log('idhar aya', speechFinal)
          if(avatarIsSpeaking){
            console.log('interrupt!!')
            handleInterrupt();
            setAvatarIsSpeaking(false);
          }
          setSpeaking(true)
          caption = caption.concat(received);
        }
        // setCaption(prev=>  prev?.concat(received));
      }
      else {
        if(caption.length>0){
        caption = caption.concat(received);
        setFinalScript(caption);
        console.log('ab yaha hn!=====>');

          handleEndOfSpeech(caption);
          console.log(caption)
          setSpeaking(false)
        }
        caption = '';
      }
    };
    console.log(connectionState, '======================');
    if (connectionState === LiveConnectionState.OPEN) {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);

     startMicrophone();
    }

    return () => {
      // prettier-ignore
      connection.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
      clearTimeout(captionTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState, microphone]);

  useEffect(() => {
    if (!connection) return;

    if (
      microphoneState !== MicrophoneState.Open &&
      connectionState === LiveConnectionState.OPEN
    ) {
      connection.keepAlive();

      keepAliveInterval.current = setInterval(() => {
        connection.keepAlive();
      }, 10000);
    } else {
      clearInterval(keepAliveInterval.current);
    }

    return () => {
      clearInterval(keepAliveInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState, connectionState, microphone]);

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
        className={`${canPlay && "hidden"}`}
        onCanPlay={() => {
          setCanPlay(true);
        }}
      >
        <track kind="captions" />
      </video>
      {(canPlay && mediaStream) && <CanvasRender isStreaming={isStreaming} videoRef={mediaStream} />}
    </div>
  );
}

export default Avatar;
