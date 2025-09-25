"use client";
import { useEffect, useState } from "react";

export default function GroupChat({ username }: { username: string }) {
  const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const es = new EventSource("https://testing-chats.netlify.app/chat");
    es.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages(prev => [...prev, msg]);
    };
    return () => es.close();
  }, []);

  const sendMessage = async () => {
    if (!text) return;
    await fetch("/api/group-chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: username, text }),
    });
    setText("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="h-64 overflow-y-auto border p-2">
        {messages.map((m, i) => (
          <div key={i}><b>{m.user}:</b> {m.text}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="border p-1 flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="bg-blue-500 text-white px-3" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
