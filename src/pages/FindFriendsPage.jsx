import { useState } from "react";
import { Search, UserPlus, ArrowLeft } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const FindFriendsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());

  const handleSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await axiosInstance.get(`/friends/search?query=${encodeURIComponent(query.trim())}`);
      setSearchResults(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to search users");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await axiosInstance.post("/friends/request", { userId });
      setSentRequests(prev => new Set([...prev, userId]));
      toast.success("Friend request sent!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send friend request");
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="h-screen bg-base-100">
      <div className="flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-4 p-6 border-b border-base-300">
            <Link to="/" className="btn btn-ghost btn-circle">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Find Friends</h1>
              <p className="text-base-content/70">Search for people to connect with</p>
            </div>
          </div>

          {/* Search Input */}
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name or email..."
                className="input input-bordered w-full pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          <div className="px-6 pb-6">
            {isSearching ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : searchQuery.length >= 2 ? (
              searchResults.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-medium text-lg mb-4">Search Results</h3>
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-12 h-12 rounded-full">
                            <img
                              src={user.profilePic || "/avatar.png"}
                              alt={user.fullName}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-sm text-base-content/70">{user.email}</div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => sendFriendRequest(user._id)}
                        disabled={sentRequests.has(user._id)}
                        className={`btn btn-sm ${
                          sentRequests.has(user._id) 
                            ? "btn-disabled" 
                            : "btn-primary"
                        }`}
                      >
                        {sentRequests.has(user._id) ? (
                          <span>Sent</span>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Add Friend
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-base-content/70">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users found matching "{searchQuery}"</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-base-content/70">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter at least 2 characters to search for users</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindFriendsPage;