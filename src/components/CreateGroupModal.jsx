import { useState, useEffect } from "react";
import { X, Users, Plus } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { contacts, getContacts, createConversation, setSelectedConversation } = useChatStore();

  useEffect(() => {
    if (isOpen && contacts.length === 0) {
      getContacts();
    }
  }, [isOpen, contacts.length, getContacts]);

  const handleUserToggle = (user) => {
    setSelectedUsers(prev => 
      prev.find(u => u._id === user._id)
        ? prev.filter(u => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (selectedUsers.length < 1) {
      toast.error("Please select at least one member");
      return;
    }

    setIsLoading(true);
    try {
      const participantIds = selectedUsers.map(user => user._id);
      const conversation = await createConversation(participantIds, groupName.trim(), true);
      setSelectedConversation(conversation);
      toast.success("Group created successfully!");
      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setGroupName("");
    setSelectedUsers([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Create Group Chat</h2>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto">
          {/* Group Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="input input-bordered w-full"
              maxLength={50}
            />
          </div>

          {/* Members Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select Members ({selectedUsers.length} selected)
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {contacts.map((user) => (
                <label
                  key={user._id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.find(u => u._id === user._id) ? true : false}
                    onChange={() => handleUserToggle(user)}
                    className="checkbox checkbox-sm"
                  />
                  <div className="avatar">
                    <div className="w-8 h-8 rounded-full">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{user.fullName}</div>
                    <div className="text-xs text-base-content/70">{user.email}</div>
                  </div>
                </label>
              ))}
              {contacts.length === 0 && (
                <div className="text-center py-4 text-base-content/70">
                  No friends available. Add friends first!
                </div>
              )}
            </div>
          </div>

          {/* Selected Users Preview */}
          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Selected Members</label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
                  >
                    <span>{user.fullName}</span>
                    <button
                      onClick={() => handleUserToggle(user)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-base-300">
          <button
            onClick={handleClose}
            className="btn btn-ghost flex-1"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            className="btn btn-primary flex-1"
            disabled={isLoading || !groupName.trim() || selectedUsers.length === 0}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;