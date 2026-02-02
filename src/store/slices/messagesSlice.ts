import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Message } from '../../types';

interface MessagesState {
  items: Message[];
  loading: boolean;
  hasMore: boolean;
  offset: number;
  searchQuery: string;
}

const initialState: MessagesState = {
  items: [],
  loading: false,
  hasMore: true,
  offset: 0,
  searchQuery: '',
};

export const loadMessages = createAsyncThunk(
  'messages/loadMessages',
  async ({ chatId, offset, limit = 50 }: { chatId: number; offset: number; limit?: number }) => {
    const messages = await window.api.getMessages(chatId, offset, limit);
    return { messages, offset };
  }
);

export const searchMessages = createAsyncThunk(
  'messages/searchMessages',
  async ({ chatId, query }: { chatId: number; query: string }) => {
    const messages = await window.api.searchMessages(chatId, query, 50);
    return messages;
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addNewMessage: (state, action: PayloadAction<Message>) => {
      state.items.unshift(action.payload);
    },
    clearMessages: (state) => {
      state.items = [];
      state.offset = 0;
      state.hasMore = true;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadMessages.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.offset === 0) {
          state.items = action.payload.messages;
        } else {
          state.items.push(...action.payload.messages);
        }
        state.offset = action.payload.offset + action.payload.messages.length;
        state.hasMore = action.payload.messages.length === 50;
      })
      .addCase(loadMessages.rejected, (state) => {
        state.loading = false;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  },
});

export const { addNewMessage, clearMessages, setSearchQuery } = messagesSlice.actions;
export default messagesSlice.reducer;
