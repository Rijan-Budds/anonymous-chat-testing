// Anonymous chat API compatible with Netlify
import { NextRequest } from 'next/server';

// Simple in-memory storage (will reset on cold starts)
let messages: Array<{
  id: string;
  text: string;
  timestamp: number;
  color: string; // For anonymous user identification
}> = [];

let messageCounter = 0;

// Predefined colors for anonymous users
const ANON_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D2B4DE'
];

// Generate random color for anonymous user
function getRandomColor(): string {
  return ANON_COLORS[Math.floor(Math.random() * ANON_COLORS.length)];
}

// GET - Fetch messages (polling endpoint)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const since = url.searchParams.get('since');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    let filteredMessages = messages;
    
    // Filter messages since timestamp if provided
    if (since) {
      const sinceTimestamp = parseInt(since);
      filteredMessages = messages.filter(msg => msg.timestamp > sinceTimestamp);
    }
    
    // Limit results and get most recent
    filteredMessages = filteredMessages.slice(-limit);
    
    return new Response(JSON.stringify({
      messages: filteredMessages,
      timestamp: Date.now(),
      total: messages.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch messages',
      messages: [],
      timestamp: Date.now(),
      total: 0
    }), {
      status: 200, // Still return 200 to avoid breaking the UI
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST - Send anonymous message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.text?.trim()) {
      return new Response(JSON.stringify({ error: 'Message cannot be empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Limit message length
    const text = body.text.trim().substring(0, 500);
    
    const message = {
      id: `msg_${messageCounter++}_${Date.now()}`,
      text: text,
      timestamp: Date.now(),
      color: body.color || getRandomColor(), // Use provided color or generate new one
    };
    
    messages.push(message);
    
    // Keep only last 100 messages to prevent memory issues
    if (messages.length > 100) {
      messages = messages.slice(-100);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message,
      total: messages.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return new Response(JSON.stringify({ error: 'Failed to send message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}