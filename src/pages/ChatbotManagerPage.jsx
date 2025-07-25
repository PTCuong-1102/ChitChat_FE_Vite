import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { SUPPORTED_LLM_MODELS } from "../constants";
import { Bot, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const ChatbotManagerPage = () => {
  const { chatbots, createChatbot, deleteChatbot, getChatbots, isChatbotsLoading } = useChatStore();
  const [showForm, setShowForm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    model: "",
    apiKey: "",
  });

  useEffect(() => {
    getChatbots();
  }, [getChatbots]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createChatbot(formData);
      setFormData({ name: "", model: "", apiKey: "" });
      setShowForm(false);
      setShowApiKey(false);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleDelete = async (chatbotId, isDefault) => {
    if (isDefault) {
      toast.error("Cannot delete default chatbot");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this chatbot?")) {
      await deleteChatbot(chatbotId);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="h-screen bg-base-100">
      <div className="flex flex-col h-full max-w-6xl mx-auto pt-20 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Chatbot Manager</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Add Chatbot
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="card bg-base-200 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title">Create New Chatbot</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Chatbot Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter chatbot name"
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">AI Model</span>
                  </label>
                  <select
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="select select-bordered"
                    required
                  >
                    <option value="">Select a model</option>
                    {SUPPORTED_LLM_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">API Key</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      name="apiKey"
                      value={formData.apiKey}
                      onChange={handleInputChange}
                      placeholder="Enter your API key"
                      className="input input-bordered w-full pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-5 h-5 text-gray-500" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                  <div className="label">
                    <span className="label-text-alt">
                      Your API key will be encrypted and stored securely
                    </span>
                  </div>
                </div>

                <div className="card-actions justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Chatbot
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Chatbots List */}
        <div className="flex-1 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Your Chatbots</h2>
          
          {isChatbotsLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : chatbots.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No chatbots yet. Create your first one!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {chatbots.map((chatbot) => (
                <div key={chatbot._id} className="card bg-base-200 shadow-lg">
                  <div className="card-body">
                    <div className="flex items-center gap-3 mb-2">
                      <Bot className="w-6 h-6 text-primary" />
                      <h3 className="card-title text-lg">{chatbot.name}</h3>
                      {chatbot.isDefault && (
                        <span className="badge badge-primary badge-sm">Default</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      Model: {SUPPORTED_LLM_MODELS.find(m => m.id === chatbot.model)?.name || chatbot.model}
                    </p>
                    
                    <div className="text-xs text-gray-500 mb-4">
                      Created: {new Date(chatbot.createdAt).toLocaleDateString()}
                    </div>

                    <div className="card-actions justify-end">
                      {!chatbot.isDefault && (
                        <button
                          onClick={() => handleDelete(chatbot._id, chatbot.isDefault)}
                          className="btn btn-error btn-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatbotManagerPage;