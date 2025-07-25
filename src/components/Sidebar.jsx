import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import CreateGroupModal from "./CreateGroupModal";
import { Users, Bot, MessageCircle } from "lucide-react";

const Sidebar = () => {
  const { 
    getContacts,
    contacts,
    getUsers, 
    users, 
    getChatbots,
    chatbots,
    getConversations,
    conversations,
    selectedContact, 
    setSelectedContact,
    setSelectedConversation,
    selectedConversation,
    contactType,
    isContactsLoading,
    isUsersLoading,
    isChatbotsLoading,
    isConversationsLoading
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("conversations");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  useEffect(() => {
    if (activeTab === "contacts") {
      getContacts();
    } else if (activeTab === "users") {
      getUsers();
    } else if (activeTab === "chatbots") {
      getChatbots();
    } else if (activeTab === "conversations") {
      getConversations();
    }
  }, [activeTab, getContacts, getUsers, getChatbots, getConversations]);

  const displayUsers = activeTab === "contacts" ? contacts : users;
  const filteredUsers = showOnlineOnly
    ? displayUsers.filter((user) => onlineUsers.includes(user._id))
    : displayUsers;

  const isLoading = activeTab === "contacts" ? isContactsLoading : 
                   activeTab === "users" ? isUsersLoading : 
                   activeTab === "chatbots" ? isChatbotsLoading : 
                   isConversationsLoading;

  if (isLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-80 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        {/* Tab Navigation */}
        <div className="flex w-full bg-base-200 rounded-lg p-1 mb-4 hidden lg:flex">
          <button
            onClick={() => setActiveTab("conversations")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all ${
              activeTab === "conversations" ? "bg-base-100 shadow-sm" : "hover:bg-base-300"
            }`}
          >
            <MessageCircle className="size-4 flex-shrink-0" />
            <span className="whitespace-nowrap text-sm font-medium">Chats</span>
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all ${
              activeTab === "contacts" ? "bg-base-100 shadow-sm" : "hover:bg-base-300"
            }`}
          >
            <Users className="size-4 flex-shrink-0" />
            <span className="whitespace-nowrap text-sm font-medium">Friends</span>
          </button>
          <button
            onClick={() => setActiveTab("chatbots")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all ${
              activeTab === "chatbots" ? "bg-base-100 shadow-sm" : "hover:bg-base-300"
            }`}
          >
            <Bot className="size-4 flex-shrink-0" />
            <span className="whitespace-nowrap text-sm font-medium">Bots</span>
          </button>
        </div>

        {/* Mobile tab icons */}
        <div className="flex lg:hidden justify-center gap-4 mb-4">
          <button
            onClick={() => setActiveTab("conversations")}
            className={`p-2 rounded flex items-center justify-center ${activeTab === "conversations" ? "bg-primary text-primary-content" : ""}`}
            title="Chats"
          >
            <MessageCircle className="size-6" />
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`p-2 rounded flex items-center justify-center ${activeTab === "contacts" ? "bg-primary text-primary-content" : ""}`}
            title="Friends"
          >
            <Users className="size-6" />
          </button>
          <button
            onClick={() => setActiveTab("chatbots")}
            className={`p-2 rounded flex items-center justify-center ${activeTab === "chatbots" ? "bg-primary text-primary-content" : ""}`}
            title="Bots"
          >
            <Bot className="size-6" />
          </button>
        </div>

        {/* Create Group Button - for conversations and contacts */}
        {(activeTab === "contacts" || activeTab === "conversations") && (
          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="btn btn-primary btn-sm w-full mt-2 hidden lg:flex"
          >
            Create Group
          </button>
        )}

        {/* Online filter - only for contacts */}
        {activeTab === "contacts" && (
          <div className="mt-3 hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-zinc-500">({Math.max(0, onlineUsers.length - 1)} online)</span>
          </div>
        )}
      </div>

      <div className="overflow-y-auto w-full py-3">
        {activeTab === "conversations" ? (
          <>
            {conversations.map((conversation) => {
              const { authUser } = useAuthStore.getState();
              
              // Determine conversation display info
              let conversationName, conversationAvatar, conversationStatus;
              
              if (conversation.isGroupChat) {
                conversationName = conversation.name || "Unnamed Group";
                conversationAvatar = conversation.groupIcon;
                conversationStatus = `${conversation.participants.length} members`;
              } else {
                const otherUser = conversation.participants.find(p => p._id !== authUser._id);
                if (otherUser) {
                  conversationName = otherUser.fullName;
                  conversationAvatar = otherUser.profilePic;
                  conversationStatus = onlineUsers.includes(otherUser._id) ? "Online" : "Offline";
                } else {
                  conversationName = "Deleted User";
                  conversationAvatar = null;
                  conversationStatus = "Offline";
                }
              }

              return (
                <button
                  key={conversation._id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`
                    w-full p-3 flex items-center gap-3
                    hover:bg-base-300 transition-colors
                    ${selectedConversation?._id === conversation._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                  `}
                >
                  <div className="relative mx-auto lg:mx-0">
                    {conversation.isGroupChat ? (
                      <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <Users className="size-7 text-primary" />
                      </div>
                    ) : (
                      <>
                        <img
                          src={conversationAvatar || "/avatar.png"}
                          alt={conversationName}
                          className="size-12 object-cover rounded-full"
                        />
                        {!conversation.isGroupChat && conversationStatus === "Online" && (
                          <span
                            className="absolute bottom-0 right-0 size-3 bg-green-500 
                            rounded-full ring-2 ring-zinc-900"
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Conversation info - only visible on larger screens */}
                  <div className="hidden lg:block text-left min-w-0">
                    <div className="font-medium truncate">{conversationName}</div>
                    <div className="text-sm text-zinc-400">
                      {conversationStatus}
                    </div>
                  </div>
                </button>
              );
            })}

            {conversations.length === 0 && (
              <div className="text-center text-zinc-500 py-4">
                <MessageCircle className="size-8 mx-auto mb-2 opacity-50" />
                No conversations yet
              </div>
            )}
          </>
        ) : activeTab === "contacts" ? (
          <>
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => setSelectedContact(user, "user")}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${selectedContact?._id === user._id && contactType === "user" ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.name}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                      rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>

                {/* User info - only visible on larger screens */}
                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-zinc-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center text-zinc-500 py-4">
                {activeTab === "contacts" ? "No friends yet" : "No online users"}
              </div>
            )}
          </>
        ) : (
          <>
            {chatbots.map((chatbot) => (
              <button
                key={chatbot._id}
                onClick={() => setSelectedContact(chatbot, "chatbot")}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${selectedContact?._id === chatbot._id && contactType === "chatbot" ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Bot className="size-7 text-primary" />
                  </div>
                  {chatbot.isDefault && (
                    <span className="absolute -top-1 -right-1 size-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">✓</span>
                    </span>
                  )}
                </div>

                {/* Chatbot info - only visible on larger screens */}
                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">{chatbot.name}</div>
                  <div className="text-sm text-zinc-400">
                    {chatbot.model} {chatbot.isDefault && "• Default"}
                  </div>
                </div>
              </button>
            ))}

            {chatbots.length === 0 && (
              <div className="text-center text-zinc-500 py-4">
                <Bot className="size-8 mx-auto mb-2 opacity-50" />
                No chatbots available
              </div>
            )}
          </>
        )}
      </div>

      <CreateGroupModal 
        isOpen={isCreateGroupOpen} 
        onClose={() => setIsCreateGroupOpen(false)} 
      />
    </aside>
  );
};
export default Sidebar;
