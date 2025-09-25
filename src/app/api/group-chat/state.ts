export interface SSEClient {
  enqueue: (chunk: Uint8Array) => void;
}

export interface AnonMessage {
  text: string;
  timestamp: number;
  color: string;
  id?: string;
}

export const clients: SSEClient[] = [];
export const messages: AnonMessage[] = [];
