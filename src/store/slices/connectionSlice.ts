import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch } from '../store';
import { addNewMessage } from './messagesSlice';
import { updateChatFromMessage } from './chatsSlice';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

interface ConnectionState {
  status: ConnectionStatus;
  reconnectAttempts: number;
  lastPingTime: number | null;
}

const initialState: ConnectionState = {
  status: 'disconnected',
  reconnectAttempts: 0,
  lastPingTime: null,
};

let ws: WebSocket | null = null;
let pingInterval: NodeJS.Timeout | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

const MAX_RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL = 10000; // 10 seconds
const BASE_RECONNECT_DELAY = 1000; // 1 second

// Exponential backoff calculation
function getReconnectDelay(attempt: number): number {
  return Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), 30000); // Max 30 seconds
}

export const connectWebSocket = () => (dispatch: AppDispatch) => {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }

  dispatch(setStatus('connecting'));

  ws = new WebSocket('ws://localhost:8080');

  ws.onopen = () => {
    console.info('WebSocket connected');
    dispatch(setStatus('connected'));
    dispatch(resetReconnectAttempts());
    startPing(dispatch);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        const message = data.data;
        dispatch(addNewMessage(message));
        dispatch(updateChatFromMessage({ chatId: message.chatId, ts: message.ts }));
      } else if (data.type === 'pong') {
        dispatch(updateLastPing(Date.now()));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.info('WebSocket disconnected');
    stopPing();
    dispatch(setStatus('disconnected'));
    attemptReconnect(dispatch);
  };
};

function startPing(dispatch: AppDispatch) {
  if (pingInterval) {
    clearInterval(pingInterval);
  }

  pingInterval = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, PING_INTERVAL);
}

function stopPing() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

function attemptReconnect(dispatch: AppDispatch) {
  return (attemptNumber: number = 0) => {
    if (attemptNumber >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnect attempts reached');
      dispatch(setStatus('disconnected'));
      return;
    }

    const delay = getReconnectDelay(attemptNumber);
    dispatch(setStatus('reconnecting'));
    dispatch(incrementReconnectAttempts());

    reconnectTimeout = setTimeout(() => {
      console.info(`Reconnection attempt ${attemptNumber + 1}/${MAX_RECONNECT_ATTEMPTS}`);
      dispatch(connectWebSocket());
    }, delay);
  };
}

export const simulateDisconnect = () => (dispatch: AppDispatch) => {
  // Clear any pending reconnection
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  // Close WebSocket and prevent auto-reconnect
  if (ws) {
    ws.onclose = null; // Prevent auto-reconnect
    ws.close();
    ws = null;
  }
  
  stopPing();
  dispatch(setStatus('disconnected'));
  dispatch(resetReconnectAttempts());
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.status = action.payload;
    },
    incrementReconnectAttempts: (state) => {
      state.reconnectAttempts += 1;
    },
    resetReconnectAttempts: (state) => {
      state.reconnectAttempts = 0;
    },
    updateLastPing: (state, action: PayloadAction<number>) => {
      state.lastPingTime = action.payload;
    },
  },
});

export const { setStatus, incrementReconnectAttempts, resetReconnectAttempts, updateLastPing } = connectionSlice.actions;
export default connectionSlice.reducer;
