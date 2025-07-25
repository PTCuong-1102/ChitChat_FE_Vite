import { X, Bot, Settings, Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedConversation, selectedContact, contactType, setSelectedContact, setSelectedConversation } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();

  const getDisplayInfo = () => {
    if (contactType === "chatbot" && selectedContact) {
      return {
        name: selectedContact.name,
        status: `${selectedContact.model}${selectedContact.isDefault ? " • Default" : ""}`,
        avatar: null,
        isBot: true
      };
    }
    
    if (selectedConversation) {
      if (selectedConversation.isGroupChat) {
        return {
          name: selectedConversation.name || "Unnamed Group",
          status: `${selectedConversation.participants.length} members`,
          avatar: selectedConversation.groupIcon,
          isGroup: true
        };
      } else {
        const otherParticipant = selectedConversation.participants.find(p => p._id !== authUser._id);
        return {
          name: otherParticipant?.fullName || "Unknown User",
          status: onlineUsers.includes(otherParticipant?._id) ? "Online" : "Offline",
          avatar: otherParticipant?.profilePic,
          isGroup: false
        };
      }
    }
    
    return { name: "", status: "", avatar: null };
  };

  const displayInfo = getDisplayInfo();

  const handleClose = () => {
    if (selectedConversation) {
      setSelectedConversation(null);
    } else {
      setSelectedContact(null);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              {displayInfo.isBot ? (
                <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Bot className="size-6 text-primary" />
                </div>
              ) : displayInfo.isGroup ? (
                <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Users className="size-6 text-primary" />
                </div>
              ) : (
                <img 
                  src={displayInfo.avatar || "/avatar.png"} 
                  alt={displayInfo.name} 
                />
              )}
            </div>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="font-medium">
              {displayInfo.name}
            </h3>
            <p className="text-sm text-base-content/70">
              {displayInfo.status}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Group settings button (only for group chats where user is admin) */}
          {selectedConversation?.isGroupChat && selectedConversation?.admin === authUser._id && (
            <button className="btn btn-ghost btn-sm btn-circle">
              <Settings className="size-4" />
            </button>
          )}
          
          {/* Close button */}
          <button onClick={handleClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
