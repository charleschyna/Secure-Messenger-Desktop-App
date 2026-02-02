import React, { useEffect, useCallback, useRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { FixedSizeList as List } from 'react-window';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadChats, selectChat, markChatAsRead } from '../store/slices/chatsSlice';
import { clearMessages } from '../store/slices/messagesSlice';
import ChatItem from './ChatItem';

const ChatList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, hasMore, selectedChatId } = useAppSelector(state => state.chats);
  const listRef = useRef<List>(null);

  useEffect(() => {
    // Load initial chats
    dispatch(loadChats({ offset: 0, limit: 50 }));
  }, [dispatch]);

  const handleChatClick = useCallback((chatId: number) => {
    dispatch(selectChat(chatId));
    dispatch(markChatAsRead(chatId));
    dispatch(clearMessages());
  }, [dispatch]);

  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: any) => {
    if (scrollUpdateWasRequested || loading || !hasMore) return;

    const listHeight = listRef.current?.props.height as number;
    const totalHeight = items.length * 72;
    
    if (scrollOffset + listHeight >= totalHeight - 100) {
      dispatch(loadChats({ offset: items.length, limit: 50 }));
    }
  }, [dispatch, items.length, loading, hasMore]);

  const Row = ({ index, style }: any) => {
    const chat = items[index];
    return (
      <div style={style}>
        <ChatItem
          chat={chat}
          selected={chat.id === selectedChatId}
          onClick={() => handleChatClick(chat.id)}
        />
      </div>
    );
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Chats</Typography>
      </Box>
      
      {items.length === 0 && loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List
          ref={listRef}
          height={window.innerHeight - 120}
          itemCount={items.length}
          itemSize={72}
          width="100%"
          onScroll={handleScroll}
        >
          {Row}
        </List>
      )}
      
      {loading && items.length > 0 && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default ChatList;
