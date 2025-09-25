"use client";
import { useEffect, useState, useRef } from "react";

interface ChatMessage {
  user: string;
  text: string;
  timestamp: number;
}

export default function GroupChat({ username }: { username: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const connectEventSource = () => {
      setIsConnecting(true);
      const es = new EventSource("/api/group-chat/stream");
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
      };

      es.onmessage = (event) => {
        try {
          const msg: ChatMessage = JSON.parse(event.data);
          setMessages(prev => [...prev, msg]);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        setIsConnecting(false);
        es.close();
        // Attempt to reconnect after 3 seconds
        setTimeout(connectEventSource, 3000);
      };
    };

    connectEventSource();

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const sendMessage = async () => {
    if (!text.trim() || !isConnected) return;

    try {
      const response = await fetch("/api/group-chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: username,
          text: text.trim(),
          timestamp: Date.now(),
        }),
      });

      if (response.ok) {
        setText("");
      } else {
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConnectionStatus = () => {
    if (isConnecting) return { text: "Connecting...", color: "text-yellow-500" };
    if (isConnected) return { text: "Connected", color: "text-green-500" };
    return { text: "Reconnecting...", color: "text-red-500" };
  };

  const status = getConnectionStatus();

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Connection status */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnecting ? 'animate-pulse' : ''}`}></div>
        <span className={`text-sm ${status.color}`}>{status.text}</span>
        <span className="text-sm text-gray-500 ml-auto">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Messages container */}
      <div className="flex-1 h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, i) => (
              <div key={i} className={`flex flex-col ${message.user === username ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.user === username 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border border-gray-200'
                }`}>
                  {message.user !== username && (
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      {message.user}
                    </div>
                  )}
                  <div className="break-words">{message.text}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp ? formatTime(message.timestamp) : 'Just now'}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-3">
        <textarea
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          rows={1}
          disabled={!isConnected}
        />
        <button
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isConnected && text.trim()
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={sendMessage}
          disabled={!isConnected || !text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}