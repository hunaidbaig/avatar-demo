import { AVATARS, VOICES } from "@/app/lib/constants";
import {
  Configuration,
  NewSessionData,
  StreamingAvatarApi,
} from "@heygen/streaming-avatar";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Input,
  Select,
  SelectItem,
  Spinner,
  Tooltip,
} from "@nextui-org/react";
import { Microphone, MicrophoneStage, X } from "@phosphor-icons/react";
import { useChat } from "ai/react";
import clsx from "clsx";
import OpenAI from "openai";
import { useEffect, useRef, useState } from "react";
import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";
import { CanvasRender } from "./canvas-render";
import Avatar from "./Avatar";
import Image from "next/image";
import { useMicrophone } from "@/app/context/MicrophoneContextProvider";
import ChatInput from "./chatInput";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface MessageType{
  user : string;
  message : string;
}

export default function InteractiveAvatar() {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const [avatarId, setAvatarId] = useState<string>("");
  const [voiceId, setVoiceId] = useState<string>("");
  const [data, setData] = useState<NewSessionData>();
  const [text, setText] = useState<string>("");
  const [initialized, setInitialized] = useState(false); // Track initialization
  const [recording, setRecording] = useState(false); // Track recording state
  const [canPlay, setCanPlay] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const mediaStream = useRef<HTMLVideoElement>(null);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [avatarIsSpeaking, setAvatarIsSpeaking] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const { shutdownMicrophone } = useMicrophone();
  const [isStreaming, setIsStreaming] = useState(false);
  
  const avatar = useRef<StreamingAvatarApi | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { input, setInput, handleSubmit } = useChat({
    onFinish: async (message) => {
      console.log("ChatGPT Response:", message);

      if (!initialized || !avatar.current) {
        setDebug("Avatar API not initialized");
        return;
      }

      //send the ChatGPT response to the Interactive Avatar
      await avatar.current
        .speak({
          taskRequest: { text: message.content, sessionId: data?.sessionId },
        })
        .catch((e) => {
          setDebug(e.message);
        });
      setIsLoadingChat(false);
    },
    initialMessages: [
      {
        id: "1",
        role: "system",
        content: "You are a helpful assistant.",
      },
    ],
  });

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });
      const token = await response.text();
      console.log("Access Token:", token); // Log the token to verify
      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      return "";
    }
  }

  async function startSession() {
    setIsLoadingSession(true);
    await updateToken();
    if (!avatar.current) {
      setDebug("Avatar API is not initialized");
      return;
    }
    try {
      const res = await avatar.current.createStartAvatar(
        {
          newSessionRequest: {
            quality: "high",
            avatarName: 'Tyler-incasualsuit-20220721',
            voice: { voiceId: '0ebe70d83b2349529e56492c002c9572' },
          },
        },
        setDebug
      );
      setData(res);
      setStream(avatar.current.mediaStream);
    } catch (error) {
      console.error("Error starting avatar session:", error);
      setDebug(
        `There was an error starting the session. ${voiceId ? "This custom voice ID may not be supported." : ""}`
      );
    }
    setIsLoadingSession(false);
  }

  async function updateToken() {
    const newToken = await fetchAccessToken();
    console.log("Updating Access Token:", newToken); // Log token for debugging
    avatar.current = new StreamingAvatarApi(
      new Configuration({ accessToken: newToken })
    );

    const startTalkCallback = (e: any) => {
      console.log("Avatar started talking", e);
    };

    const stopTalkCallback = (e: any) => {
      console.log("Avatar stopped talking", e);
      setAvatarIsSpeaking(false);
    };

    console.log("Adding event handlers:", avatar.current);
    avatar.current.addEventHandler("avatar_start_talking", startTalkCallback);
    avatar.current.addEventHandler("avatar_stop_talking", stopTalkCallback);

    setInitialized(true);
  }

  async function handleInterrupt() {
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    await avatar.current
      .interrupt({ interruptRequest: { sessionId: data?.sessionId } })
      .catch((e) => {
        setDebug(e.message);
      });
  }

  async function endSession() {
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    
    // Stop avatar session
    await avatar.current.stopAvatar(
      { stopSessionRequest: { sessionId: data?.sessionId } },
      setDebug
    );
    
    // Stop media stream
    if (mediaStream.current) {
      console.log('stop it bro!!!')
      mediaStream.current.srcObject = null;
    }
    setIsStreaming(false);
    setStream(undefined);
    shutdownMicrophone();
    setCanPlay(false);
    setIsLoadingSession(false);
    setIsLoadingRepeat(false);
    setMessages([]);
  }
    // stopRecording();

  async function handleSpeak() {
    setIsLoadingRepeat(true);
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }
    // console.log(avatar, 'avatar----')
    await avatar.current
      .speak({ taskRequest: { text: text, sessionId: data?.sessionId } })
      .catch((e) => {
        setDebug(e.message);
      });
    setIsLoadingRepeat(false);
  }

  async function handleSpeakWithMic(query : string) {
    console.log('hello bro')
    setIsLoadingRepeat(true);
    if (!initialized || !avatar.current) {
      setDebug("Avatar API not initialized");
      return;
    }

    try {
      const url = "http://127.0.0.1:8000/query/";
      
      const response = await fetch(`${url}?station_id=123&query=${query}`);
      const result = await response.json();

      //avatar is speaking right now!
      setAvatarIsSpeaking(true);

      await avatar.current
        .speak({ taskRequest: { text: result.response, sessionId: data?.sessionId } })
        .catch((e) => {
          setDebug(e.message);
        });
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            user: 'bot',
            message: result.response,
          }
        ]);
      setIsLoadingRepeat(false);
      setInput('');
    
    } catch (error) {
      console.log(error)
    }

  }

  useEffect(() => {
    async function init() {
      const newToken = await fetchAccessToken();
      console.log("Initializing with Access Token:", newToken); // Log token for debugging
      avatar.current = new StreamingAvatarApi(
        new Configuration({ accessToken: newToken, jitterBuffer: 200 })
      );
      setInitialized(true); // Set initialized to true
    }

    init();

    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        setIsStreaming(true);
        mediaStream.current!.play();
        console.log('start stream!', mediaStream.current?.srcObject)
        setDebug("Playing");
      };
    }
  }, [mediaStream, stream]);



  
  function startRecording() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder.current = new MediaRecorder(stream);
        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
          console.log(event.data, 'data data')
        };
        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, {
            type: "audio/wav",
          });
          audioChunks.current = [];
          transcribeAudio(audioBlob);
        };
        mediaRecorder.current.start();
        setRecording(true);
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });
  }

  function stopRecording() {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  }

  async function transcribeAudio(audioBlob: Blob) {
    try {
      // Convert Blob to File
      const audioFile = new File([audioBlob], "recording.wav", {
        type: "audio/wav",
      });
      console.log(audioFile)
      const response = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: audioFile,
      });
      const transcription = response.text;
      console.log("Transcription: ", transcription);
      setInput(transcription);
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  }

   // Handle file upload (image or video)
   const handleFileUpload = (event:any) => {
    const file = event.target.files[0];
    if (file) {
      const fileUrl:any = URL.createObjectURL(file);

      if (file.type.startsWith("video/")) {
        setIsVideo(true); 
      } else {
        setIsVideo(false); 
      }

      setUploadedFile(fileUrl); 
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 h-screen ">
      <Card>
        <CardBody className={`h-screen w-full p-0  flex flex-col justify-end items-center`}>

          {stream && uploadedFile && isVideo ? (
            <video
              src={uploadedFile}
              autoPlay
              loop
              muted
              className="absolute top-0 left-0 w-full h-full object-cover z-10"
            />
          ) : stream && uploadedFile ? (
            <div
              className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-10"
              style={{ backgroundImage: `url(${uploadedFile})` }}
            />
          ) : stream ? (
            <div
              className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-10"
              style={{ backgroundImage: `url('/bg.jpg')` }}
            >
              <div onClick={endSession} className="absolute right-9 top-8 cursor-pointer hover:opacity-65">
                <X size={32} />
              </div>
            </div>
          ) : null}

          {stream ? (
            <Avatar 
              canPlay={canPlay} 
              setCanPlay={setCanPlay} 
              setSpeaking={setSpeaking}
              mediaStream={mediaStream} 
              setIsProcessing ={setIsProcessing} 
              setTranscript= {setTranscript}
              handleSpeakWithMic = {handleSpeakWithMic}
              handleInterrupt = {handleInterrupt}
              setAvatarIsSpeaking={setAvatarIsSpeaking}
              avatarIsSpeaking={avatarIsSpeaking}
              setMessages={setMessages}
              messages={messages}
              speaking={speaking}
              isStreaming={isStreaming}
              />

          ) :  (
            <div className="w-full h-full bg-cover  ">
              <Image
                src={'/bg-screen.png'}
                width={2000}
                height={2000}
                className="w-full h-full"
                alt="bg-screen"
              />
              
              <div className="absolute bottom-[24px] left-0 right-0 w-full flex justify-center">
                <div className="p-8 w-[480px] rounded-xl backdrop-blur-lg text-white text-center bg-gradient-to-r from-[rgba(50,181,255,0.07)] to-[rgba(255,114,bg-gradient-to-r from-[rgba(50,181,255,0.07)] to-[rgba(255,114,224,0.07)] bg-[rgba(22,23,26,0.3)]224,0.07)] bg-[rgba(22,23,26,0.3)]">
                  <div className="flex flex-col gap-4 items-center">
                    <div>👋 Enjoy a chat with !</div>
                    <Button disabled={isLoadingSession} onClick={startSession} className="bg-[#7559ff] w-[50%] text-white text-lg">
                      { isLoadingSession ? <Spinner size="sm" color="white" /> : 'Start new chat'}
                      </Button>
                  </div>
                </div>
              </div>

            </div>
            // <div className="h-full justify-center items-center flex flex-col gap-8 w-[500px] self-center">
            //   <div className="flex flex-col gap-2 w-full">
            //     <p className="text-sm font-medium leading-none">
            //       Custom Avatar ID (optional)
            //     </p>
            //     <Input
            //       value={avatarId}
            //       onChange={(e) => setAvatarId(e.target.value)}
            //       placeholder="Enter a custom avatar ID"
            //     />
            //     <Select
            //       placeholder="Or select one from these example avatars"
            //       size="md"
            //       onChange={(e) => {
            //         setAvatarId(e.target.value);
            //       }}
            //     >
            //       {AVATARS.map((avatar) => (
            //         <SelectItem
            //           key={avatar.avatar_id}
            //           textValue={avatar.avatar_id}
            //         >
            //           {avatar.name}
            //         </SelectItem>
            //       ))}
            //     </Select>
            //   </div>
            //   <div className="flex flex-col gap-2 w-full">
            //     <p className="text-sm font-medium leading-none">
            //       Custom Voice ID (optional)
            //     </p>
            //     <Input
            //       value={voiceId}
            //       onChange={(e) => setVoiceId(e.target.value)}
            //       placeholder="Enter a custom voice ID"
            //     />
            //     <Select
            //       placeholder="Or select one from these example voices"
            //       size="md"
            //       onChange={(e) => {
            //         setVoiceId(e.target.value);
            //       }}
            //     >
            //       {VOICES.map((voice) => (
            //         <SelectItem key={voice.voice_id} textValue={voice.voice_id}>
            //           {voice.name} | {voice.language} | {voice.gender}
            //         </SelectItem>
            //       ))}
            //     </Select>
            //   </div>
            //   <Button
            //     size="md"
            //     onClick={startSession}
            //     className="bg-gradient-to-tr from-indigo-500 to-indigo-300 w-full text-white"
            //     variant="shadow"
            //   >
            //     Start session
            //   </Button>
            // </div>
          )}

        {
          stream && 
            <div className="z-20 absolute left-10 bottom-10">
              <label className="block text-sm font-medium text-blue-700">
                Upload Image or Video
              </label>
              <input
                type="file"
                accept="image/*, video/*"
                onChange={handleFileUpload}
                className="mt-2"
              />
            </div>
        }

        
      {
        stream && 
        <div className="z-10 w-[50%] absolute">
          <div className="px-4 text-white z-10 h-[200px] overflow-y-auto pt-8" style={{
            maskImage: "linear-gradient(to top, black, transparent)"
          }}>
            {
              messages?.map((message, index)=>(
                <div className="flex justify-start mt-2">
                  <div className="flex justify-between gap-3">
                    <div className={`h-[20px] w-[20px] ${message.user === 'bot' ? 'bg-[rgb(64,67,211)]': 'bg-gray-500'}  rounded-full flex justify-center items-center`}>
                      {
                        message.user === 'bot' ? 'Q' : 'U'
                      }
                    </div>
                    <p className="w-full"
                    style={{
                      background: "linear-gradient(313deg, rgba(50, 181, 255, 0.07) 9.15%, rgba(255, 114, 224, 0.07) 104.07%), rgba(22, 23, 26, 0.3)"
                    }}>
                      {
                        message.message
                      }
                    </p>
                  </div>
                </div>
              ))
            }
          </div>

        
            <div className="flex justify-center w-full mb-2">
              <ChatInput
                input={text}
                setMessages={setMessages}
                messages={messages}
                onSubmit={handleSpeakWithMic}
                setInput={setText}
                disabled={!stream}
                loading={isLoadingRepeat}
                speaking={speaking}
              />
              {/* <InteractiveAvatarTextInput
                label="Type here"
                placeholder="Ask me"
                input={text}
                setMessages={setMessages}
                messages={messages}
                onSubmit={handleSpeakWithMic}
                setInput={setText}
                disabled={!stream}
                loading={isLoadingRepeat}
              /> */}
            </div>
        </div>
        }
          
        </CardBody>
        
      </Card>
    </div>
  );
}
