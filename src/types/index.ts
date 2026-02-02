export interface Chat {
  id: number;
  title: string;
  lastMessageAt: number;
  unreadCount: number;
}

export interface Message {
  id: number;
  chatId: number;
  ts: number;
  sender: string;
  body: string;
}

declare global {
  interface Window {
    api: {
      getChats: (offset: number, limit: number) => Promise<Chat[]>;
      getMessages: (chatId: number, offset: number, limit: number) => Promise<Message[]>;
      searchMessages: (chatId: number, query: string, limit: number) => Promise<Message[]>;
      markChatAsRead: (chatId: number) => Promise<void>;
    };
  }
}

export {};
