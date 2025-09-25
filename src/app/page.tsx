"use client";

import { useState } from "react";
import GroupChat from "./chat/GroupChat";

export default function ChatApp() {
  const [username, setUsername] = useState<string>("");
  const [isJoined, setIsJoined] = useState(false);

  const joinChat = () => {
    if (username.trim()) {
      setIsJoined(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      joinChat();
    }
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Join Chat Room
          </h1>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={joinChat}
              disabled={!username.trim()}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Join Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md">
          <div className="bg-blue-500 text-white p-4 rounded-t-lg">
            <h1 className="text-xl font-bold">Chat Room</h1>
            <p className="text-blue-100">Welcome, {username}!</p>
          </div>
          <div className="p-6">
            <GroupChat username={username} />
          </div>
        </div>
      </div>
    </div>
  );
}
