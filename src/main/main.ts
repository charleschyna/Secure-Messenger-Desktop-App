import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { initializeDatabase, getChats, getMessages, searchMessages, markChatAsRead } from '../services/DatabaseService';
import { startWebSocketServer } from '../services/WebSocketServer';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const htmlPath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(htmlPath);

  // Open DevTools to see errors
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  // Initialize database
  await initializeDatabase();
  
  // Set up IPC handlers
  setupIpcHandlers();
  
  // Start WebSocket server
  startWebSocketServer();
  
  // Create window
  createWindow();
});

function setupIpcHandlers(): void {
  ipcMain.handle('db:getChats', async (_event, offset: number, limit: number) => {
    return getChats(offset, limit);
  });

  ipcMain.handle('db:getMessages', async (_event, chatId: number, offset: number, limit: number) => {
    return getMessages(chatId, offset, limit);
  });

  ipcMain.handle('db:searchMessages', async (_event, chatId: number, query: string, limit: number) => {
    return searchMessages(chatId, query, limit);
  });

  ipcMain.handle('db:markChatAsRead', async (_event, chatId: number) => {
    return markChatAsRead(chatId);
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
