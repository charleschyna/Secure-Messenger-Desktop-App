import { configureStore } from '@reduxjs/toolkit';
import chatsReducer from './slices/chatsSlice';
import messagesReducer from './slices/messagesSlice';
import connectionReducer from './slices/connectionSlice';

export const store = configureStore({
  reducer: {
    chats: chatsReducer,
    messages: messagesReducer,
    connection: connectionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
