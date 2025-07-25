import React from 'react';
import { Wifi, WifiOff, Loader, AlertCircle } from 'lucide-react';

const ConnectionStatus = ({ connectionState, reconnectAttempts, onReconnect }) => {
  if (connectionState === 'connected') return null;

  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connecting':
        return {
          icon: <Loader className="animate-spin" size={16} />,
          text: 'Connecting...',
          bgColor: 'bg-yellow-500',
          textColor: 'text-yellow-100'
        };
      case 'reconnecting':
        return {
          icon: <Loader className="animate-spin" size={16} />,
          text: `Reconnecting... (Attempt ${reconnectAttempts})`,
          bgColor: 'bg-orange-500',
          textColor: 'text-orange-100'
        };
      case 'disconnected':
        return {
          icon: <WifiOff size={16} />,
          text: 'Connection lost',
          bgColor: 'bg-red-500',
          textColor: 'text-red-100'
        };
      default:
        return {
          icon: <AlertCircle size={16} />,
          text: 'Connection error',
          bgColor: 'bg-gray-500',
          textColor: 'text-gray-100'
        };
    }
  };

  const { icon, text, bgColor, textColor } = getStatusConfig();

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${bgColor} ${textColor} px-4 py-2 text-sm`}>
      <div className="flex items-center justify-center gap-2">
        {icon}
        <span>{text}</span>
        {connectionState === 'disconnected' && (
          <button
            onClick={onReconnect}
            className="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;

