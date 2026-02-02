import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Database operations
  getChats: (offset: number, limit: number) => ipcRenderer.invoke('db:getChats', offset, limit),
  getMessages: (chatId: number, offset: number, limit: number) => ipcRenderer.invoke('db:getMessages', chatId, offset, limit),
  searchMessages: (chatId: number, query: string, limit: number) => ipcRenderer.invoke('db:searchMessages', chatId, query, limit),
  markChatAsRead: (chatId: number) => ipcRenderer.invoke('db:markChatAsRead', chatId),
  
  // WebSocket events
  onNewMessage: (callback: (message: any) => void) => {
    ipcRenderer.on('ws:newMessage', (_event, message) => callback(message));
  },
});
