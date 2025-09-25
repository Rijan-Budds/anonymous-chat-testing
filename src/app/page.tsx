"use client";

import { useState } from "react";
import AnonymousChat from "./chat/AnonymousChat";

export default function ChatApp() {
  const [isJoined, setIsJoined] = useState(false);

  const joinChat = () => {
    setIsJoined(true);
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-white border border-gray-300 shadow-2xl p-12 w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-20 h-20 border-2 border-black bg-black mx-auto mb-6 flex items-center justify-center">
              <div className="w-3 h-3 bg-white"></div>
            </div>
            <h1 className="text-4xl font-light text-black mb-3 tracking-wide">
              ANONYMOUS
            </h1>
            <div className="w-24 h-px bg-black mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm uppercase tracking-widest">
              Private Conversations
            </p>
          </div>
          <button
            onClick={joinChat}
            className="w-full bg-black text-white py-4 px-6 hover:bg-gray-900 transition-all duration-300 font-light uppercase tracking-widest text-sm border border-black hover:shadow-lg"
          >
            Enter
          </button>
          <div className="flex justify-center items-center mt-6 space-x-8 text-xs text-gray-400 uppercase tracking-wider">
            <span>Anonymous</span>
            <div className="w-1 h-1 bg-gray-400"></div>
            <span>Real-time</span>
            <div className="w-1 h-1 bg-gray-400"></div>
            <span>Private</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white border border-gray-300 shadow-2xl">
          <div className="bg-black text-white p-8 border-b border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light tracking-wide uppercase">
                  Anonymous
                </h1>
                <div className="w-16 h-px bg-white mt-2 mb-3"></div>
                <p className="text-gray-300 text-sm uppercase tracking-widest font-light">Private Conversations</p>
              </div>
              <div className="w-12 h-12 border border-white bg-white flex items-center justify-center">
                <div className="w-2 h-2 bg-black"></div>
              </div>
            </div>
          </div>
          <div className="p-8">
            <AnonymousChat />
          </div>
        </div>
      </div>
    </div>
  );
}
