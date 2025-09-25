"use client";

import { useEffect, useState } from "react";

export default function LikeButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const eventSource = new EventSource("/api/likes/stream");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCount(data.count);
    };

    return () => eventSource.close();
  }, []);

  const handleLike = async () => {
    await fetch("/api/likes/stream", { method: "POST" });
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={handleLike}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Like
      </button>
      <p className="text-lg font-medium">Likes: {count}</p>
    </div>
  );
}
