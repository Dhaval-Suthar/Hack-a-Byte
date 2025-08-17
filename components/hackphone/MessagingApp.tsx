"use client";

import React, { useState } from "react";

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isSent: boolean;
  status?: "sent" | "delivered" | "read";
}

interface Conversation {
  id: string;
  contactName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
}

interface MessagingAppProps {
  time?: Date;
}

const MessagingApp: React.FC<MessagingAppProps> = () => {
  const [currentView, setCurrentView] = useState<"conversations" | "chat" | "compose">("conversations");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const autoCapitalize = true; // Auto-capitalize first letter
  const [showNumbers, setShowNumbers] = useState(false); // Toggle between letters and numbers

  // Sample conversation data
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      contactName: "Terry White",
      lastMessage: "I sent you the photos for the book. Let me know what you think.",
      lastMessageTime: new Date(2011, 11, 14, 17, 2),
      unreadCount: 0,
      messages: [
        {
          id: "1",
          text: "I sent you the photos for the book. Let me know what you think.",
          timestamp: new Date(2011, 11, 14, 17, 2),
          isSent: false,
          status: "read"
        }
      ]
    },
    {
      id: "2",
      contactName: "Brad",
      lastMessage: "The model will be here at 10 tomorrow.",
      lastMessageTime: new Date(2011, 11, 14, 14, 52),
      unreadCount: 0,
      messages: [
        {
          id: "1",
          text: "The model will be here at 10 tomorrow.",
          timestamp: new Date(2011, 11, 14, 14, 52),
          isSent: false,
          status: "read"
        }
      ]
    },
    {
      id: "3",
      contactName: "Jeff Kelby",
      lastMessage: "I'm on my way over. Want to meet at City Fish?",
      lastMessageTime: new Date(2011, 11, 14, 11, 24),
      unreadCount: 0,
      messages: [
        {
          id: "1",
          text: "I'm on my way over. Want to meet at City Fish?",
          timestamp: new Date(2011, 11, 14, 11, 24),
          isSent: false,
          status: "read"
        }
      ]
    },
    {
      id: "4",
      contactName: "Paul Wilder",
      lastMessage: "When do you need me to set up the projector?",
      lastMessageTime: new Date(2011, 11, 14, 10, 49),
      unreadCount: 0,
      messages: [
        {
          id: "1",
          text: "When do you need me to set up the projector?",
          timestamp: new Date(2011, 11, 14, 10, 49),
          isSent: false,
          status: "read"
        }
      ]
    },
    {
      id: "5",
      contactName: "Matt Kloskowski",
      lastMessage: "We're shooting Photoshop User TV at 3:00.",
      lastMessageTime: new Date(2011, 11, 14, 10, 14),
      unreadCount: 1,
      messages: [
        {
          id: "1",
          text: "We're shooting Photoshop User TV at 3:00.",
          timestamp: new Date(2011, 11, 14, 10, 14),
          isSent: false,
          status: "delivered"
        },
        {
          id: "2",
          text: "Can we move it to 3:30?",
          timestamp: new Date(2011, 11, 14, 11, 23),
          isSent: true,
          status: "delivered"
        },
        {
          id: "3",
          text: "I'll check with video and let you know.",
          timestamp: new Date(2011, 11, 14, 11, 23),
          isSent: false,
          status: "delivered"
        },
        {
          id: "4",
          text: "Okay, we've moved it to 3:30.",
          timestamp: new Date(2011, 11, 14, 11, 23),
          isSent: false,
          status: "delivered"
        },
        {
          id: "5",
          text: "Great. I'll be there.",
          timestamp: new Date(2011, 11, 14, 11, 24),
          isSent: true,
          status: "sent"
        }
      ]
    }
  ]);

  // status bar time removed

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Helper function to determine if next character should be capitalized
  const shouldCapitalize = (text: string) => {
    if (text.length === 0) return true; // First character
    const lastTwoChars = text.slice(-2);
    // Capitalize after sentence endings (. ! ?) followed by space, or at start
    return lastTwoChars.match(/[.!?]\s$/) || text.trim().length === 0;
  };

  // Handle key press with proper capitalization logic
  const handleKeyPress = (key: string, isComposeMode = false) => {
    const setter = isComposeMode ? setComposeMessage : setNewMessage;
    
    setter(prev => {
      const shouldCap = isShiftPressed || (autoCapitalize && shouldCapitalize(prev));
      const charToAdd = shouldCap ? key.toUpperCase() : key.toLowerCase();
      
      // Auto-turn off shift after typing (except for caps lock behavior)
      if (isShiftPressed && !autoCapitalize) {
        setIsShiftPressed(false);
      }
      
      return prev + charToAdd;
    });
  };

  // Toggle shift key
  const toggleShift = () => {
    setIsShiftPressed(!isShiftPressed);
  };

  // Toggle between letters and numbers
  const toggleNumbers = () => {
    setShowNumbers(!showNumbers);
    setIsShiftPressed(false); // Reset shift when switching modes
  };

  // Handle special character input
  const handleSpecialChar = (char: string, isComposeMode = false) => {
    const setter = isComposeMode ? setComposeMessage : setNewMessage;
    setter(prev => prev + char);
  };

  const renderConversationsList = () => (
    <div className="w-screen h-screen bg-white flex flex-col">
      {/* Combined Status Bar and Header */}
      <div className="bg-gradient-to-b from-[#cdd5df] to-[#a7b1bf] border-b border-[#8a95a1]">
    {/* status bar removed */}
        
        {/* Header */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Back removed per UX: stay inside Messages app */}
            <h1 className="text-[20px] font-bold text-[#1a1a1a] drop-shadow-sm">Messages</h1>
            <button 
              onClick={() => setCurrentView("compose")}
              className="text-[#1f5be6] font-bold text-[17px]"
            >
              ✎
            </button>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 bg-white">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => {
              // Mark conversation as read when opening it
              const updatedConversation = { ...conversation, unreadCount: 0 };
              setConversations(convs => 
                convs.map(conv => 
                  conv.id === conversation.id 
                    ? updatedConversation
                    : conv
                )
              );
              setSelectedConversation(updatedConversation);
              setCurrentView("chat");
            }}
            className="w-full flex items-center px-4 py-[11px] border-b border-[#e0e0e0] active:bg-[#d9d9d9] bg-white"
          >
            {/* Contact Avatar */}
            <div className="w-[43px] h-[43px] bg-gradient-to-b from-[#f7f7f7] to-[#d1d1d1] rounded-full flex items-center justify-center mr-[10px] border border-[#b4b4b4] shadow-sm">
              <span className="text-[20px] text-[#666] font-normal">👤</span>
            </div>
            
            {/* Message Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-[2px]">
                <span className="font-bold text-[17px] text-black truncate">
                  {conversation.contactName}
                </span>
                <span className="text-[15px] text-[#1f5be6] ml-2 flex-shrink-0 font-normal">
                  {formatMessageTime(conversation.lastMessageTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#666] truncate font-normal leading-tight">
                  {conversation.lastMessage}
                </span>
                <div className="flex items-center ml-2 flex-shrink-0">
                  {conversation.unreadCount > 0 && (
                    <div className="w-[20px] h-[20px] bg-[#1f5be6] rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-[12px] font-bold">
                        {conversation.unreadCount}
                      </span>
                    </div>
                  )}
                  <span className="text-[#c7c7cc] text-[17px]">›</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderChatView = () => {
    if (!selectedConversation) return null;

    const sendMessage = () => {
      if (!newMessage.trim()) return;

      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        timestamp: new Date(),
        isSent: true,
        status: "sent"
      };

      setConversations(convs => 
        convs.map(conv => 
          conv.id === selectedConversation.id 
            ? {
                ...conv,
                messages: [...conv.messages, message],
                lastMessage: newMessage,
                lastMessageTime: new Date()
              }
            : conv
        )
      );

      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, message],
        lastMessage: newMessage,
        lastMessageTime: new Date()
      } : null);

      setNewMessage("");
    };

    return (
      <div className="w-screen h-screen bg-white flex flex-col">
        {/* Combined Status Bar and Header */}
        <div className="bg-gradient-to-b from-[#cdd5df] to-[#a7b1bf] border-b border-[#8a95a1]">
          {/* Status Bar */}
          <div className="flex justify-between items-center px-4 pt-2 pb-1 text-black text-[11px] tracking-wide">
            <div className="flex items-center space-x-2">
              {/* Signal bars */}
              <div className="flex items-end space-x-[2px]">
                <div className="w-[3px] h-[6px] bg-black rounded-[1px]" />
                <div className="w-[3px] h-[8px] bg-black rounded-[1px]" />
                <div className="w-[3px] h-[10px] bg-black rounded-[1px]" />
                <div className="w-[3px] h-[8px] bg-black/60 rounded-[1px]" />
                <div className="w-[3px] h-[6px] bg-black/40 rounded-[1px]" />
              </div>
              <span className="opacity-90">Verizon</span>
              <span className="opacity-90">📶</span>
            </div>
            <div className="flex items-center space-x-2">
              {/* time removed */}
            </div>
          </div>
          
          {/* Header */}
          <div className="px-4 py-2">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => {
                  // Update the conversation in the conversations list to maintain the read status
                  if (selectedConversation) {
                    setConversations(convs => 
                      convs.map(conv => 
                        conv.id === selectedConversation.id 
                          ? selectedConversation
                          : conv
                      )
                    );
                  }
                  setCurrentView("conversations");
                }}
                className="text-[#1f5be6] font-bold text-[17px]"
              >
                ← Messages
              </button>
              <h1 className="text-[20px] font-bold text-[#1a1a1a] drop-shadow-sm">
                {selectedConversation.contactName}
              </h1>
              <button className="text-[#1f5be6] font-bold text-[17px]">
                Call
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div 
          className="flex-1 p-4 overflow-y-auto"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, #e7eaf0 0px, #e7eaf0 1px, #f0f2f5 1px, #f0f2f5 2px)"
          }}
        >
          {selectedConversation.messages.map((message, index) => (
            <div key={message.id} className="mb-3">
              {/* Timestamp */}
              {(index === 0 || 
                Math.abs(message.timestamp.getTime() - selectedConversation.messages[index - 1].timestamp.getTime()) > 300000) && (
                <div className="text-center text-[11px] text-[#8e8e93] mb-3 font-medium">
                  {message.timestamp.toLocaleDateString([], { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  }) + ' ' + message.timestamp.toLocaleTimeString([], { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                  })}
                </div>
              )}
              
              {/* Message Bubble */}
              <div className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-[12px] py-[8px] ${
                  message.isSent 
                    ? 'bg-[#1f5be6] text-white rounded-[18px] rounded-br-[4px] ml-8 shadow-sm' 
                    : 'bg-white border border-[#d1d1d6] text-black rounded-[18px] rounded-bl-[4px] mr-8 shadow-sm'
                }`}>
                  <span className="text-[16px] leading-[20px] font-normal">{message.text}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="bg-gradient-to-b from-[#cdd5df] to-[#a7b1bf] border-t border-[#8a95a1] px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-white rounded-[18px] border border-[#a8a8a8] px-[12px] py-[6px] min-h-[30px] flex items-center shadow-inner">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Text Message"
                className="w-full text-[16px] text-black placeholder-[#999] outline-none bg-transparent font-normal"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className={`px-[16px] py-[6px] rounded-[18px] font-bold text-white min-w-[50px] ${
                newMessage.trim() 
                  ? 'bg-[#1f5be6] active:bg-[#1a4bc7] shadow-sm' 
                  : 'bg-[#a8a8a8] cursor-not-allowed'
              }`}
            >
              Send
            </button>
          </div>
        </div>

        {/* Keyboard */}
        <div className="bg-[#cfd6de] border-t border-[#a8b0bd]">
          <div className="grid grid-cols-10 gap-[6px] p-2">
            {!showNumbers ? (
              // Letters Mode
              <>
                {/* First Row */}
                {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[20px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                  >
                    {isShiftPressed || (autoCapitalize && shouldCapitalize(newMessage)) ? key : key.toLowerCase()}
                  </button>
                ))}
                
                {/* Second Row */}
                <div className="col-span-10 grid grid-cols-9 gap-[6px] ml-4">
                  {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[20px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                    >
                      {isShiftPressed || (autoCapitalize && shouldCapitalize(newMessage)) ? key : key.toLowerCase()}
                    </button>
                  ))}
                </div>
                
                {/* Third Row */}
                <button 
                  onClick={toggleShift}
                  className={`h-10 border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm ${
                    isShiftPressed ? 'bg-[#1f5be6] text-white' : 'bg-[#acb5c0]'
                  }`}
                >
                  ⇧
                </button>
                {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[20px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                  >
                    {isShiftPressed || (autoCapitalize && shouldCapitalize(newMessage)) ? key : key.toLowerCase()}
                  </button>
                ))}
                <button 
                  onClick={() => setNewMessage(prev => prev.slice(0, -1))}
                  className="h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
                >
                  ⌫
                </button>
                
                {/* Fourth Row */}
                <button 
                  onClick={toggleNumbers}
                  className="col-span-2 h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
                >
                  123
                </button>
                <button 
                  onClick={() => handleSpecialChar(' ')}
                  className="col-span-5 h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[16px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                >
                  space
                </button>
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className={`col-span-2 h-10 rounded-[4px] text-[16px] font-medium shadow-sm ${
                    newMessage.trim()
                      ? 'bg-[#1f5be6] text-white active:bg-[#1a4bc7]'
                      : 'bg-[#acb5c0] border border-[#9aa3b0] text-black active:bg-[#9aa3b0]'
                  }`}
                >
                  return
                </button>
              </>
            ) : (
              // Numbers & Symbols Mode
              <>
                {/* First Row - Numbers */}
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleSpecialChar(key)}
                    className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[20px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                  >
                    {key}
                  </button>
                ))}
                
                {/* Second Row - Special Characters */}
                <div className="col-span-10 grid grid-cols-10 gap-[6px]">
                  {['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleSpecialChar(key)}
                      className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[18px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                    >
                      {key}
                    </button>
                  ))}
                </div>
                
                {/* Third Row - More Symbols */}
                <button 
                  onClick={toggleNumbers}
                  className="h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[14px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
                >
                  #+*
                </button>
                {['.', ',', '?', '!', "'", '"', '(', ')', '-'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleSpecialChar(key)}
                    className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[18px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                  >
                    {key}
                  </button>
                ))}
                
                {/* Fourth Row */}
                <button 
                  onClick={toggleNumbers}
                  className="col-span-2 h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
                >
                  ABC
                </button>
                <button 
                  onClick={() => handleSpecialChar(' ')}
                  className="col-span-5 h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[16px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                >
                  space
                </button>
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className={`col-span-2 h-10 rounded-[4px] text-[16px] font-medium shadow-sm ${
                    newMessage.trim()
                      ? 'bg-[#1f5be6] text-white active:bg-[#1a4bc7]'
                      : 'bg-[#acb5c0] border border-[#9aa3b0] text-black active:bg-[#9aa3b0]'
                  }`}
                >
                  return
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderComposeView = () => (
    <div className="w-screen h-screen bg-white flex flex-col">
      {/* Combined Status Bar and Header */}
      <div className="bg-gradient-to-b from-[#cdd5df] to-[#a7b1bf] border-b border-[#8a95a1]">
        {/* Status Bar */}
        <div className="flex justify-between items-center px-4 pt-2 pb-1 text-black text-[11px] tracking-wide">
          <div className="flex items-center space-x-2">
            {/* Signal bars */}
            <div className="flex items-end space-x-[2px]">
              <div className="w-[3px] h-[6px] bg-black rounded-[1px]" />
              <div className="w-[3px] h-[8px] bg-black rounded-[1px]" />
              <div className="w-[3px] h-[10px] bg-black rounded-[1px]" />
              <div className="w-[3px] h-[8px] bg-black/60 rounded-[1px]" />
              <div className="w-[3px] h-[6px] bg-black/40 rounded-[1px]" />
            </div>
            <span className="opacity-90">Verizon</span>
            <span className="opacity-90">📶</span>
          </div>
          <div className="flex items-center space-x-2">
              {/* time removed */}
            {/* Battery */}
            <div className="w-7 h-[14px] border border-black/70 rounded-[2px] relative">
              <div className="absolute inset-[2px] w-[16px] bg-green-500 rounded-[1px]" />
              <div className="w-[3px] h-[6px] bg-black/70 rounded-sm absolute -right-[5px] top-[4px]" />
            </div>
          </div>
        </div>
        
        {/* Header */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentView("conversations")}
              className="text-[#1f5be6] font-bold text-[17px]"
            >
              Cancel
            </button>
            <h1 className="text-[20px] font-bold text-[#1a1a1a] drop-shadow-sm">New Message</h1>
            <button 
              onClick={() => {
                if (composeRecipient.trim() && composeMessage.trim()) {
                  // Create new conversation or add to existing
                  setCurrentView("conversations");
                  setComposeRecipient("");
                  setComposeMessage("");
                }
              }}
              disabled={!composeRecipient.trim() || !composeMessage.trim()}
              className={`font-bold text-[17px] ${
                composeRecipient.trim() && composeMessage.trim()
                  ? 'text-[#1f5be6]' 
                  : 'text-[#999]'
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Compose Form */}
      <div className="flex-1 bg-white">
        {/* To Field */}
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex items-center">
            <span className="text-[17px] text-[#666] mr-3 w-8">To:</span>
            <input
              type="text"
              value={composeRecipient}
              onChange={(e) => setComposeRecipient(e.target.value)}
              placeholder=""
              className="flex-1 text-[17px] text-black outline-none"
            />
            <button className="w-8 h-8 bg-[#1f5be6] rounded-full flex items-center justify-center ml-2">
              <span className="text-white text-[16px]">+</span>
            </button>
          </div>
        </div>

        {/* Message Field */}
        <div className="flex-1 p-4">
          <textarea
            value={composeMessage}
            onChange={(e) => setComposeMessage(e.target.value)}
            placeholder=""
            className="w-full h-32 text-[17px] text-black outline-none resize-none"
          />
        </div>
      </div>

      {/* Keyboard */}
      <div className="bg-[#cfd6de] border-t border-[#a8b0bd]">
        <div className="grid grid-cols-10 gap-[6px] p-2">
          {!showNumbers ? (
            // Letters Mode
            <>
              {/* First Row */}
              {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key, true)}
                  className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[20px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                >
                  {isShiftPressed || (autoCapitalize && shouldCapitalize(composeMessage)) ? key : key.toLowerCase()}
                </button>
              ))}
              
              {/* Second Row */}
              <div className="col-span-10 grid grid-cols-9 gap-[6px] ml-4">
                {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key, true)}
                    className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[20px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                  >
                    {isShiftPressed || (autoCapitalize && shouldCapitalize(composeMessage)) ? key : key.toLowerCase()}
                  </button>
                ))}
              </div>
              
              {/* Third Row */}
              <button 
                onClick={toggleShift}
                className={`h-10 border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm ${
                  isShiftPressed ? 'bg-[#1f5be6] text-white' : 'bg-[#acb5c0]'
                }`}
              >
                ⇧
              </button>
              {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key, true)}
                  className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[20px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                >
                  {isShiftPressed || (autoCapitalize && shouldCapitalize(composeMessage)) ? key : key.toLowerCase()}
                </button>
              ))}
              <button 
                onClick={() => setComposeMessage(prev => prev.slice(0, -1))}
                className="h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
              >
                ⌫
              </button>
              
              {/* Fourth Row */}
              <button 
                onClick={toggleNumbers}
                className="col-span-2 h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
              >
                123
              </button>
              <button 
                onClick={() => handleSpecialChar(' ', true)}
                className="col-span-5 h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[16px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
              >
                space
              </button>
              <button className="col-span-2 h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm">
                return
              </button>
            </>
          ) : (
            // Numbers & Symbols Mode
            <>
              {/* First Row - Numbers */}
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleSpecialChar(key, true)}
                  className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[20px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                >
                  {key}
                </button>
              ))}
              
              {/* Second Row - Special Characters */}
              <div className="col-span-10 grid grid-cols-10 gap-[6px]">
                {['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleSpecialChar(key, true)}
                    className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[18px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                  >
                    {key}
                  </button>
                ))}
              </div>
              
              {/* Third Row - More Symbols */}
              <button 
                onClick={toggleNumbers}
                className="h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[14px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
              >
                #+*
              </button>
              {['.', ',', '?', '!', "'", '"', '(', ')', '-'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleSpecialChar(key, true)}
                  className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[18px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                >
                  {key}
                </button>
              ))}
              
              {/* Fourth Row */}
              <button 
                onClick={toggleNumbers}
                className="col-span-2 h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
              >
                ABC
              </button>
              <button 
                onClick={() => handleSpecialChar(' ', true)}
                className="col-span-5 h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[16px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
              >
                space
              </button>
              <button className="col-span-2 h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm">
                return
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Render based on current view
  switch (currentView) {
    case "conversations":
      return renderConversationsList();
    case "chat":
      return renderChatView();
    case "compose":
      return renderComposeView();
    default:
      return renderConversationsList();
  }
};

export default MessagingApp;
