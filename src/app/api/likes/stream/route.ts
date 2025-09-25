

interface SSEClient {
  enqueue: (chunk: Uint8Array) => void;
}

// Store connected clients and the counter
let clients: SSEClient[] = [];
let count = 0;

export async function GET() {
  let client: SSEClient;

  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Register this client
        client = { enqueue: controller.enqueue.bind(controller) };
        clients.push(client);

        // Send initial count
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count })}\n\n`));
      },
      cancel() {
        // Remove disconnected client
        clients = clients.filter(c => c !== client);
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

// Helper: broadcast count to all clients
function broadcast() {
  const encoder = new TextEncoder();
  clients.forEach((client) => {
    client.enqueue(encoder.encode(`data: ${JSON.stringify({ count })}\n\n`));
  });
}

// POST endpoint to increment the count
export async function POST() {
  count++;
  broadcast();

  return new Response(JSON.stringify({ count }), {
    headers: { "Content-Type": "application/json" },
  });
}
