import React, { useEffect, useCallback, useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadMessages, searchMessages as searchMessagesAction } from '../store/slices/messagesSlice';
import MessageItem from './MessageItem';

const MessageView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedChatId } = useAppSelector(state => state.chats);
  const { items, loading, hasMore, searchQuery } = useAppSelector(state => state.messages);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  useEffect(() => {
    if (selectedChatId) {
      dispatch(loadMessages({ chatId: selectedChatId, offset: 0, limit: 50 }));
    }
  }, [selectedChatId, dispatch]);

  const handleLoadMore = useCallback(() => {
    if (selectedChatId && hasMore && !loading) {
      dispatch(loadMessages({ chatId: selectedChatId, offset: items.length, limit: 50 }));
    }
  }, [dispatch, selectedChatId, items.length, hasMore, loading]);

  const handleSearch = useCallback(() => {
    if (selectedChatId && localSearchQuery.trim()) {
      dispatch(searchMessagesAction({ chatId: selectedChatId, query: localSearchQuery }));
    } else if (selectedChatId) {
      dispatch(loadMessages({ chatId: selectedChatId, offset: 0, limit: 50 }));
    }
  }, [dispatch, selectedChatId, localSearchQuery]);

  if (!selectedChatId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <Typography variant="h6" color="text.secondary">
          Select a chat to view messages
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search messages..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column-reverse', p: 2 }}>
        {loading && items.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {items.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            
            {hasMore && items.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <Button onClick={handleLoadMore} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : 'Load older messages'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default MessageView;
