import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5002" : import.meta.env.VITE_SOCKET_URL || "https://chitchat_be_express-js.railway.internal";

export const useAuthStoreEnhanced = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  
  // Enhanced connection management
  connectionState: 'disconnected', // 'connected', 'disconnected', 'connecting', 'reconnecting'
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000, // Start with 1 second
  maxReconnectDelay: 30000, // Max 30 seconds

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // Enhanced socket connection with reconnection logic
  connectSocket: () => {
    const { authUser, socket, connectionState } = get();
    if (!authUser || (socket?.connected && connectionState === 'connected')) return;

    set({ connectionState: 'connecting' });

    const newSocket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    // Connection successful
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      set({ 
        socket: newSocket, 
        connectionState: 'connected',
        reconnectAttempts: 0,
        reconnectDelay: 1000
      });
      
      // Process any queued messages
      const chatStore = window.chatStore; // We'll need to access this
      if (chatStore?.processMessageQueue) {
        chatStore.processMessageQueue();
      }
    });

    // Handle online users updates
    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // Handle presence updates
    newSocket.on("presenceUpdate", ({ userId, status, lastSeen }) => {
      // Update user presence in the store
      console.log(`User ${userId} is now ${status}`, lastSeen);
    });

    // Connection error
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      set({ connectionState: 'disconnected' });
      get().handleReconnection();
    });

    // Disconnection
    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      set({ connectionState: 'disconnected' });
      
      // Only attempt reconnection if it wasn't a manual disconnect
      if (reason !== "io client disconnect") {
        get().handleReconnection();
      }
    });

    // Handle socket errors
    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error("Connection error occurred");
    });

    set({ socket: newSocket });
  },

  // Enhanced reconnection logic with exponential backoff
  handleReconnection: () => {
    const { 
      reconnectAttempts, 
      maxReconnectAttempts, 
      reconnectDelay, 
      maxReconnectDelay,
      authUser 
    } = get();

    if (!authUser || reconnectAttempts >= maxReconnectAttempts) {
      set({ connectionState: 'disconnected' });
      if (reconnectAttempts >= maxReconnectAttempts) {
        toast.error("Unable to reconnect. Please refresh the page.");
      }
      return;
    }

    set({ 
      connectionState: 'reconnecting',
      reconnectAttempts: reconnectAttempts + 1 
    });

    const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts), maxReconnectDelay);

    setTimeout(() => {
      console.log(`Reconnection attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
      get().connectSocket();
    }, delay);
  },

  // Manual reconnection
  reconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ reconnectAttempts: 0 });
    get().connectSocket();
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
    }
    set({ 
      socket: null, 
      connectionState: 'disconnected',
      reconnectAttempts: 0 
    });
  },

  // Get connection status for UI
  getConnectionStatus: () => {
    const { connectionState, reconnectAttempts } = get();
    return {
      state: connectionState,
      attempts: reconnectAttempts,
      isConnected: connectionState === 'connected',
      isReconnecting: connectionState === 'reconnecting'
    };
  },

  // Check if user is online
  isUserOnline: (userId) => {
    const { onlineUsers } = get();
    return onlineUsers.includes(userId);
  },

  // Get socket instance for other stores
  getSocket: () => {
    return get().socket;
  }
}));

