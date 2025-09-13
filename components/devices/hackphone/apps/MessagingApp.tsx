"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSocket } from '@/hooks/useSocket';
import { logger } from '@/lib/logger';

interface MessageData {
  id: string;
  sender: string;
  senderPhone: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isScam?: boolean;
  rewardAmount?: number;
  lossAmount?: number;
  processed?: boolean;
  outcome?: 'gain' | 'loss' | 'neutral';
}

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isSent: boolean;
  status?: "sent" | "delivered" | "read";
  type?: 'system' | 'regular';
  isScam?: boolean;
  rewardAmount?: number;
  lossAmount?: number;
  processed?: boolean;
  outcome?: 'gain' | 'loss' | 'neutral';
}

interface Conversation {
  id: string;
  contactName: string;
  contactPhone?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
  type?: 'system' | 'regular';
}

interface MessagingAppProps {
  time?: Date;
  teamId?: string;
}

interface TeamWallet {
  walletAddress: string;
  privateKey: string;
  bitcoinBalance: number;
}

const MessagingApp: React.FC<MessagingAppProps> = ({ teamId }) => {
  const [currentView, setCurrentView] = useState<"conversations" | "chat" | "compose">("conversations");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [teamWallet, setTeamWallet] = useState<TeamWallet | null>(null);
  const { socket, isConnected, joinTeam } = useSocket();

  // System SMS conversations - no static messages
  const [systemConversations, setSystemConversations] = useState<Conversation[]>([]);
  
  const conversations = systemConversations.sort((a, b) => 
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

  // Fetch team wallet information
  const fetchTeamWallet = useCallback(async () => {
    if (!teamId) return;
    
    try {
      const response = await fetch(`/api/team/${teamId}/wallet`);
      const data = await response.json();
      
      if (data.success) {
        setTeamWallet(data.wallet);
      }
    } catch (error) {
      logger.error('Failed to fetch team wallet:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  }, [teamId]);

  // Fetch system SMS messages
  const fetchSystemMessages = useCallback(async () => {
    if (!teamId) return;
    
    try {
      const response = await fetch(`/api/extract/get-messages?teamId=${teamId}&type=sms`, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success) {
        // Group SMS messages by sender
        const messagesBySender: Record<string, MessageData[]> = {};
        
        data.messages.forEach((msg: MessageData) => {
          const sender = msg.sender;
          if (!messagesBySender[sender]) {
            messagesBySender[sender] = [];
          }
          messagesBySender[sender].push(msg);
        });
        
        // Create conversations from grouped messages
        const systemConvs: Conversation[] = Object.entries(messagesBySender).map(([sender, messages]) => {
          const sortedMessages = messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          const latestMessage = sortedMessages[sortedMessages.length - 1];
          
          const formattedMessages: Message[] = sortedMessages.map(msg => ({
            id: msg.id,
            text: msg.content,
            timestamp: new Date(msg.timestamp),
            isSent: false,
            status: "delivered" as const,
            type: 'system',
            isScam: msg.isScam,
            rewardAmount: msg.rewardAmount,
            lossAmount: msg.lossAmount,
            processed: msg.processed,
            outcome: msg.outcome
          }));
          
          return {
            id: `system-${sender}`,
            contactName: sender,
            contactPhone: messages[0].senderPhone,
            lastMessage: latestMessage.content,
            lastMessageTime: new Date(latestMessage.timestamp),
            unreadCount: messages.filter((m: MessageData) => !m.isRead).length,
            messages: formattedMessages,
            type: 'system'
          };
        });
        
        setSystemConversations(systemConvs);
      }
    } catch (error) {
      logger.error('Failed to fetch system messages:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      fetchSystemMessages();
      fetchTeamWallet();
      const interval = setInterval(fetchSystemMessages, 30000);
      // Join socket team room and subscribe to message-created for SMS
      joinTeam(teamId);
      const onCreated = (evt: { teamId: string; type: 'sms'|'email'; id: string; content: string; sender?: string; timestamp: number; }) => {
        if (evt.type === 'sms' && evt.teamId === teamId) {
          fetchSystemMessages();
        }
      };
      if (socket && isConnected) {
        socket.on('message-created', onCreated);
      }
      return () => {
        clearInterval(interval);
        if (socket) socket.off('message-created', onCreated);
      };
    }
  }, [teamId, fetchSystemMessages, fetchTeamWallet, joinTeam, socket, isConnected]);

  const handleMessageOpen = async (message: Message, conversation: Conversation) => {
    if (message.type === 'system' && teamId) {
      setLoading(true);
      try {
    const response = await fetch('/api/extract/open-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
      teamId,
      messageId: message.id,
      messageType: 'sms'
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Mark as read only; do not set processed here
          setSystemConversations(prev => prev.map(conv => {
            if (conv.id === conversation.id) {
              return {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === message.id
                    ? { ...msg, status: "read" as const }
                    : msg
                ),
                unreadCount: Math.max(0, conv.unreadCount - 1)
              };
            }
            return conv;
          }));
          setNotification('SMS opened');
          setTimeout(() => setNotification(null), 2000);
        }
      } catch (error) {
        logger.error('Failed to process SMS open:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        setNotification('Error processing SMS');
        setTimeout(() => setNotification(null), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const sendMessage = async () => {
    if (newMessage.trim() && selectedConversation) {
      const message: Message = {
        id: `sent-${Date.now()}`,
        text: newMessage,
        timestamp: new Date(),
        isSent: true,
        status: "delivered",
        type: 'regular'
      };

      // Add message to conversation
      const updatedConversation = {
        ...selectedConversation,
        messages: [...selectedConversation.messages, message],
        lastMessage: newMessage,
        lastMessageTime: new Date()
      };

      if (selectedConversation.type === 'system') {
        setSystemConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id ? updatedConversation : conv
        ));
      }

      setSelectedConversation(updatedConversation);
      const replyText = newMessage;
      setNewMessage("");

      // If replying to a system conversation, attempt reward claim via reply endpoint
      if (selectedConversation.type === 'system') {
        try {
          const lastSystemMsg = [...selectedConversation.messages].reverse().find(m => !m.isSent && m.type === 'system');
          if (lastSystemMsg && teamId) {
            const resp = await fetch('/api/extract/reply-message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ teamId, messageId: lastSystemMsg.id, messageType: 'sms', replyText })
            });
            const result = await resp.json();
            if (result.success) {
              const delta = typeof result.balanceChange === 'number' ? result.balanceChange : 0;
              if (result.alreadyProcessed) {
                setNotification('✓ Reward already claimed');
                // Mark as processed locally if not set
                const updatedConv = {
                  ...updatedConversation,
                  messages: updatedConversation.messages.map(m => 
                    m.id === lastSystemMsg.id ? { ...m, processed: true, outcome: m.outcome || 'gain' } : m
                  )
                };
                setSelectedConversation(updatedConv);
                setSystemConversations(prev => prev.map(conv => 
                  conv.id === selectedConversation.id ? updatedConv : conv
                ));
              } else {
                setNotification(`🎉 Reply accepted. +${delta} BTC`);
                
                // Add automatic system response
                const systemResponse: Message = {
                  id: `system-response-${Date.now()}`,
                  text: `Thank you! Your reward of ${delta} BTC has been credited to your account. No further replies are needed.`,
                  timestamp: new Date(),
                  isSent: false,
                  status: "delivered",
                  type: 'system'
                };

                // Update conversation with processed state and add system response
                const updatedConvWithResponse = {
                  ...updatedConversation,
                  messages: [
                    ...updatedConversation.messages.map(m => 
                      m.id === lastSystemMsg.id ? { ...m, processed: true, outcome: 'gain' as const } : m
                    ),
                    systemResponse
                  ],
                  lastMessage: systemResponse.text,
                  lastMessageTime: systemResponse.timestamp
                };
                
                setSelectedConversation(updatedConvWithResponse);
                setSystemConversations(prev => prev.map(conv => 
                  conv.id === selectedConversation.id ? updatedConvWithResponse : conv
                ));
              }
            } else if (result.error) {
              setNotification(result.error);
            }
          }
        } catch (err) {
          logger.error('Reply claim failed:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
          setNotification('Reply failed');
        } finally {
          setTimeout(() => setNotification(null), 2500);
        }
      }
    }
  };

  const handleDeleteConversation = async () => {
    if (selectedConversation && selectedConversation.type === 'system' && teamId) {
      try {
        // Collect underlying message IDs (only system messages have real IDs)
        const ids = selectedConversation.messages
          .filter(m => !m.isSent && m.type === 'system')
          .map(m => m.id);
        if (ids.length) {
          await fetch('/api/extract/delete-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId, messageType: 'sms', messageIds: ids })
          });
        }
      } catch (e) {
        logger.error('Failed to delete messages from DB:', { error: e instanceof Error ? e.message : 'Unknown error' }, e as Error);
      } finally {
        // Remove conversation from UI regardless
        setSystemConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id));
        setCurrentView("conversations");
        setSelectedConversation(null);
        setNotification("Conversation deleted");
        setTimeout(() => setNotification(null), 2000);
      }
    }
  };

  const renderConversationsView = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gray-100 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-black text-lg font-semibold">Messages</h1>
          <button 
            onClick={() => setCurrentView("compose")}
            className="bg-[#007aff] hover:bg-[#0056cc] text-white px-3 py-1 rounded-full text-sm"
          >
            Compose
          </button>
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => {
              setSelectedConversation(conversation);
              setCurrentView("chat");
            }}
            className={`
              flex items-center p-4 cursor-pointer transition-colors border-b border-gray-100
              ${conversation.unreadCount > 0 ? 'bg-blue-50' : 'bg-white'}
              hover:bg-gray-50
              ${conversation.type === 'system' ? 'border-l-4 border-blue-500' : ''}
            `}
          >
            {/* Avatar */}
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-3
              ${conversation.type === 'system' ? 'bg-blue-600' : 'bg-gray-500'}
            `}>
              {conversation.contactName.charAt(0).toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-medium text-black ${conversation.unreadCount > 0 ? 'font-bold' : ''}`}>
                  {conversation.contactName}
                  {conversation.type === 'system' && ' 📱'}
                </span>
                <div className="flex items-center space-x-2">
                  {conversation.type === 'system' && conversation.messages.some(m => m.processed && m.outcome === 'gain') && (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300 text-xs">✓ Claimed</span>
                  )}
                  <span className="text-xs text-gray-500">
                    {formatTime(conversation.lastMessageTime)}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600 truncate">
                {conversation.lastMessage}
              </div>
            </div>
          </div>
        ))}
        
        {conversations.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No messages
          </div>
        )}
      </div>
      
      {/* Notification overlay */}
      {notification && (
        <div className="absolute top-4 left-4 right-4 bg-black/80 text-white p-3 rounded-lg text-center z-50">
          {notification}
        </div>
      )}
    </div>
  );

  const renderChatView = () => {
    if (!selectedConversation) return null;

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="bg-gray-100 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => setCurrentView("conversations")}
                className="text-blue-500 mr-3"
              >
                ← Back
              </button>
              <div>
                <h2 className="text-black font-semibold">{selectedConversation.contactName}</h2>
                {selectedConversation.contactPhone && (
                  <p className="text-xs text-gray-500">{selectedConversation.contactPhone}</p>
                )}
              </div>
            </div>
            {selectedConversation.type === 'system' && (
              <button
                onClick={handleDeleteConversation}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        {/* Claimed banner in chat header area */}
        {selectedConversation.type === 'system' && selectedConversation.messages.some(m => !m.isSent && m.processed && m.outcome === 'gain') && (
          <div className="bg-green-50 text-green-700 border border-green-200 mx-4 mt-3 px-3 py-2 rounded text-sm">✓ Reward Already Claimed</div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
          {selectedConversation.messages.map((message) => (
            <div key={message.id} className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}>
              <div
                onClick={() => handleMessageOpen(message, selectedConversation)}
                className={`
                  max-w-xs lg:max-w-md px-4 py-2 rounded-lg cursor-pointer
                  ${message.isSent 
                    ? 'bg-[#007aff] text-white' 
          : message.type === 'system' && message.rewardAmount
                        ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-white text-black border border-gray-200'
                  }
                  ${message.type === 'system' && !message.processed ? 'shadow-lg ring-2 ring-blue-400' : ''}
                `}
              >
                {/* System message indicators */}
                {message.type === 'system' && (
                  <div className="text-xs mb-1 opacity-70">
                    {message.processed ? (
                      <span>
                        ✓ Processed
                        {message.outcome === 'gain' && ` (+${message.rewardAmount} BTC)`}
                        {message.outcome === 'loss' && ` (-${message.lossAmount} BTC)`}
                      </span>
                    ) : message.rewardAmount ? (
                      <div className="space-y-1">
                        <span>💰 Reward available - tap to claim</span>
                        {!message.processed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const walletAddr = teamWallet?.walletAddress || "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
                              const privateKey = teamWallet?.privateKey || "5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ";
                              setNewMessage(`${walletAddr} ${privateKey}`);
                            }}
                            className="block bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                          >
                            Quick Reply for Reward
                          </button>
                        )}
                      </div>
                    ) : (
                      <span>📱 System message - tap to open</span>
                    )}
                  </div>
                )}
                
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 opacity-70 ${message.isSent ? 'text-white' : 'text-gray-500'}`}>
                  {formatTime(message.timestamp)}
                  {message.isSent && (
                    <span className="ml-2">
                      {message.status === "sent" && "✓"}
                      {message.status === "delivered" && "✓✓"}
                      {message.status === "read" && "✓✓"}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick reply button for system conversations */}
  {selectedConversation.type === 'system' && (
          <div className="bg-gray-100 px-4 py-2 border-t border-gray-200">
            {(() => {
              const lastSystemMsg = [...selectedConversation.messages].reverse().find(m => !m.isSent && m.type === 'system' && !m.processed);
              const processed = !lastSystemMsg; // if no unprocessed system msg, treat as processed
              
              if (processed) {
                return (
                  <div className="w-full bg-gray-400 text-white px-3 py-2 rounded-lg text-sm text-center">
                    ✓ Already Processed
                  </div>
                );
              }
              
              return (
                <button
                  onClick={() => {
                    if (!lastSystemMsg) return;
                    const walletAddr = teamWallet?.walletAddress || "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
                    const privateKey = teamWallet?.privateKey || "5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ";
                    setNewMessage(`${walletAddr} ${privateKey}`);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm"
  disabled={!lastSystemMsg}
                >
                  💰 Quick Reply with Wallet Info
                </button>
              );
            })()}
          </div>
        )}

        {/* Input area */}
        <div className="bg-white p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="iMessage"
              className="flex-1 bg-gray-100 text-black px-4 py-2 rounded-full border border-gray-300 outline-none focus:border-blue-500"
            />
            <button 
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-[#007aff] hover:bg-[#0056cc] disabled:bg-gray-400 text-white px-4 py-2 rounded-full text-sm"
            >
              Send
            </button>
          </div>
        </div>
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg text-black">
              Processing SMS...
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderComposeView = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gray-100 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setCurrentView("conversations")}
            className="text-blue-500"
          >
            Cancel
          </button>
          <h1 className="text-black font-semibold">New Message</h1>
          <button 
            onClick={() => {
              // Handle compose send
              setCurrentView("conversations");
              setComposeRecipient("");
              setComposeMessage("");
            }}
            className="text-blue-500"
          >
            Send
          </button>
        </div>
      </div>

      {/* Compose form */}
      <div className="flex-1 p-4 space-y-4">
        <div>
          <label className="block text-black text-sm mb-2">To:</label>
          <input
            type="text"
            value={composeRecipient}
            onChange={(e) => setComposeRecipient(e.target.value)}
            className="w-full bg-gray-100 text-black px-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-blue-500"
            placeholder="Contact name or number"
          />
        </div>
        
        <div className="flex-1">
          <label className="block text-black text-sm mb-2">Message:</label>
          <textarea
            value={composeMessage}
            onChange={(e) => setComposeMessage(e.target.value)}
            className="w-full h-64 bg-gray-100 text-black px-4 py-2 rounded-lg border border-gray-300 outline-none resize-none focus:border-blue-500"
            placeholder="Type your message..."
          />
        </div>
      </div>
    </div>
  );

  switch (currentView) {
    case "conversations":
      return renderConversationsView();
    case "chat":
      return renderChatView();
    case "compose":
      return renderComposeView();
    default:
      return renderConversationsView();
  }
};

export default MessagingApp;
