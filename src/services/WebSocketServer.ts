import WebSocket from 'ws';
import { insertMessage } from './DatabaseService';
import { SecurityService } from './SecurityService';

const WS_PORT = 8080;
let wss: WebSocket.Server;
let messageInterval: NodeJS.Timeout;

export interface NewMessageEvent {
  chatId: number;
  messageId: number;
  ts: number;
  sender: string;
  body: string;
}

export function startWebSocketServer(): void {
  wss = new WebSocket.Server({ port: WS_PORT });
  
  console.info(`WebSocket server started on port ${WS_PORT}`);
  
  wss.on('connection', (ws: WebSocket) => {
    console.info('Client connected to WebSocket server');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        handleClientMessage(ws, data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.info('Client disconnected from WebSocket server');
    });
    
    ws.on('pong', () => {
      // Client responded to ping
    });
  });
  
  // Start periodic message generator
  startMessageGenerator();
}

function handleClientMessage(ws: WebSocket, data: any): void {
  if (data.type === 'ping') {
    ws.send(JSON.stringify({ type: 'pong' }));
  } else if (data.type === 'simulate_disconnect') {
    // Simulate connection drop
    ws.close();
  }
}

function startMessageGenerator(): void {
  const generateAndBroadcast = () => {
    if (wss.clients.size === 0) {
      return; // No clients connected
    }
    
    // Generate random message
    const chatId = Math.floor(Math.random() * 200) + 1;
    const ts = Date.now();
    const senders = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Server'];
    const sender = senders[Math.floor(Math.random() * senders.length)];
    const body = generateRandomMessage();
    
    // Insert into database
    const messageId = insertMessage(chatId, ts, sender, body);
    
    // Broadcast to all connected clients
    const event: NewMessageEvent = {
      chatId,
      messageId,
      ts,
      sender,
      body
    };
    
    // Log without exposing message body
    console.info('New message generated:', SecurityService.sanitizeForLog(event));
    
    broadcastMessage(event);
    
    // Schedule next message
    messageInterval = setTimeout(generateAndBroadcast, getRandomInterval());
  };
  
  // Start the first generation
  messageInterval = setTimeout(generateAndBroadcast, getRandomInterval());
}

function getRandomInterval(): number {
  // Random interval between 1-3 seconds
  return Math.floor(Math.random() * 2000) + 1000;
}

function generateRandomMessage(): string {
  const messages = [
    'New update available!',
    'Check out this feature',
    'Meeting reminder',
    'Task completed',
    'Please review this',
    'Thanks for the update',
    'Got it!',
    'On my way',
    'Will do',
    'Sounds good'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function broadcastMessage(event: NewMessageEvent): void {
  const message = JSON.stringify({
    type: 'new_message',
    data: event
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function stopWebSocketServer(): void {
  if (messageInterval) {
    clearTimeout(messageInterval);
  }
  if (wss) {
    wss.close();
  }
}
