import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import ChatList from '../components/ChatList';
import MessageView from '../components/MessageView';
import ConnectionStatus from '../components/ConnectionStatus';
import { useAppDispatch } from '../store/hooks';
import { connectWebSocket } from '../store/slices/connectionSlice';

const App: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Connect to WebSocket on mount
    dispatch(connectWebSocket());
  }, [dispatch]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
        <ConnectionStatus />
        <ChatList />
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <MessageView />
      </Box>
    </Box>
  );
};

export default App;
