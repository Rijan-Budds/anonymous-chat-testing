"use client";
import { useEffect, useState, useRef } from "react";

interface AnonMessage {
  text: string;
  timestamp: number;
  color: string;
  id?: string;
}

export default function AnonymousChat() {
  const [messages, setMessages] = useState<AnonMessage[]>([]);
  const [text, setText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [userColor, setUserColor] = useState<string>("");
  const [joinTimestamp, setJoinTimestamp] = useState<number>(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [showJoinNotification, setShowJoinNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Anonymous user grayscale patterns
const ANON_PATTERNS = [
  '#FF6B6B', // Red
  '#FFB347', // Orange
  '#FFD93D', // Yellow
  '#6BCB77', // Green
  '#4D96FF', // Blue
  '#845EC2', // Purple
  '#FF63A5', // Pink
  '#00C9A7', // Teal
  '#FF9F1C', // Amber
  '#FF3F7F'  // Magenta
];


  // Generate user pattern and set join timestamp on mount
  useEffect(() => {
    const randomPattern = ANON_PATTERNS[Math.floor(Math.random() * ANON_PATTERNS.length)];
    const joinTime = Date.now();
    setUserColor(randomPattern);
    setJoinTimestamp(joinTime);
  }, []);

  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      if (smooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  const checkScrollPosition = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      // Calculate scroll percentage
      const maxScroll = scrollHeight - clientHeight;
      const percentage = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      
      setIsAtBottom(isNearBottom);
      setShowScrollToBottom(!isNearBottom && messages.length > 0);
      setScrollPercentage(Math.round(percentage));
    }
  };

  useEffect(() => {
    // Only auto-scroll if user is at the bottom or it's the first message
    if (isAtBottom || messages.length === 1) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition(); // Initial check
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, [messages]);

  useEffect(() => {
    const connectEventSource = () => {
      setIsConnecting(true);
      const es = new EventSource("/api/group-chat/stream");
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        // Show join notification briefly
        setShowJoinNotification(true);
        setTimeout(() => setShowJoinNotification(false), 3000);
      };

      es.onmessage = (event) => {
        try {
          const msg: AnonMessage = JSON.parse(event.data);
          // Only add actual chat messages, not connection confirmations
          // And only show messages sent after user joined
          if (msg.text && msg.color && msg.timestamp >= joinTimestamp) {
            setMessages(prev => [...prev, msg]);
          }
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
    if (!text.trim() || !isConnected || !userColor) return;

    try {
      const response = await fetch("/api/group-chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          timestamp: Date.now(),
          color: userColor,
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

  // Add keyboard shortcuts for scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target === document.body || (e.target as HTMLElement).tagName === 'DIV') {
        switch (e.key) {
          case 'End':
            e.preventDefault();
            scrollToBottom(true);
            break;
          case 'Home':
            e.preventDefault();
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
            break;
          case 'PageDown':
            e.preventDefault();
            if (messagesContainerRef.current) {
              const container = messagesContainerRef.current;
              container.scrollBy({ top: container.clientHeight * 0.8, behavior: 'smooth' });
            }
            break;
          case 'PageUp':
            e.preventDefault();
            if (messagesContainerRef.current) {
              const container = messagesContainerRef.current;
              container.scrollBy({ top: -container.clientHeight * 0.8, behavior: 'smooth' });
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConnectionStatus = () => {
    if (isConnecting) return { text: "CONNECTING", color: "text-gray-600", dot: "bg-gray-600 animate-pulse" };
    if (isConnected) return { text: "CONNECTED", color: "text-black", dot: "bg-black" };
    return { text: "RECONNECTING", color: "text-gray-800", dot: "bg-gray-800 animate-pulse" };
  };

  const status = getConnectionStatus();

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {/* Connection status */}
      <div className="flex items-center justify-between mb-8 p-6 bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-4">
          <div className={`w-2 h-2 ${status.dot}`}></div>
          <span className={`text-xs font-light uppercase tracking-widest ${status.color}`}>{status.text}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-light">Identity:</span>
            <div 
              className="w-4 h-4 border border-gray-400" 
              style={{ backgroundColor: userColor }}
            ></div>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-light">
            {messages.length} {messages.length === 1 ? 'Message' : 'Messages'} Since Joining
          </span>
          {messages.length > 0 && (
            <>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-light">Scroll:</span>
                <div className="w-16 h-2 bg-gray-200 border border-gray-300">
                  <div 
                    className="h-full bg-black transition-all duration-150"
                    style={{ width: `${scrollPercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 font-light w-8 text-right">{scrollPercentage}%</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages container */}
      <div className="relative">
        <div 
          ref={messagesContainerRef}
          className="flex-1 h-96 overflow-y-auto mb-8 bg-white border-2 border-gray-200 scrollbar-thin scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages.length === 0 ? (
          <div className="text-center text-gray-400 p-16">
            <div className="w-16 h-16 border-2 border-gray-300 mx-auto mb-6 flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-300"></div>
            </div>
            <p className="text-xl font-light uppercase tracking-wide mb-2">You&apos;ve Joined</p>
            <div className="w-24 h-px bg-gray-300 mx-auto mb-4"></div>
            <p className="text-sm uppercase tracking-widest font-light mb-2">Listening for new messages</p>
            <p className="text-xs text-gray-300 font-light">You&apos;ll only see messages sent after you joined</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {messages.map((message, i) => (
              <div 
                key={i} 
                className={`flex flex-col ${message.color === userColor ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-md px-6 py-4 relative ${
                  message.color === userColor 
                    ? 'bg-black text-white border border-black' 
                    : 'bg-gray-100 text-black border border-gray-300'
                }`}>
                  {/* User pattern indicator */}
                  <div 
                    className="absolute -top-2 -left-2 w-6 h-6 border border-gray-400" 
                    style={{ backgroundColor: message.color }}
                  ></div>
                  
                  <div className="break-words leading-relaxed font-light">
                    {message.text}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-3 px-2 uppercase tracking-wider font-light">
                  {message.timestamp ? formatTime(message.timestamp) : 'Now'}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        </div>
        
        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-16 right-4 w-12 h-12 bg-black text-white border border-gray-300 hover:bg-gray-900 transition-all duration-200 shadow-lg"
            title="Scroll to bottom"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
        
        {/* Join notification */}
        {showJoinNotification && (
          <div className="absolute top-4 left-4 right-4 text-center z-10">
            <div className="inline-block bg-black text-white px-6 py-3 text-sm uppercase tracking-wider font-light border border-gray-300 shadow-lg">
              Joined • Only seeing new messages
            </div>
          </div>
        )}
        
        {/* New message indicator */}
        {!isAtBottom && messages.length > 0 && !showJoinNotification && (
          <div className="absolute top-4 left-4 right-4 text-center">
            <div className="inline-block bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-light border border-gray-700">
              New messages below
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t-2 border-gray-200 pt-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <textarea
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-300 focus:outline-none focus:border-black focus:bg-white resize-none text-black placeholder-gray-400 font-light transition-all duration-200"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Express your thoughts anonymously..."
              rows={3}
              disabled={!isConnected}
              maxLength={500}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-light">
              {text.length}/500
            </div>
          </div>
          <button
            className={`px-8 py-4 font-light uppercase tracking-widest text-sm transition-all duration-300 ${
              isConnected && text.trim()
                ? 'bg-black text-white hover:bg-gray-900 border border-black'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200'
            }`}
            onClick={sendMessage}
            disabled={!isConnected || !text.trim()}
          >
            Send
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-6">
        <div className="flex justify-center items-center space-x-8 text-xs text-gray-400 uppercase tracking-wider font-light mb-3">
          <span>Anonymous</span>
          <div className="w-1 h-1 bg-gray-400"></div>
          <span>No History</span>
          <div className="w-1 h-1 bg-gray-400"></div>
          <span>Private</span>
        </div>
        {messages.length > 3 && (
          <div className="text-center text-xs text-gray-400 font-light">
            <div className="flex justify-center items-center space-x-6">
              <span>Home: Top</span>
              <div className="w-1 h-1 bg-gray-300"></div>
              <span>End: Bottom</span>
              <div className="w-1 h-1 bg-gray-300"></div>
              <span>PgUp/PgDn: Scroll</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}