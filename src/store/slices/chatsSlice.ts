import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Chat } from '../../types';

interface ChatsState {
  items: Chat[];
  selectedChatId: number | null;
  loading: boolean;
  hasMore: boolean;
  offset: number;
}

const initialState: ChatsState = {
  items: [],
  selectedChatId: null,
  loading: false,
  hasMore: true,
  offset: 0,
};

export const loadChats = createAsyncThunk(
  'chats/loadChats',
  async ({ offset, limit = 50 }: { offset: number; limit?: number }) => {
    const chats = await window.api.getChats(offset, limit);
    return { chats, offset };
  }
);

export const markChatAsRead = createAsyncThunk(
  'chats/markChatAsRead',
  async (chatId: number) => {
    await window.api.markChatAsRead(chatId);
    return chatId;
  }
);

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    selectChat: (state, action: PayloadAction<number>) => {
      state.selectedChatId = action.payload;
    },
    updateChatFromMessage: (state, action: PayloadAction<{ chatId: number; ts: number }>) => {
      const chat = state.items.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.lastMessageAt = action.payload.ts;
        chat.unreadCount += 1;
        // Re-sort chats
        state.items.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadChats.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadChats.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.offset === 0) {
          state.items = action.payload.chats;
        } else {
          state.items.push(...action.payload.chats);
        }
        state.offset = action.payload.offset + action.payload.chats.length;
        state.hasMore = action.payload.chats.length === 50;
      })
      .addCase(loadChats.rejected, (state) => {
        state.loading = false;
      })
      .addCase(markChatAsRead.fulfilled, (state, action) => {
        const chat = state.items.find(c => c.id === action.payload);
        if (chat) {
          chat.unreadCount = 0;
        }
      });
  },
});

export const { selectChat, updateChatFromMessage } = chatsSlice.actions;
export default chatsSlice.reducer;
