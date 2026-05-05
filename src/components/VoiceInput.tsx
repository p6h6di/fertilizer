"use client";
import { useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language?: string;
}

export function VoiceInput({ onTranscript, language = "en-US" }: VoiceInputProps) {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  useEffect(() => {
    if (transcript) onTranscript(transcript);
  }, [transcript, onTranscript]);

  if (!browserSupportsSpeechRecognition) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (listening) {
          SpeechRecognition.stopListening();
        } else {
          resetTranscript();
          SpeechRecognition.startListening({ language, continuous: false });
        }
      }}
      className={`p-2 rounded-full transition-colors ${
        listening
          ? "bg-red-500 text-white animate-pulse"
          : "bg-green-100 text-green-700 hover:bg-green-200"
      }`}
      title={listening ? "Stop listening" : "Start voice input"}
    >
      {listening ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
}
