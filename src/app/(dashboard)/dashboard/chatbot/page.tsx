"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, MessageSquare, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { VoiceInput } from "@/components/VoiceInput";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const LANGUAGES = [
  { code: "en", label: "English", speechCode: "en-US" },
  { code: "hi", label: "Hindi", speechCode: "hi-IN" },
  { code: "ta", label: "Tamil", speechCode: "ta-IN" },
  { code: "te", label: "Telugu", speechCode: "te-IN" },
  { code: "bn", label: "Bengali", speechCode: "bn-IN" },
  { code: "mr", label: "Marathi", speechCode: "mr-IN" },
  { code: "pa", label: "Punjabi", speechCode: "pa-Guru-IN" },
  { code: "gu", label: "Gujarati", speechCode: "gu-IN" },
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI farming assistant. Ask me anything about crops, diseases, weather, or farming practices. I'm here to help!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput(text);
  }, []);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language, sessionId }),
      });
      if (!res.ok) {
        throw new Error("Failed to get response");
      }
      const data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl flex flex-col h-[calc(100vh-10rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">AI Farming Chatbot</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ask farming questions in your preferred language.
        </p>
      </div>

      {/* Language Selector */}
      <div className="flex items-center gap-3 mb-4">
        <Label htmlFor="language" className="shrink-0">Language:</Label>
        <Select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="max-w-[180px]"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white border border-green-100 rounded-xl p-4 space-y-4 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" ? "bg-green-600" : "bg-gray-100"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-green-600 text-white rounded-tr-none"
                  : "bg-gray-100 text-gray-800 rounded-tl-none"
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.role === "user" ? "text-green-200" : "text-gray-400"
                }`}
              >
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested queries */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {[
          "Best crops for clay soil?",
          "How to treat leaf blight?",
          "Irrigation schedule for wheat?",
        ].map((q) => (
          <button
            key={q}
            onClick={() => { setInput(q); }}
            className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 hover:bg-green-100 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 mt-3">
        <div className="relative flex-1">
          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={`Message in ${currentLang.label}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="pl-9 pr-4"
            disabled={loading}
          />
        </div>
        <VoiceInput onTranscript={handleVoiceTranscript} language={currentLang.speechCode} />
        <Button type="submit" disabled={!input.trim() || loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
