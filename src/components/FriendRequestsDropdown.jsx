import { useState, useEffect, useRef } from "react";
import { Bell, Check, X, Users } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { formatMessageTime } from "../lib/utils";

const FriendRequestsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchFriendRequests();
    }
  }, [isOpen]);

  const fetchFriendRequests = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/friends/requests");
      setRequests(res.data);
    } catch (error) {
      toast.error("Failed to fetch friend requests");
    } finally {
      setIsLoading(false);
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      await axiosInstance.put(`/friends/respond/${requestId}`, { action });
      
      // Remove the request from the list
      setRequests(prev => prev.filter(req => req._id !== requestId));
      
      if (action === "accept") {
        toast.success("Friend request accepted!");
      } else {
        toast.success("Friend request declined");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${action} friend request`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-circle relative"
      >
        <Bell className="w-5 h-5" />
        {requests.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {requests.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-base-100 rounded-lg shadow-lg border border-base-300 z-50">
          {/* Header */}
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h3 className="font-semibold">Friend Requests</h3>
              {requests.length > 0 && (
                <span className="badge badge-primary badge-sm">{requests.length}</span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : requests.length > 0 ? (
              <div className="p-2">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg"
                  >
                    {/* Avatar */}
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        <img
                          src={request.senderId.profilePic || "/avatar.png"}
                          alt={request.senderId.fullName}
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {request.senderId.fullName}
                      </div>
                      <div className="text-sm text-base-content/70 truncate">
                        {request.senderId.email}
                      </div>
                      <div className="text-xs text-base-content/50">
                        {formatMessageTime(request.createdAt)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => respondToRequest(request._id, "accept")}
                        className="btn btn-success btn-xs"
                        title="Accept"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => respondToRequest(request._id, "decline")}
                        className="btn btn-error btn-xs"
                        title="Decline"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-base-content/70">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No friend requests</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {requests.length > 0 && (
            <div className="p-3 border-t border-base-300">
              <button
                onClick={fetchFriendRequests}
                className="btn btn-ghost btn-sm w-full"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendRequestsDropdown;