import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import DOMPurify from 'dompurify';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import ErrorBoundary from "./ErrorBoundary";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Bot } from "lucide-react";

// Safe Markdown component với XSS protection
const SafeMarkdown = ({ text }) => {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      console.warn("Invalid text for markdown:", text);
      return <p>{text || ""}</p>;
    }

    // SỬA LỖI: Sanitize input trước khi render markdown
    const sanitizedText = DOMPurify.sanitize(text.trim(), {
      // Chỉ cho phép safe HTML tags
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'],
      ALLOWED_ATTR: [],
      // Remove scripts và các attributes nguy hiểm
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style']
    });

    if (sanitizedText === '') {
      return null;
    }

    return (
      <ReactMarkdown 
        className="prose prose-sm max-w-none text-white"
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom components với security
          h1: ({children}) => <h1 className="text-lg font-bold">{children}</h1>,
          h2: ({children}) => <h2 className="text-md font-bold">{children}</h2>,
          h3: ({children}) => <h3 className="text-sm font-bold">{children}</h3>,
          p: ({children}) => <p className="mb-2">{children}</p>,
          strong: ({children}) => <strong className="font-bold">{children}</strong>,
          em: ({children}) => <em className="italic">{children}</em>,
          ul: ({children}) => <ul className="list-disc list-inside">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal list-inside">{children}</ol>,
          li: ({children}) => <li>{children}</li>,
          code: ({node, inline, className, children, ...props}) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={tomorrow}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-gray-700 px-1 rounded" {...props}>
                {children}
              </code>
            );
          },
          // Block dangerous elements
          script: () => null,
          iframe: () => null,
          object: () => null,
          embed: () => null,
          form: () => null,
          input: () => null,
          button: () => null,
        }}
      >
        {sanitizedText}
      </ReactMarkdown>
    );
  } catch (error) {
    console.error("Error in SafeMarkdown:", error, "Text:", text);
    // Fallback to safe plain text
    return <p className="text-red-200">⚠️ Content could not be displayed safely</p>;
  }
};

const ChatContainer = () => {
  console.log("=== ChatContainer component started ===");
  
  const {
    messages,
    getMessages,
    getChatbotMessages,
    isMessagesLoading,
    selectedConversation,
    selectedContact,
    contactType,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  
  console.log("ChatContainer hooks completed, state:", {
    messagesLength: messages?.length,
    selectedContact: selectedContact?._id,
    contactType,
    authUser: authUser?._id
  });

  // Safe fallbacks for data handling
  if (!authUser) {
    return null;
  }

  // Error boundary for chatbot rendering
  if (contactType === "chatbot" && !selectedContact) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="flex-1 flex items-center justify-center">
          <p>No chatbot selected</p>
        </div>
      </div>
    );
  }

  // Debug logging for troubleshooting
  console.log("ChatContainer Render Debug:", {
    contactType,
    selectedContact: selectedContact ? {
      _id: selectedContact._id,
      name: selectedContact.name || selectedContact.fullName,
      type: typeof selectedContact
    } : null,
    messagesArray: Array.isArray(messages),
    messagesLength: messages?.length,
    isLoading: isMessagesLoading
  });

  useEffect(() => {
    console.log("ChatContainer useEffect triggered with:", {
      selectedConversation: selectedConversation?._id,
      selectedContact: selectedContact?._id,
      contactType
    });
    
    try {
      // SỬA LỖI: Always unsubscribe first để tránh duplicate listeners
      unsubscribeFromMessages();
      
      if (selectedConversation?._id) {
        console.log("Calling getMessages for conversation:", selectedConversation._id);
        getMessages(selectedConversation._id)
          .then(() => {
            // SỬA LỖI: Subscribe immediately after messages are loaded
            console.log("Messages loaded, subscribing to socket events");
            subscribeToMessages();
          })
          .catch((error) => {
            console.error("Error loading messages:", error);
            // Still subscribe even if messages fail to load
            subscribeToMessages();
          });
      } else if (selectedContact?._id && contactType === "chatbot") {
        console.log("Calling getChatbotMessages for chatbot:", selectedContact._id);
        getChatbotMessages(selectedContact._id)
          .then(() => {
            console.log("Chatbot messages loaded, subscribing to socket events");
            subscribeToMessages();
          })
          .catch((error) => {
            console.error("Error loading chatbot messages:", error);
            // Still subscribe even if messages fail to load
            subscribeToMessages();
          });
      }
    } catch (error) {
      console.error("Error in ChatContainer useEffect:", error);
    }

    return () => {
      try {
        unsubscribeFromMessages();
      } catch (error) {
        console.error("Error in unsubscribeFromMessages:", error);
      }
    };
  }, [selectedConversation?._id, selectedContact?._id, contactType]);

  useEffect(() => {
    try {
      console.log("Scroll useEffect triggered, messages:", messages?.length);
      if (messageEndRef.current && messages) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error in scroll useEffect:", error);
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ErrorBoundary>
        <ChatHeader />
      </ErrorBoundary>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(messages || []).map((message, index) => {
          try {
            // Safe handling of message data
            if (!message || !message._id) {
              console.warn(`Message at index ${index} is invalid:`, message);
              return null;
            }
            
            // Handle both populated (object) and non-populated (string) senderId
            const senderId = message.senderId?._id || message.senderId;
            const isOwnMessage = senderId === authUser?._id;
            
            console.log(`Rendering message ${index}:`, {
              messageId: message._id,
              senderId,
              isOwnMessage,
              contactType,
              hasText: !!message.text,
              hasImage: !!message.image
            });
          
          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  {isOwnMessage ? (
                    <img
                      src={authUser?.profilePic || "/avatar.png"}
                      alt="profile pic"
                      onError={(e) => {e.target.src = "/avatar.png"}}
                    />
                  ) : contactType === "chatbot" ? (
                    <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Bot className="size-6 text-primary" />
                    </div>
                  ) : message.senderId && typeof message.senderId === 'object' ? (
                    <img
                      src={message.senderId?.profilePic || "/avatar.png"}
                      alt={message.senderId?.fullName || "User"}
                      onError={(e) => {e.target.src = "/avatar.png"}}
                    />
                  ) : (
                    <img
                      src="/avatar.png"
                      alt="profile pic"
                      onError={(e) => {e.target.src = "/avatar.png"}}
                    />
                  )}
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {message.createdAt ? formatMessageTime(message.createdAt) : ""}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {typeof message.text === 'string' && message.text.trim() !== '' && (
                  contactType === "chatbot" ? (
                    <SafeMarkdown text={message.text} />
                  ) : (
                    <p>{message.text}</p>
                  )
                )}
              </div>
            </div>
          );
          } catch (error) {
            console.error(`Error rendering message at index ${index}:`, error, message);
            return (
              <div key={`error-${index}`} className="text-red-500 p-2">
                Error rendering message {index}: {error.message}
              </div>
            );
          }
        })}
      </div>

      <ErrorBoundary>
        <MessageInput />
      </ErrorBoundary>
    </div>
  );
};
export default ChatContainer;
