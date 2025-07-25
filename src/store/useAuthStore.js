import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" 
  ? "http://localhost:5002" 
  : import.meta.env.VITE_SOCKET_URL || "https://chitchatbeexpressjs-production.up.railway.app";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

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

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || socket?.connected) return;

    console.log("Connecting socket for user:", authUser.fullName, "ID:", authUser._id);

    const newSocket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    set({ socket: newSocket });

    // SỬA LỖI: Cleanup existing listeners trước khi add new ones
    newSocket.removeAllListeners();

    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("Received online users:", userIds);
      set({ onlineUsers: userIds });
    });

    newSocket.on("connect", () => {
      console.log("Socket connected successfully!");
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      set({ onlineUsers: [] });
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error("Connection error occurred");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      // SỬA LỖI: Cleanup tất cả listeners trước khi disconnect
      socket.removeAllListeners();
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },

  // Thêm method cleanup manual nếu cần
  cleanupSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      if (socket.connected) {
        socket.disconnect();
      }
      set({ socket: null, onlineUsers: [] });
    }
  }
}));

// Thêm cleanup khi browser/tab đóng
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useAuthStore.getState().cleanupSocket();
  });
}
