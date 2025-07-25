import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageStatus = ({ message, isOwnMessage, currentUserId }) => {
  if (!isOwnMessage) return null;

  const getStatusIcon = () => {
    // Check if message has been read by anyone
    if (message.readBy && message.readBy.length > 0) {
      return <CheckCheck className="text-blue-500" size={14} />;
    }
    
    // Check if message has been delivered to anyone
    if (message.deliveredTo && message.deliveredTo.length > 0) {
      return <CheckCheck className="text-gray-500" size={14} />;
    }
    
    // Message sent but not delivered yet
    if (message.deliveryStatus?.sent) {
      return <Check className="text-gray-500" size={14} />;
    }
    
    // Optimistic message (still sending)
    if (message.isOptimistic) {
      return <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>;
    }
    
    return null;
  };

  const getTooltipText = () => {
    if (message.readBy && message.readBy.length > 0) {
      const readAt = new Date(message.readBy[0].readAt).toLocaleTimeString();
      return `Read at ${readAt}`;
    }
    
    if (message.deliveredTo && message.deliveredTo.length > 0) {
      const deliveredAt = new Date(message.deliveredTo[0].deliveredAt).toLocaleTimeString();
      return `Delivered at ${deliveredAt}`;
    }
    
    if (message.deliveryStatus?.sent) {
      const sentAt = new Date(message.deliveryStatus.sent).toLocaleTimeString();
      return `Sent at ${sentAt}`;
    }
    
    if (message.isOptimistic) {
      return 'Sending...';
    }
    
    return '';
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <div 
        className="flex items-center"
        title={getTooltipText()}
      >
        {getStatusIcon()}
      </div>
      
      {/* Show timestamp */}
      <span className="text-xs text-gray-400">
        {new Date(message.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </span>
      
      {/* Show edited indicator */}
      {message.editedAt && (
        <span className="text-xs text-gray-400 italic">
          edited
        </span>
      )}
    </div>
  );
};

export default MessageStatus;

