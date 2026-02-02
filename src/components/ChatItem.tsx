import React from 'react';
import { Box, Typography, Badge } from '@mui/material';
import type { Chat } from '../types';

interface ChatItemProps {
  chat: Chat;
  selected: boolean;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, selected, onClick }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        cursor: 'pointer',
        bgcolor: selected ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: chat.unreadCount > 0 ? 600 : 400 }}>
            {chat.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(chat.lastMessageAt)}
          </Typography>
        </Box>
        {chat.unreadCount > 0 && (
          <Badge
            badgeContent={chat.unreadCount}
            color="primary"
            sx={{ ml: 1 }}
          />
        )}
      </Box>
    </Box>
  );
};

export default ChatItem;
