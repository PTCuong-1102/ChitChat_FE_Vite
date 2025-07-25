import React, { useState } from 'react';
import { Plus, Smile } from 'lucide-react';

const MessageReactions = ({ message, onReactionClick, currentUserId }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];
  
  const handleReactionClick = (emoji) => {
    const existingReaction = message.reactions?.find(r => r.emoji === emoji);
    const userHasReacted = existingReaction?.users.includes(currentUserId);
    
    onReactionClick(message._id, emoji, userHasReacted ? 'remove' : 'add');
    setShowEmojiPicker(false);
  };

  const hasReactions = message.reactions && message.reactions.length > 0;

  return (
    <div className="relative">
      {/* Existing reactions */}
      {hasReactions && (
        <div className="flex flex-wrap gap-1 mt-2">
          {message.reactions.map((reaction) => {
            const userHasReacted = reaction.users.includes(currentUserId);
            return (
              <button
                key={reaction.emoji}
                onClick={() => handleReactionClick(reaction.emoji)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                  userHasReacted
                    ? 'bg-blue-100 text-blue-600 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                }`}
                title={`${reaction.count} reaction${reaction.count > 1 ? 's' : ''}`}
              >
                <span>{reaction.emoji}</span>
                <span className="font-medium">{reaction.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Add reaction button */}
      <div className="relative inline-block mt-1">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          title="Add reaction"
        >
          <Smile size={14} />
          <Plus size={12} />
        </button>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowEmojiPicker(false)}
            />
            
            {/* Emoji picker popup */}
            <div className="absolute bottom-full left-0 mb-2 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
              <div className="grid grid-cols-4 gap-1">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className="p-2 text-lg hover:bg-gray-100 rounded transition-colors"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;

