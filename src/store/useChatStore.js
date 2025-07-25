import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
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

  getMessages: async (conversationId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${conversationId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
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
  sendMessage: async (messageData) => {
    const { selectedConversation, selectedContact, contactType, messages, setSelectedContact } = get();
    try {
      if (contactType === "chatbot") {
        const res = await axiosInstance.post(`/chatbots/send/${selectedContact._id}`, messageData);
        set({ messages: [...messages, res.data.userMessage, res.data.aiMessage] });
      } else if (selectedConversation) {
        const res = await axiosInstance.post(`/messages/send/${selectedConversation._id}`, messageData);
        set({ messages: [...messages, res.data] });
      } else if (selectedContact && contactType === "user") {
        // If we have a selected contact but no conversation, create one first
        await setSelectedContact(selectedContact, "user");
        // Try sending the message again after conversation is created
        const { selectedConversation: newConversation } = get();
        if (newConversation) {
          const res = await axiosInstance.post(`/messages/send/${newConversation._id}`, messageData);
          set({ messages: [...get().messages, res.data] });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to send message");
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

  subscribeToMessages: () => {
    const { selectedConversation, selectedContact, contactType } = get();
    if (!selectedConversation && !selectedContact) return;

    const socket = useAuthStore.getState().socket;

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
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedConversation: (conversation) => {
    set({ 
      selectedConversation: conversation,
      selectedContact: null,
      contactType: "user",
      messages: []
    });
  },

  setSelectedContact: async (contact, type = "user") => {
    const { createConversation, getConversations } = get();
    
    set({ 
      selectedContact: contact, 
      selectedConversation: null,
      contactType: type,
      messages: [] // Clear messages when switching contacts
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

  // Legacy support - can be removed later
  setSelectedUser: (selectedUser) => set({ 
    selectedContact: selectedUser, 
    contactType: "user",
    messages: []
  }),
}));
