import { clients, messages, SSEClient, ChatMessage } from "../state";

export async function GET() {
  let client: SSEClient;

  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        client = { enqueue: controller.enqueue.bind(controller) };
        clients.push(client);

        // Send all previous messages to new client
        messages.forEach(msg => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
        });
      },
      cancel() {
        // Remove disconnected client
        const index = clients.findIndex(c => c === client);
        if (index !== -1) {
          clients.splice(index, 1);
        }
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    }
  );
}

function broadcast(message: ChatMessage) {
  const encoder = new TextEncoder();
  clients.forEach(client => {
    client.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
  });
}

export async function POST(req: Request) {
  const message: ChatMessage = await req.json();
  messages.push(message);
  broadcast(message);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
