import { clients, messages } from "../group-chat/state";

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    stats: {
      activeConnections: clients.length,
      totalMessages: messages.length,
      memoryUsage: process.memoryUsage(),
    },
    version: process.env.npm_package_version || "1.0.0",
  };

  return new Response(JSON.stringify(health, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });
}