import { clients, messages, SSEClient, AnonMessage } from "../state";

export async function GET() {
  let client: SSEClient;

  const stream = new ReadableStream({
    start(controller) {
      try {
        const encoder = new TextEncoder();
        client = { enqueue: controller.enqueue.bind(controller) };
        clients.push(client);

        // Send connection confirmation
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'connection', 
            message: 'Connected to chat', 
            timestamp: Date.now() 
          })}\n\n`)
        );

        // Send all previous messages to new client
        messages.forEach(msg => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
          } catch (error) {
            console.error("Error sending previous message:", error);
          }
        });
      } catch (error) {
        console.error("Error starting SSE stream:", error);
        controller.error(error);
      }
    },
    cancel() {
      try {
        // Remove disconnected client
        const index = clients.findIndex(c => c === client);
        if (index !== -1) {
          clients.splice(index, 1);
        }
      } catch (error) {
        console.error("Error during SSE cleanup:", error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function broadcast(message: AnonMessage) {
  const encoder = new TextEncoder();
  clients.forEach(client => {
    try {
      client.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
    } catch (error) {
      console.error('Error broadcasting to client:', error);
      // Remove failed client
      const index = clients.findIndex(c => c === client);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message: AnonMessage = {
      text: body.text,
      timestamp: body.timestamp || Date.now(),
      color: body.color,
      id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    // Validate anonymous message
    if (!message.text?.trim() || !message.color) {
      return new Response(
        JSON.stringify({ error: "Invalid message format" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Sanitize and limit message text
    message.text = message.text.trim().substring(0, 500);
    
    // Limit message history to prevent memory issues
    if (messages.length >= 1000) {
      messages.splice(0, messages.length - 999);
    }
    
    messages.push(message);
    broadcast(message);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: message.id,
        totalMessages: messages.length 
      }),
      {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error processing message:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process message" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
