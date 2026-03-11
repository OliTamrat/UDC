"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTheme } from "@/context/ThemeContext";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Send,
  Bot,
  User,
  Loader2,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  Trash2,
} from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "What's the current water quality at Anacostia Park?",
  "Which stations have the highest E. coli levels?",
  "Explain the seasonal DO trends in the Anacostia River",
  "How do CSOs affect Wards 7 and 8 water quality?",
  "What green infrastructure projects is UDC researching?",
  "Compare water quality across all monitoring stations",
];

export default function ResearchAssistant() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Check if API key is configured
  useEffect(() => {
    if (isOpen && hasApiKey === null) {
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      })
        .then((r) => setHasApiKey(r.status !== 503))
        .catch(() => setHasApiKey(false));
    }
  }, [isOpen, hasApiKey]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || isLoading) return;
      setInput("");
      await sendMessage({ text: msg });
    },
    [input, isLoading, sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 group ${
          isOpen
            ? isDark
              ? "bg-panel-bg border border-panel-border text-slate-300"
              : "bg-white border border-slate-200 text-slate-600"
            : "bg-gradient-to-r from-udc-gold to-udc-red text-white hover:shadow-xl hover:scale-105"
        }`}
        aria-label={isOpen ? "Close AI assistant" : "Open AI research assistant"}
      >
        {isOpen ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">AI Assistant</span>
            {messages.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-20 left-3 right-3 sm:left-auto sm:right-5 z-50 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
      >
        <div
          className={`w-full sm:w-[420px] h-[560px] sm:h-[600px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
            isDark
              ? "bg-panel-bg border-panel-border"
              : "bg-white border-slate-200"
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
              isDark ? "border-panel-border" : "border-slate-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3
                  className={`text-sm font-semibold leading-tight ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Research Assistant
                </h3>
                <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Powered by Claude AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? "hover:bg-panel-hover text-slate-400" : "hover:bg-slate-100 text-slate-500"
                  }`}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? "hover:bg-panel-hover text-slate-400" : "hover:bg-slate-100 text-slate-500"
                }`}
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* API key not configured */}
            {hasApiKey === false && (
              <div
                className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${
                  isDark
                    ? "border-amber-500/30 bg-amber-950/30 text-amber-300"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold mb-1">AI Assistant Not Configured</p>
                  <p>
                    Set <code className="font-mono">ANTHROPIC_API_KEY</code> in your
                    environment variables to enable the research assistant.
                  </p>
                </div>
              </div>
            )}

            {/* Welcome message */}
            {messages.length === 0 && hasApiKey !== false && (
              <div className="space-y-4">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div
                    className={`text-sm leading-relaxed ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    <p className="mb-2">
                      Hi! I&apos;m the UDC Water Resources Research Assistant. I can help you:
                    </p>
                    <ul className="space-y-1 text-xs mb-3">
                      <li>Analyze water quality data across 12 monitoring stations</li>
                      <li>Explain trends, flag anomalies, and interpret EPA thresholds</li>
                      <li>Answer questions about WRRI research and green infrastructure</li>
                      <li>Guide you through environmental justice data for DC wards</li>
                    </ul>
                    <p className="text-xs opacity-75">Try one of the questions below, or ask your own:</p>
                  </div>
                </div>

                {/* Suggested questions */}
                <div className="flex flex-wrap gap-1.5 pl-9">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-full border transition-colors text-left ${
                        isDark
                          ? "border-panel-border text-slate-400 hover:bg-panel-hover hover:text-slate-200"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message thread */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2.5 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    message.role === "user"
                      ? isDark
                        ? "bg-blue-600/20 text-blue-400"
                        : "bg-blue-100 text-blue-600"
                      : "bg-gradient-to-br from-udc-gold to-udc-red"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-white" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? isDark
                        ? "bg-blue-600/20 text-blue-100"
                        : "bg-blue-600 text-white"
                      : isDark
                        ? "bg-panel-hover text-slate-300"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {message.parts?.map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <div
                          key={i}
                          className="prose prose-sm max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-1 [&>ul]:pl-4 [&>ol]:my-1 [&>ol]:pl-4 [&>li]:my-0.5"
                          dangerouslySetInnerHTML={{
                            __html: formatMarkdown(part.text),
                          }}
                        />
                      );
                    }
                    if (part.type?.startsWith("tool-")) {
                      const toolPart = part as { type: string; state?: string; toolCallId?: string };
                      const isResult = toolPart.state === "result";
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 text-[10px] my-1 py-1 px-2 rounded-md ${
                            isDark ? "bg-white/5 text-slate-500" : "bg-white/50 text-slate-400"
                          }`}
                        >
                          <Loader2 className={`w-3 h-3 ${isResult ? "" : "animate-spin"}`} />
                          {isResult ? "Retrieved station data" : "Querying station data..."}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}

            {/* Streaming indicator */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-udc-gold to-udc-red flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div
                  className={`rounded-xl px-3.5 py-2.5 ${
                    isDark ? "bg-panel-hover" : "bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-udc-gold animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-udc-gold animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-udc-gold animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${
                  isDark
                    ? "border-red-500/30 bg-red-950/30 text-red-300"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Something went wrong. Please try again.</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className={`border-t px-3 py-3 shrink-0 ${
              isDark ? "border-panel-border" : "border-slate-100"
            }`}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  hasApiKey === false
                    ? "API key required..."
                    : "Ask about water quality data..."
                }
                disabled={hasApiKey === false || isLoading}
                rows={1}
                className={`flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none transition-colors min-h-[40px] max-h-[100px] ${
                  isDark
                    ? "bg-udc-dark/50 border-panel-border text-slate-300 placeholder:text-slate-600 focus:border-udc-blue/50"
                    : "bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-blue-400"
                } disabled:opacity-50`}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading || hasApiKey === false}
                className={`p-2.5 rounded-xl transition-all shrink-0 ${
                  input.trim() && !isLoading
                    ? "bg-gradient-to-r from-udc-gold to-udc-red text-white hover:shadow-lg"
                    : isDark
                      ? "bg-panel-hover text-slate-600"
                      : "bg-slate-100 text-slate-400"
                } disabled:cursor-not-allowed`}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p
              className={`text-[9px] mt-1.5 text-center ${
                isDark ? "text-slate-600" : "text-slate-400"
              }`}
            >
              AI responses may contain errors. Verify with official data sources.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Minimal markdown to HTML for chat messages.
 * Handles bold, italic, code, links, and line breaks.
 */
function formatMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-black/10 text-xs font-mono">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="underline" target="_blank" rel="noopener">$1</a>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^(.+)$/, "<p>$1</p>");
}
