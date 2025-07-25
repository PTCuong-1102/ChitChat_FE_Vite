import React from 'react';

const TypingIndicator = ({ typingUsers = [] }) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex gap-1">
        <div className="typing-dot animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="typing-dot animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="typing-dot animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>{getTypingText()}</span>
      
      <style jsx>{`
        .typing-dot {
          width: 4px;
          height: 4px;
          background-color: #6b7280;
          border-radius: 50%;
          animation-duration: 1.4s;
          animation-iteration-count: infinite;
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;

