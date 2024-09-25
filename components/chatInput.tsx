import { useMicrophone } from '@/app/context/MicrophoneContextProvider';
import { Tooltip } from '@nextui-org/react';
import { Keyboard, Microphone, PaperPlaneRight } from '@phosphor-icons/react';
import Image from 'next/image';
import React, { useState } from 'react';

interface ChatInputProps {
  input: string;
  onSubmit: (text:string) => void;
  setInput: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  setMessages : any;
  messages: any;
  speaking : boolean;
}


const ChatInput = ({
  onSubmit,
  setInput,
  input,
  disabled = false,
  loading = false,
  messages,
  setMessages,
  speaking,
} : ChatInputProps) => {

  // const [isTyping, setIsTyping] = useState(false);
  const { handleToggle, isTyping } = useMicrophone();


  // const handleToggle = (type : string) => {
  //   if(type === 'typing'){
  //     shutdownMicrophone();
  //   }
  //   else{
  //     setupMicrophone();
  //   }
  //   setIsTyping((prev) => !prev);
  // };

  function handleSubmit() {
    if (input.trim() === "") {
      return;
    }
    setMessages((prevMessages:any) => [
      ...prevMessages,
      {
        user: 'user',
        message: input,
      }
    ]);
    onSubmit(input);
    setInput("");
  }

  return (
    <div className=" h-[40px] w-full max-w-[400px] rounded-lg overflow-hidden">
      {!isTyping ? (
        <div className='w-[350px] h-full flex items-center rounded-lg '>
          <div className='flex w-full gap-4 items-center justify-center h-full bg-gradient-to-r from-purple-600 to-blue-500'>
            <div className='flex justify-between'>
              {/* {
                speaking ?  */}
                {/* <div className="flex items-center justify-center gap-1">
                  <Image
                    alt={'wav gif'}
                    src={'/streaming-listening.gif'}
                    width={200}
                    height={30}
                  />
                </div> 
                : */}
                <div className="flex items-center justify-center gap-1">
                  {[...Array(10)].map((_, index) => (
                    <div
                      key={index}
                      className="h-2 w-2 rounded-full bg-white animate-pulse"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    />
                  ))}
                </div>
              
            </div>
          </div>
          <Tooltip content="Keyboard">
            <button
              onClick={()=>handleToggle('typing')}
              className="h-8 w-8 rounded-md text-white flex items-center justify-center ml-4"
            >
              <Keyboard size={32} />
            </button>
          </Tooltip>
        </div>
      ) : (
        <div className='w-[350px] h-full flex items-center rounded-lg '>
          <div className='flex w-full gap-4 items-center justify-center h-full bg-white px-4'>
            <div className='flex justify-between'>
              <input
                type="text"
                placeholder="Let’s chat!"
                value={input}
                onChange={(e)=> setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                className="w-full flex-grow border-none outline-none text-gray-600 bg-transparent"
              />
              <div className='cursor-pointer' onClick={handleSubmit}>
                <PaperPlaneRight className='text-gray-500' size={28} />
              </div>
            </div>
          </div>
          <Tooltip content="Start Mic">
            <button
              onClick={()=>handleToggle('mic')}
              className="h-8 w-8 rounded-md text-red-600 flex items-center justify-center ml-4"
            >
              <Microphone size={32} />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default ChatInput;


{/* <div className='flex gap-4 w-[350px] items-center'>
          <div className="w-full h-full rounded-lg flex items-center justify-between bg-white px-4">
            <input
              type="text"
              placeholder="Let’s chat!"
              className="flex-grow border-none outline-none text-gray-600 bg-transparent"
            />
          </div>
          <button
            onClick={handleToggle}
            className="h-8 w-8 rounded-md bg-red-500 text-white flex items-center justify-center ml-4"
          >
            ⏹️
          </button>
        </div> */}
