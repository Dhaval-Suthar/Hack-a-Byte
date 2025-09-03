"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { createChatMessage, getTeamMessages, markMessageAsRead } from "@/app/actions/chatMessage";
import { useSocket } from "@/hooks/useSocket";

interface ChatMessage {
  _id: string;
  content: string;
  senderId: {
    _id: string;
    username: string;
    avatar?: string;
  };
  messageType: 'text' | 'system' | 'game_event' | 'achievement' | 'attack_alert' | 'defense_alert';
  createdAt: string;
  edited: boolean;
  editedAt?: string;
  readBy: string[];
  reactions: Array<{
    emoji: string;
    userId: string;
    username: string;
    timestamp: string;
  }>;
  replyTo?: {
    _id: string;
    content: string;
    senderId: {
      username: string;
    };
  };
}

interface ChatInterfaceProps {
  roomId?: string;
  height?: string;
}

export function ChatInterface({ roomId = 'general', height = '600px' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    loadMessages();
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('newMessage', (message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
      });

      socket.on('messageUpdated', (updatedMessage: ChatMessage) => {
        setMessages(prev => prev.map(msg =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        ));
      });

      return () => {
        socket.off('newMessage');
        socket.off('messageUpdated');
      };
    }
  }, [socket, isConnected]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      // TODO: Get teamId from authentication context
      const teamId = 'placeholder-team-id';
      const result = await getTeamMessages(teamId);
      if (result.success && result.messages) {
        setMessages(result.messages as unknown as ChatMessage[]);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      // TODO: Get senderId and teamId from authentication context
      const senderId = 'placeholder-user-id';
      const teamId = 'placeholder-team-id';

      const result = await createChatMessage({
        senderId,
        content: newMessage.trim(),
        type: 'text',
        teamId,
        isPrivate: false,
        priority: 'normal'
      });

      if (result.success) {
        setNewMessage('');
        // Message will be added via socket event
      } else {
        alert(result.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (messageId: string) => {
    try {
      // TODO: Get userId from authentication context
      const userId = 'placeholder-user-id';

      const result = await markMessageAsRead(messageId, userId);
      if (!result.success) {
        console.error('Failed to mark message as read');
      }
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'bg-gray-100 border-gray-300';
      case 'game_event': return 'bg-blue-100 border-blue-300';
      case 'achievement': return 'bg-purple-100 border-purple-300';
      case 'attack_alert': return 'bg-red-100 border-red-300';
      case 'defense_alert': return 'bg-green-100 border-green-300';
      default: return 'bg-white border-gray-200';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return 'ℹ️';
      case 'game_event': return '🎮';
      case 'achievement': return '🏆';
      case 'attack_alert': return '⚠️';
      case 'defense_alert': return '🛡️';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md" style={{ height }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Chat</h3>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Room: {roomId}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex gap-3 ${getMessageTypeColor(message.messageType)} p-3 rounded-lg border`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                  {message.senderId?.avatar ? (
                    <Image
                      src={message.senderId.avatar}
                      alt={message.senderId.username}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    message.senderId?.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {message.senderId?.username || 'Unknown'}
                  </span>
                  {message.messageType !== 'text' && (
                    <span className="text-xs px-2 py-1 rounded bg-gray-200">
                      {getMessageTypeIcon(message.messageType)} {message.messageType.replace('_', ' ')}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                  {message.edited && (
                    <span className="text-xs text-gray-400">(edited)</span>
                  )}
                </div>

                {message.replyTo && (
                  <div className="mb-2 p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                    <div className="text-xs text-gray-600">
                      Replying to {message.replyTo.senderId?.username}
                    </div>
                    <div className="text-sm text-gray-700 truncate">
                      {message.replyTo.content}
                    </div>
                  </div>
                )}

                <div className="text-gray-700 break-words">
                  {message.content}
                </div>

                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {message.reactions.map((reaction, index) => (
                      <button
                        key={index}
                        onClick={() => handleReaction(message._id)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors"
                      >
                        {reaction.emoji} {reaction.username === 'current-user' ? '' : reaction.username}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function ChatWidget({ roomId = 'general' }: { roomId?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors relative"
        >
          <span className="text-xl">💬</span>
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] z-40">
          <ChatInterface roomId={roomId} height="500px" />
        </div>
      )}
    </>
  );
}
