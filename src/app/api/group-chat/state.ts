export interface SSEClient {
  enqueue: (chunk: Uint8Array) => void;
}

export interface ChatMessage {
  user: string;
  text: string;
  timestamp: number;
}

export const clients: SSEClient[] = [];
export const messages: ChatMessage[] = [];
