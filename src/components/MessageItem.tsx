import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 1,
        maxWidth: '70%',
        alignSelf: 'flex-start',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
        <Typography variant="subtitle2" color="primary">
          {message.sender}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          {formatTime(message.ts)}
        </Typography>
      </Box>
      <Typography variant="body2">{message.body}</Typography>
    </Paper>
  );
};

export default MessageItem;
