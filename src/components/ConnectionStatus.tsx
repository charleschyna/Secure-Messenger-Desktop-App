import React from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { simulateDisconnect, connectWebSocket } from '../store/slices/connectionSlice';

const ConnectionStatus: React.FC = () => {
  const dispatch = useAppDispatch();
  const { status, reconnectAttempts } = useAppSelector(state => state.connection);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'connecting':
      case 'reconnecting':
        return 'warning';
      case 'disconnected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting (${reconnectAttempts})...`;
      case 'disconnected':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const handleSimulateDisconnect = () => {
    dispatch(simulateDisconnect());
  };

  const handleReconnect = () => {
    dispatch(connectWebSocket());
  };

  return (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Chip
          icon={<CircleIcon sx={{ fontSize: 12 }} />}
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
        />
        {status === 'connected' && (
          <Button size="small" onClick={handleSimulateDisconnect}>
            Drop Connection
          </Button>
        )}
        {status === 'disconnected' && (
          <Button size="small" variant="contained" color="primary" onClick={handleReconnect}>
            Reconnect
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ConnectionStatus;
