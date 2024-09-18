import { MicrophoneState, useMicrophone } from "@/app/context/MicrophoneContextProvider";
import { Button, Input, Spinner, Tooltip } from "@nextui-org/react";
import {  Microphone, MicrophoneStage, PaperPlaneRight } from "@phosphor-icons/react";
import clsx from "clsx";

interface StreamingAvatarTextInputProps {
  label: string;
  placeholder: string;
  input: string;
  onSubmit: (text:string) => void;
  setInput: (value: string) => void;
  endContent?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  setMessages : any;
  messages: any;
}

export default function InteractiveAvatarTextInput({
  label,
  placeholder,
  input,
  onSubmit,
  setInput,
  endContent,
  disabled = false,
  loading = false,
  messages,
  setMessages
}: StreamingAvatarTextInputProps) {

  const { microphone, startMicrophone, microphoneState, stopMicrophone } =
    useMicrophone();

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
    <Input
      endContent={
        <div className="flex flex-row items-center h-full">
          {endContent}
          <Tooltip content="Send message">
            {loading ? (
              <Spinner
                className="text-indigo-300 hover:text-indigo-200"
                size="sm"
                color="default"
              />
            ) : (
              <>
              <button
                type="submit"
                className="focus:outline-none"
                onClick={handleSubmit}
              >
                <PaperPlaneRight
                  className={clsx(
                    "text-indigo-300 hover:text-indigo-200",
                    disabled && "opacity-50"
                  )}
                  size={24}
                />
              </button>

              <Button
                  onClick={microphone?.state === "recording" ? stopMicrophone : startMicrophone}
                  isIconOnly
                  className={clsx(
                    "mx-1 text-white",
                    microphone?.state === "recording"
                      ? "bg-gradient-to-tr from-indigo-500 to-indigo-300"
                      : ""
                  )}
                  size="sm"
                  variant="shadow"
                >
                  {microphone?.state === "recording" ? (
                    <Microphone size={20} />
                  ) : (
                    <>
                      <div className="absolute h-full w-full bg-gradient-to-tr from-indigo-500 to-indigo-300 animate-pulse -z-10"></div>
                      <MicrophoneStage size={20} />
                    </>
                  )}
                </Button>

              </>
            )}
          </Tooltip>
        </div>
      }
      label={label}
      placeholder={placeholder}
      size="sm"
      value={input}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleSubmit();
        }
      }}
      onValueChange={setInput}
      isDisabled={disabled}
    />
  );
}
