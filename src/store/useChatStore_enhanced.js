import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStoreEnhanced = create((set, get) => ({
  messages: [],
  conversations: [],
  chatbots: [],
  contacts: [],
  users: [],
  selectedConversation: null,
  selectedContact: null,
  contactType: "user", // "user" or "chatbot"
  isConversationsLoading: false,
  isContactsLoading: false,
  isUsersLoading: false,
  isMessagesLoading: false,
  isChatbotsLoading: false,
  
  // Enhanced state for realtime features
  typingUsers: [], // Array of users currently typing
  onlineUsers: [],
  messagesPagination: {
    hasMore: true,
    nextCursor: null,
    isLoadingMore: false
  },
  connectionStatus: 'connected', // 'connected', 'disconnected', 'connecting'
  messageQueue: [], // Queue for offline messages

  getConversations: async () => {
    set({ isConversationsLoading: true });
    try {
      const res = await axiosInstance.get("/conversations");
      set({ conversations: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to fetch conversations");
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  getContacts: async () => {
    set({ isContactsLoading: true });
    try {
      const res = await axiosInstance.get("/friends/contacts");
      set({ contacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch contacts");
    } finally {
      set({ isContactsLoading: false });
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getChatbots: async () => {
    set({ isChatbotsLoading: true });
    try {
      const res = await axiosInstance.get("/chatbots");
      set({ chatbots: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch chatbots");
    } finally {
      set({ isChatbotsLoading: false });
    }
  },

  // Enhanced getMessages with pagination
  getMessages: async (conversationId, loadMore = false) => {
    const { messagesPagination } = get();
    
    if (loadMore) {
      set({ messagesPagination: { ...messagesPagination, isLoadingMore: true } });
    } else {
      set({ isMessagesLoading: true, messages: [] });
    }
    
    try {
      const params = {};
      if (loadMore && messagesPagination.nextCursor) {
        params.cursor = messagesPagination.nextCursor;
      }
      
      const res = await axiosInstance.get(`/messages/${conversationId}`, { params });
      
      if (loadMore) {
        set({ 
          messages: [...res.data.messages, ...get().messages],
          messagesPagination: {
            hasMore: res.data.hasMore,
            nextCursor: res.data.nextCursor,
            isLoadingMore: false
          }
        });
      } else {
        set({ 
          messages: res.data.messages,
          messagesPagination: {
            hasMore: res.data.hasMore,
            nextCursor: res.data.nextCursor,
            isLoadingMore: false
          }
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to fetch messages");
      set({ 
        messagesPagination: { ...messagesPagination, isLoadingMore: false },
        isMessagesLoading: false 
      });
    } finally {
      if (!loadMore) {
        set({ isMessagesLoading: false });
      }
    }
  },

  getChatbotMessages: async (chatbotId) => {
    console.log("getChatbotMessages called with ID:", chatbotId);
    set({ isMessagesLoading: true });
    try {
      console.log("Making API call to:", `/chatbots/messages/${chatbotId}`);
      const res = await axiosInstance.get(`/chatbots/messages/${chatbotId}`);
      console.log("API response:", res.data);
      console.log("Setting messages in store:", res.data || []);
      set({ messages: res.data || [] });
    } catch (error) {
      console.error("Error in getChatbotMessages:", error);
      // If no messages endpoint for chatbot, just start with empty messages
      set({ messages: [] });
    } finally {
      console.log("getChatbotMessages finished, setting loading to false");
      set({ isMessagesLoading: false });
    }
  },

  // Enhanced sendMessage with optimistic updates and offline queue
  sendMessage: async (messageData) => {
    const { selectedConversation, selectedContact, contactType, messages, connectionStatus } = get();
    
    // Create optimistic message
    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      text: messageData.text,
      image: messageData.image,
      senderId: useAuthStore.getState().authUser,
      createdAt: new Date().toISOString(),
      deliveryStatus: { sent: new Date() },
      isOptimistic: true
    };
    
    // Add optimistic message to UI
    set({ messages: [...messages, optimisticMessage] });
    
    try {
      if (contactType === "chatbot") {
        const res = await axiosInstance.post(`/chatbots/send/${selectedContact._id}`, messageData);
        
        // Remove optimistic message and add real messages
        const updatedMessages = messages.filter(msg => msg._id !== optimisticMessage._id);
        set({ messages: [...updatedMessages, res.data.userMessage, res.data.aiMessage] });
      } else if (selectedConversation) {
        const res = await axiosInstance.post(`/messages/send/${selectedConversation._id}`, messageData);
        
        // Replace optimistic message with real message
        const updatedMessages = messages.map(msg => 
          msg._id === optimisticMessage._id ? res.data : msg
        );
        set({ messages: updatedMessages });
      } else if (selectedContact && contactType === "user") {
        // If we have a selected contact but no conversation, create one first
        await get().setSelectedContact(selectedContact, "user");
        // Try sending the message again after conversation is created
        const { selectedConversation: newConversation } = get();
        if (newConversation) {
          const res = await axiosInstance.post(`/messages/send/${newConversation._id}`, messageData);
          const updatedMessages = messages.map(msg => 
            msg._id === optimisticMessage._id ? res.data : msg
          );
          set({ messages: updatedMessages });
        }
      }
    } catch (error) {
      // Remove optimistic message on error
      const updatedMessages = messages.filter(msg => msg._id !== optimisticMessage._id);
      set({ messages: updatedMessages });
      
      if (connectionStatus === 'disconnected') {
        // Queue message for later
        set({ messageQueue: [...get().messageQueue, messageData] });
        toast.error("Message queued. Will send when connection is restored.");
      } else {
        toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to send message");
      }
    }
  },

  // Mark message as read
  markMessageAsRead: async (messageId) => {
    try {
      await axiosInstance.patch(`/messages/${messageId}/read`);
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  },

  // Add reaction to message
  addReaction: async (messageId, emoji) => {
    try {
      await axiosInstance.post(`/messages/${messageId}/reactions`, { emoji });
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  },

  // Remove reaction from message
  removeReaction: async (messageId, emoji) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}/reactions`, { data: { emoji } });
    } catch (error) {
      toast.error("Failed to remove reaction");
    }
  },

  // Edit message
  editMessage: async (messageId, newText) => {
    try {
      const res = await axiosInstance.patch(`/messages/${messageId}/edit`, { text: newText });
      
      // Update message in local state
      const { messages } = get();
      const updatedMessages = messages.map(msg => 
        msg._id === messageId ? res.data : msg
      );
      set({ messages: updatedMessages });
      
      toast.success("Message edited");
    } catch (error) {
      toast.error("Failed to edit message");
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      
      // Remove message from local state
      const { messages } = get();
      const updatedMessages = messages.filter(msg => msg._id !== messageId);
      set({ messages: updatedMessages });
      
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  },

  sendMessageToBot: async (messageData) => {
    const { selectedContact, messages } = get();
    try {
      const res = await axiosInstance.post(`/chatbots/send/${selectedContact._id}`, messageData);
      set({ messages: [...messages, res.data.userMessage, res.data.aiMessage] });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send message to chatbot");
    }
  },

  createChatbot: async (chatbotData) => {
    try {
      const res = await axiosInstance.post("/chatbots/create", chatbotData);
      const { chatbots } = get();
      set({ chatbots: [...chatbots, res.data] });
      toast.success("Chatbot created successfully!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create chatbot");
      throw error;
    }
  },

  deleteChatbot: async (chatbotId) => {
    try {
      await axiosInstance.delete(`/chatbots/${chatbotId}`);
      const { chatbots, selectedContact } = get();
      const updatedChatbots = chatbots.filter(bot => bot._id !== chatbotId);
      set({ chatbots: updatedChatbots });
      
      // Clear selection if deleted chatbot was selected
      if (selectedContact?._id === chatbotId) {
        set({ selectedContact: null, contactType: "user" });
      }
      
      toast.success("Chatbot deleted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete chatbot");
    }
  },

  // Enhanced socket subscription with typing indicators
  subscribeToMessages: () => {
    const { selectedConversation, selectedContact, contactType } = get();
    if (!selectedConversation && !selectedContact) return;

    const socket = useAuthStore.getState().socket;

    // Subscribe to new messages
    socket.on("newMessage", (newMessage) => {
      let isMessageFromSelectedConversation = false;
      
      if (contactType === "user" && selectedConversation) {
        isMessageFromSelectedConversation = newMessage.conversationId === selectedConversation._id;
      } else if (contactType === "chatbot" && selectedContact) {
        isMessageFromSelectedConversation = 
          newMessage.senderId === selectedContact._id || newMessage.receiverId === selectedContact._id;
      }
      
      if (!isMessageFromSelectedConversation) return;

      set({
        messages: [...get().messages, newMessage],
      });

      // Auto-mark as read if message is visible
      if (newMessage.senderId !== useAuthStore.getState().authUser._id) {
        get().markMessageAsRead(newMessage._id);
      }
    });

    // Subscribe to typing indicators
    socket.on("userTyping", ({ conversationId, userId, userName }) => {
      if (selectedConversation?._id === conversationId) {
        const { typingUsers } = get();
        if (!typingUsers.find(user => user.userId === userId)) {
          set({ typingUsers: [...typingUsers, { userId, userName }] });
        }
      }
    });

    socket.on("userStoppedTyping", ({ conversationId, userId }) => {
      if (selectedConversation?._id === conversationId) {
        const { typingUsers } = get();
        set({ typingUsers: typingUsers.filter(user => user.userId !== userId) });
      }
    });

    // Subscribe to message status updates
    socket.on("messageStatusUpdate", ({ messageId, status, userId, timestamp }) => {
      const { messages } = get();
      const updatedMessages = messages.map(msg => {
        if (msg._id === messageId) {
          const updatedMsg = { ...msg };
          if (status === 'delivered') {
            if (!updatedMsg.deliveredTo) updatedMsg.deliveredTo = [];
            updatedMsg.deliveredTo.push({ userId, deliveredAt: timestamp });
          } else if (status === 'read') {
            if (!updatedMsg.readBy) updatedMsg.readBy = [];
            updatedMsg.readBy.push({ userId, readAt: timestamp });
          }
          return updatedMsg;
        }
        return msg;
      });
      set({ messages: updatedMessages });
    });

    // Subscribe to reactions
    socket.on("reactionAdded", ({ messageId, emoji, userId, userName }) => {
      const { messages } = get();
      const updatedMessages = messages.map(msg => {
        if (msg._id === messageId) {
          const updatedMsg = { ...msg };
          if (!updatedMsg.reactions) updatedMsg.reactions = [];
          
          let reaction = updatedMsg.reactions.find(r => r.emoji === emoji);
          if (reaction) {
            if (!reaction.users.includes(userId)) {
              reaction.users.push(userId);
              reaction.count = reaction.users.length;
            }
          } else {
            updatedMsg.reactions.push({
              emoji,
              users: [userId],
              count: 1
            });
          }
          return updatedMsg;
        }
        return msg;
      });
      set({ messages: updatedMessages });
    });

    socket.on("reactionRemoved", ({ messageId, emoji, userId }) => {
      const { messages } = get();
      const updatedMessages = messages.map(msg => {
        if (msg._id === messageId) {
          const updatedMsg = { ...msg };
          if (updatedMsg.reactions) {
            const reaction = updatedMsg.reactions.find(r => r.emoji === emoji);
            if (reaction) {
              reaction.users = reaction.users.filter(id => id !== userId);
              reaction.count = reaction.users.length;
              
              if (reaction.count === 0) {
                updatedMsg.reactions = updatedMsg.reactions.filter(r => r.emoji !== emoji);
              }
            }
          }
          return updatedMsg;
        }
        return msg;
      });
      set({ messages: updatedMessages });
    });

    // Subscribe to message edits and deletions
    socket.on("messageEdited", (editedMessage) => {
      const { messages } = get();
      const updatedMessages = messages.map(msg => 
        msg._id === editedMessage._id ? editedMessage : msg
      );
      set({ messages: updatedMessages });
    });

    socket.on("messageDeleted", ({ messageId }) => {
      const { messages } = get();
      const updatedMessages = messages.filter(msg => msg._id !== messageId);
      set({ messages: updatedMessages });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
    socket.off("messageStatusUpdate");
    socket.off("reactionAdded");
    socket.off("reactionRemoved");
    socket.off("messageEdited");
    socket.off("messageDeleted");
  },

  // Typing indicator functions
  startTyping: () => {
    const { selectedConversation } = get();
    const socket = useAuthStore.getState().socket;
    const user = useAuthStore.getState().authUser;
    
    if (selectedConversation && socket) {
      socket.emit("typing", {
        conversationId: selectedConversation._id,
        userId: user._id,
        userName: user.fullName
      });
    }
  },

  stopTyping: () => {
    const { selectedConversation } = get();
    const socket = useAuthStore.getState().socket;
    const user = useAuthStore.getState().authUser;
    
    if (selectedConversation && socket) {
      socket.emit("stopTyping", {
        conversationId: selectedConversation._id,
        userId: user._id
      });
    }
  },

  setSelectedConversation: (conversation) => {
    set({ 
      selectedConversation: conversation,
      selectedContact: null,
      contactType: "user",
      messages: [],
      typingUsers: [],
      messagesPagination: {
        hasMore: true,
        nextCursor: null,
        isLoadingMore: false
      }
    });
  },

  setSelectedContact: async (contact, type = "user") => {
    const { createConversation, getConversations } = get();
    
    set({ 
      selectedContact: contact, 
      selectedConversation: null,
      contactType: type,
      messages: [],
      typingUsers: [],
      messagesPagination: {
        hasMore: true,
        nextCursor: null,
        isLoadingMore: false
      }
    });

    // For regular users (not chatbots), automatically create or find conversation
    if (type === "user") {
      try {
        // Try to create a conversation (will return existing one if it exists)
        const conversation = await createConversation([contact._id]);
        set({ 
          selectedConversation: conversation,
          selectedContact: contact,
          contactType: type
        });
        
        // Refresh conversations list to ensure it's up to date
        await getConversations();
      } catch (error) {
        console.error("Error creating/finding conversation:", error);
      }
    }
  },

  createConversation: async (participantIds, name, isGroupChat = false) => {
    try {
      const res = await axiosInstance.post("/conversations", {
        participants: participantIds,
        name,
        isGroupChat
      });
      
      const { conversations } = get();
      set({ conversations: [res.data, ...conversations] });
      
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create conversation");
      throw error;
    }
  },

  // Connection status management
  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
  },

  // Process queued messages when connection is restored
  processMessageQueue: async () => {
    const { messageQueue } = get();
    if (messageQueue.length > 0) {
      for (const messageData of messageQueue) {
        await get().sendMessage(messageData);
      }
      set({ messageQueue: [] });
    }
  },

  // Legacy support - can be removed later
  setSelectedUser: (selectedUser) => set({ 
    selectedContact: selectedUser, 
    contactType: "user",
    messages: [],
    typingUsers: []
  }),
}));

