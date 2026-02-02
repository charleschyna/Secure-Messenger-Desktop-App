// @ts-ignore - sql.js doesn't have types
import initSqlJs from 'sql.js';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

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

let db: any;
let dbPath: string;

export async function initializeDatabase(): Promise<void> {
  const SQL = await initSqlJs();
  dbPath = path.join(app.getPath('userData'), 'messenger.db');
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  createTables();
  createIndexes();
  
  // Check if we need to seed data
  const result = db.exec('SELECT COUNT(*) as count FROM chats');
  const count = result[0]?.values[0]?.[0] as number || 0;
  if (count === 0) {
    seedData();
    saveDatabase();
  }
}

function saveDatabase(): void {
  const data = db.export();
  fs.writeFileSync(dbPath, data);
}

function createTables(): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      lastMessageAt INTEGER NOT NULL,
      unreadCount INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chatId INTEGER NOT NULL,
      ts INTEGER NOT NULL,
      sender TEXT NOT NULL,
      body TEXT NOT NULL,
      FOREIGN KEY (chatId) REFERENCES chats(id)
    );
  `);
}

function createIndexes(): void {
  // Index for sorting chats by lastMessageAt
  db.run('CREATE INDEX IF NOT EXISTS idx_chats_lastMessageAt ON chats(lastMessageAt DESC);');
  
  // Index for fetching messages by chatId and sorting by timestamp
  db.run('CREATE INDEX IF NOT EXISTS idx_messages_chatId_ts ON messages(chatId, ts DESC);');
  
  // Index for message search
  db.run('CREATE INDEX IF NOT EXISTS idx_messages_body ON messages(body);');
}

function seedData(): void {
  console.info('Seeding database with initial data...');
  
  const senders = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  const now = Date.now();
  
  // Create 200 chats
  for (let i = 1; i <= 200; i++) {
    const lastMessageAt = now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000); // Within last week
    const unreadCount = Math.floor(Math.random() * 10);
    db.run('INSERT INTO chats (title, lastMessageAt, unreadCount) VALUES (?, ?, ?)', 
      [`Chat ${i}`, lastMessageAt, unreadCount]);
  }
  
  // Create 20,000+ messages distributed across chats
  let messageCount = 0;
  while (messageCount < 20000) {
    const chatId = Math.floor(Math.random() * 200) + 1;
    const messagesForChat = Math.floor(Math.random() * 50) + 20; // 20-70 messages per chat
    
    for (let j = 0; j < messagesForChat && messageCount < 20000; j++) {
      const sender = senders[Math.floor(Math.random() * senders.length)];
      const ts = now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Within last 30 days
      const body = generateMessageBody();
      
      db.run('INSERT INTO messages (chatId, ts, sender, body) VALUES (?, ?, ?, ?)',
        [chatId, ts, sender, body]);
      messageCount++;
    }
  }
  
  console.info('Database seeded successfully!');
}

function generateMessageBody(): string {
  const templates = [
    'Hey! How are you doing?',
    'Did you see the latest update?',
    'Let\'s catch up sometime',
    'That sounds great!',
    'I\'ll be there in 5 minutes',
    'Thanks for your help!',
    'Can you send me the file?',
    'Meeting at 3 PM today',
    'Great work on the project!',
    'What do you think about this?'
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

export function getChats(offset: number = 0, limit: number = 50): Chat[] {
  const result = db.exec(`
    SELECT id, title, lastMessageAt, unreadCount 
    FROM chats 
    ORDER BY lastMessageAt DESC 
    LIMIT ? OFFSET ?
  `, [limit, offset]);
  
  if (!result[0]) return [];
  
  return result[0].values.map((row: any) => ({
    id: row[0] as number,
    title: row[1] as string,
    lastMessageAt: row[2] as number,
    unreadCount: row[3] as number
  }));
}

export function getMessages(chatId: number, offset: number = 0, limit: number = 50): Message[] {
  const result = db.exec(`
    SELECT id, chatId, ts, sender, body 
    FROM messages 
    WHERE chatId = ? 
    ORDER BY ts DESC 
    LIMIT ? OFFSET ?
  `, [chatId, limit, offset]);
  
  if (!result[0]) return [];
  
  return result[0].values.map((row: any) => ({
    id: row[0] as number,
    chatId: row[1] as number,
    ts: row[2] as number,
    sender: row[3] as string,
    body: row[4] as string
  }));
}

export function searchMessages(chatId: number, query: string, limit: number = 50): Message[] {
  const result = db.exec(`
    SELECT id, chatId, ts, sender, body 
    FROM messages 
    WHERE chatId = ? AND body LIKE ? 
    ORDER BY ts DESC 
    LIMIT ?
  `, [chatId, `%${query}%`, limit]);
  
  if (!result[0]) return [];
  
  return result[0].values.map((row: any) => ({
    id: row[0] as number,
    chatId: row[1] as number,
    ts: row[2] as number,
    sender: row[3] as string,
    body: row[4] as string
  }));
}

export function insertMessage(chatId: number, ts: number, sender: string, body: string): number {
  db.run('INSERT INTO messages (chatId, ts, sender, body) VALUES (?, ?, ?, ?)',
    [chatId, ts, sender, body]);
  
  // Get last inserted row ID
  const result = db.exec('SELECT last_insert_rowid()');
  const messageId = result[0].values[0][0] as number;
  
  // Update chat's lastMessageAt
  updateChatLastMessage(chatId, ts);
  saveDatabase();
  
  return messageId;
}

export function updateChatLastMessage(chatId: number, ts: number): void {
  db.run('UPDATE chats SET lastMessageAt = ?, unreadCount = unreadCount + 1 WHERE id = ?',
    [ts, chatId]);
  saveDatabase();
}

export function markChatAsRead(chatId: number): void {
  db.run('UPDATE chats SET unreadCount = 0 WHERE id = ?', [chatId]);
  saveDatabase();
}

export function getChatById(chatId: number): Chat | undefined {
  const result = db.exec('SELECT id, title, lastMessageAt, unreadCount FROM chats WHERE id = ?', [chatId]);
  
  if (!result[0] || !result[0].values[0]) return undefined;
  
  const row = result[0].values[0];
  return {
    id: row[0] as number,
    title: row[1] as string,
    lastMessageAt: row[2] as number,
    unreadCount: row[3] as number
  };
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
  }
}
