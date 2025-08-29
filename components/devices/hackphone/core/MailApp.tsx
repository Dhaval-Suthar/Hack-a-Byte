"use client";

import React, { useState } from "react";

interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  recipient?: string;
  recipientEmail?: string;
  subject: string;
  preview: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  body: string;
  hasAttachment?: boolean;
}

interface MailAppProps {
  onClose?: () => void;
  time?: Date;
}

const MailApp: React.FC<MailAppProps> = () => {
  const [currentView, setCurrentView] = useState<"inbox" | "email" | "compose">("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [showNumbers, setShowNumbers] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeField, setActiveField] = useState<'to' | 'subject' | 'body'>('body');

  // Sample emails matching the design
  const [emails, setEmails] = useState<Email[]>([
    {
      id: "1",
      sender: "Google",
      senderEmail: "security-alert@google.com",
      recipient: "You",
      recipientEmail: "you@hackphone.com",
      subject: "Security alert",
      preview: "2-step verification has been activated for your Gmail account",
      timestamp: new Date(2024, 7, 20, 10, 23),
      isRead: false,
      isStarred: false,
      hasAttachment: false,
      body: `2-step verification has been activated for your Gmail account security-alert@google.com. We noticed a new sign-in to your Google Account...`
    },
    {
      id: "2", 
      sender: "Google",
      senderEmail: "security-alert@google.com",
      recipient: "You",
      recipientEmail: "you@hackphone.com",
      subject: "Security alert",
      preview: "Unusual activity detected on your Google account",
      timestamp: new Date(2024, 7, 19, 15, 45),
      isRead: false,
      isStarred: false,
      hasAttachment: false,
      body: `Unusual activity detected on your Google account. Please review your account activity...`
    },
    {
      id: "3",
      sender: "Google",
      senderEmail: "security-alert@google.com",
      recipient: "You",
      recipientEmail: "you@hackphone.com", 
      subject: "Security alert",
      preview: "Someone granted access to your Google account",
      timestamp: new Date(2024, 7, 19, 9, 30),
      isRead: false,
      isStarred: false,
      hasAttachment: false,
      body: `Someone granted access to your Google account. If this wasn't you, please review...`
    },
    {
      id: "4",
      sender: "Microsoft Outlook",
      senderEmail: "outlook-mobile@microsoft.com",
      recipient: "You",
      recipientEmail: "you@hackphone.com",
      subject: "Microsoft Outlook Test Message",
      preview: "This is an email message sent automatically by Microsoft Outlook while testing the settings for your account",
      timestamp: new Date(2024, 7, 18, 11, 0),
      isRead: true,
      isStarred: false,
      hasAttachment: false,
      body: `This is an email message sent automatically by Microsoft Outlook while testing the settings for your account...`
    },
    {
      id: "5",
      sender: "Google",
      senderEmail: "security-alert@google.com",
      recipient: "You",
      recipientEmail: "you@hackphone.com",
      subject: "Security alert",
      preview: "Someone just used your password to try to sign in to your account",
      timestamp: new Date(2024, 7, 17, 14, 15),
      isRead: true,
      isStarred: false,
      hasAttachment: false,
      body: `Someone just used your password to try to sign in to your account. Google blocked them...`
    }
  ]);

  const formatEmailTime = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const emailDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Check if it's today
    if (emailDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    
    // Check if it's yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (emailDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    
    // Check if it's this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    if (emailDate >= startOfWeek) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const markAsRead = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, isRead: true } : email
    ));
  };

  // Helper function for compose keyboard
  const shouldCapitalize = (text: string) => {
    if (text.length === 0) return true;
    const lastTwoChars = text.slice(-2);
    return lastTwoChars.match(/[.!?]\s$/) || text.trim().length === 0;
  };

  const handleKeyPress = (key: string, field?: 'to' | 'subject' | 'body') => {
    const targetField = field || activeField;
    const shouldCap = isShiftPressed || shouldCapitalize(targetField === 'to' ? composeTo : targetField === 'subject' ? composeSubject : composeBody);
    const charToAdd = shouldCap ? key.toUpperCase() : key.toLowerCase();
    
    if (targetField === 'to') {
      setComposeTo(prev => prev + charToAdd);
    } else if (targetField === 'subject') {
      setComposeSubject(prev => prev + charToAdd);
    } else {
      setComposeBody(prev => prev + charToAdd);
    }
    
    if (isShiftPressed) {
      setIsShiftPressed(false);
    }
  };

  const handleSpecialChar = (char: string, field: 'to' | 'subject' | 'body') => {
    if (field === 'to') {
      setComposeTo(prev => prev + char);
    } else if (field === 'subject') {
      setComposeSubject(prev => prev + char);
    } else {
      setComposeBody(prev => prev + char);
    }
  };

  // Email action handlers
  const handleReply = () => {
    if (selectedEmail) {
      // Clear all compose fields first
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setActiveField('to');
      
      // Set values with a small delay to ensure state is cleared
      setTimeout(() => {
        setComposeTo(selectedEmail.senderEmail);
        const subject = selectedEmail.subject.startsWith("Re:") 
          ? selectedEmail.subject 
          : `Re: ${selectedEmail.subject}`;
        setComposeSubject(subject);
        setComposeBody(`

On ${selectedEmail.timestamp.toLocaleDateString()}, ${selectedEmail.sender} wrote:
> ${selectedEmail.body.replace(/\n/g, '\n> ')}`);
        setCurrentView("compose");
        setActiveField('to');
      }, 10);
    }
  };

  const handleForward = () => {
    if (selectedEmail) {
      // Clear all compose fields first
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      
      // Set values with a small delay to ensure state is cleared
      setTimeout(() => {
        // Leave To field empty for user to fill
        setComposeTo("");
        // Check if subject already has Fwd: prefix to avoid duplication
        const subject = selectedEmail.subject.startsWith("Fwd:") 
          ? selectedEmail.subject 
          : `Fwd: ${selectedEmail.subject}`;
        setComposeSubject(subject);
        setComposeBody(`

---------- Forwarded message ----------
From: ${selectedEmail.sender}
Subject: ${selectedEmail.subject}

${selectedEmail.body}`);
        setCurrentView("compose");
      }, 10);
    }
  };

  const handleDelete = () => {
    if (selectedEmail) {
      setEmails(emails.filter(email => email.id !== selectedEmail.id));
      setCurrentView("inbox");
    }
  };

  // Search functionality
  const filteredEmails = emails.filter(email => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.sender.toLowerCase().includes(query) ||
      email.subject.toLowerCase().includes(query) ||
      email.preview.toLowerCase().includes(query) ||
      email.body.toLowerCase().includes(query)
    );
  });

  const renderInbox = () => (
    <div className="w-screen h-screen bg-[#c5ccd4] flex flex-col">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 pt-2 pb-1 text-black text-[11px] font-medium bg-[#c5ccd4]">
        <div className="flex items-center space-x-1">
          <span>••••• AT&T</span>
          <div className="flex items-end space-x-[1px] ml-2">
            <div className="w-1 h-1 bg-black rounded-full" />
            <div className="w-1 h-2 bg-black rounded-full" />
            <div className="w-1 h-3 bg-black rounded-full" />
            <div className="w-1 h-4 bg-black rounded-full" />
            <div className="w-1 h-5 bg-black rounded-full" />
          </div>
        </div>
        <div className="text-center">
          <span>10:23</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>🔋</span>
          <span>100%</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-b from-[#b7c1ce] to-[#9bb0c4] border-b border-[#8a9bb0] shadow-sm">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="w-16"></div>
            <h1 className="text-[20px] font-bold text-white drop-shadow-sm">Inbox</h1>
            <button 
              onClick={() => setCurrentView("compose")}
              className="text-white font-bold text-[12px] drop-shadow-sm"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-b from-[#9bb0c4] to-[#8a9bb0] px-4 py-2">
        <div className="bg-white rounded-lg px-3 py-1 flex items-center">
          <span className="text-gray-400 text-[14px] mr-2">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="flex-1 text-gray-400 text-[14px] outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 text-[14px] ml-2"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 bg-white pb-24 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-gray-400 text-[16px] mb-2">📭</div>
              <div className="text-gray-500 text-[16px]">
                {searchQuery ? 'No emails found' : 'No emails'}
              </div>
            </div>
          </div>
        ) : (
          filteredEmails.map((email, index) => (
          <button
            key={email.id}
            onClick={() => {
              markAsRead(email.id);
              setSelectedEmail(email);
              setCurrentView("email");
            }}
            className={`w-full flex items-start px-4 py-2 active:bg-[#d9d9d9] bg-white ${
              index < emails.length - 1 ? 'border-b border-[#e0e0e0]' : ''
            }`}
          >
            {/* Blue dot for unread */}
            <div className="flex flex-col items-center mr-3 mt-1 w-4">
              <div className={`w-2 h-2 rounded-full ${
                !email.isRead ? 'bg-[#007aff]' : 'bg-transparent'
              }`} />
            </div>
            
            {/* Email Content */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-start justify-between mb-1">
                <span className={`text-[16px] truncate ${
                  !email.isRead ? 'font-bold text-black' : 'font-normal text-black'
                }`}>
                  {email.sender}
                </span>
                <span className="text-[12px] text-[#007aff] ml-2 flex-shrink-0 mt-1">
                  {formatEmailTime(email.timestamp)}
                </span>
              </div>
              <div className={`text-[14px] mb-1 truncate ${
                !email.isRead ? 'font-semibold text-black' : 'font-normal text-black'
              }`}>
                {email.subject}
              </div>
              <div className="text-[13px] text-[#8e8e93] truncate">
                {email.preview}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center ml-2">
              <span className="text-[#c7c7cc] text-[16px]">›</span>
            </div>
          </button>
          ))
        )}
      </div>
    </div>
  );

  const renderEmail = () => {
    if (!selectedEmail) return null;

    return (
      <div className="w-screen h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#b0b8c6] to-[#8e99ab] border-b border-[#6d7584] shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setCurrentView("inbox")}
                className="text-white font-bold text-[17px] drop-shadow-sm"
              >
                ← Inbox
              </button>
              <h1 className="text-[16px] font-bold text-white drop-shadow-sm truncate max-w-[200px]">
                {selectedEmail.subject}
              </h1>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleReply}
                  className="w-8 h-8 bg-[#4a90e2] border border-[#3a7bc8] rounded-md flex items-center justify-center shadow-sm active:bg-[#3a7bc8]"
                >
                  <span className="text-white text-[14px]">↩</span>
                </button>
                <button 
                  onClick={handleDelete}
                  className="w-8 h-8 bg-[#4a90e2] border border-[#3a7bc8] rounded-md flex items-center justify-center shadow-sm active:bg-[#3a7bc8]"
                >
                  <span className="text-white text-[14px]">🗑</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Email Header */}
        <div className="bg-gradient-to-b from-[#f7f7f7] to-[#e8e8e8] border-b border-[#d0d0d0] px-4 py-3">
          <div className="space-y-2">
            <div>
              <span className="text-[13px] text-[#666] font-medium">From: </span>
              <span className="text-[13px] text-black">{selectedEmail.sender}</span>
            </div>
            <div>
              <span className="text-[13px] text-[#666] font-medium">To: </span>
              <span className="text-[13px] text-[#4a90e2]">{selectedEmail.recipient || "me"}</span>
            </div>
            <div>
              <span className="text-[13px] text-[#666] font-medium">Subject: </span>
              <span className="text-[13px] text-black font-semibold">{selectedEmail.subject}</span>
            </div>
            <div>
              <span className="text-[13px] text-[#666] font-medium">
                {selectedEmail.timestamp.toLocaleDateString([], { 
                  weekday: 'long', 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric' 
                }) + ' ' + selectedEmail.timestamp.toLocaleTimeString([], { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="flex-1 p-4 bg-white overflow-y-auto pb-20">
          <div className="text-[16px] text-black leading-[22px] whitespace-pre-wrap">
            {selectedEmail.body}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gradient-to-b from-[#f7f7f7] to-[#e8e8e8] border-t border-[#d0d0d0] px-4 py-3 relative z-[60]">
          <div className="flex justify-center space-x-8">
            <button onClick={handleReply} className="flex flex-col items-center">
              <div className="w-10 h-10 bg-[#4a90e2] border border-[#3a7bc8] rounded-md flex items-center justify-center shadow-sm active:bg-[#3a7bc8] mb-1">
                <span className="text-white text-[16px]">↩</span>
              </div>
              <span className="text-[11px] text-[#4a90e2] font-medium">Reply</span>
            </button>
            <button onClick={handleForward} className="flex flex-col items-center">
              <div className="w-10 h-10 bg-[#4a90e2] border border-[#3a7bc8] rounded-md flex items-center justify-center shadow-sm active:bg-[#3a7bc8] mb-1">
                <span className="text-white text-[14px]">↗</span>
              </div>
              <span className="text-[11px] text-[#4a90e2] font-medium">Forward</span>
            </button>
            <button onClick={handleDelete} className="flex flex-col items-center">
              <div className="w-10 h-10 bg-[#ff3b30] border border-[#d70015] rounded-md flex items-center justify-center shadow-sm active:bg-[#d70015] mb-1">
                <span className="text-white text-[16px]">🗑</span>
              </div>
              <span className="text-[11px] text-[#ff3b30] font-medium">Delete</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCompose = () => (
    <div className="w-screen h-screen bg-[#c5ccd4] flex flex-col overflow-hidden">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 pt-2 pb-1 text-black text-[11px] font-medium bg-[#c5ccd4]">
        <div className="flex items-center space-x-1">
          <span>••••• AT&T</span>
          <div className="flex items-end space-x-[1px] ml-2">
            <div className="w-1 h-1 bg-black rounded-full" />
            <div className="w-1 h-2 bg-black rounded-full" />
            <div className="w-1 h-3 bg-black rounded-full" />
            <div className="w-1 h-4 bg-black rounded-full" />
            <div className="w-1 h-5 bg-black rounded-full" />
          </div>
        </div>
        <div className="text-center">
          <span>10:23</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>🔋</span>
          <span>100%</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-b from-[#b7c1ce] to-[#9bb0c4] border-b border-[#8a9bb0] shadow-sm">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentView("inbox")}
              className="text-white font-bold text-[12px] drop-shadow-sm"
            >
              Cancel
            </button>
            <h1 className="text-[20px] font-bold text-white drop-shadow-sm">New Message</h1>
            <button 
              onClick={() => {
                if (composeTo.trim() && composeSubject.trim() && composeBody.trim()) {
                  // Create new sent email
                  const newEmail: Email = {
                    id: Date.now().toString(),
                    sender: "Me",
                    senderEmail: "me@hackphone.com",
                    recipient: composeTo.includes('@') ? composeTo : composeTo,
                    recipientEmail: composeTo.includes('@') ? composeTo : `${composeTo}@example.com`,
                    subject: composeSubject,
                    preview: composeBody.substring(0, 100) + (composeBody.length > 100 ? "..." : ""),
                    timestamp: new Date(),
                    isRead: true,
                    isStarred: false,
                    hasAttachment: false,
                    body: composeBody
                  };
                  
                  // Add to emails list (in a real app, this would be sent to server)
                  setEmails([newEmail, ...emails]);
                  
                  // Clear compose form and go back to inbox
                  setCurrentView("inbox");
                  setComposeTo("");
                  setComposeSubject("");
                  setComposeBody("");
                }
              }}
              disabled={!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()}
              className={`text-[12px] font-bold drop-shadow-sm ${
                composeTo.trim() && composeSubject.trim() && composeBody.trim()
                  ? 'text-white' 
                  : 'text-white/50'
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Compose Fields */}
      <div className="bg-white">
        {/* To Field */}
        <div className="border-b border-[#e0e0e0] px-4 py-3">
          <div className="flex items-center">
            <span className="text-[16px] text-[#3c5998] mr-3 w-10 font-medium">To:</span>
            <input
              type="email"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              onFocus={() => setActiveField('to')}
              placeholder=""
              className="flex-1 text-[16px] text-black outline-none bg-transparent"
            />
            <button className="w-6 h-6 bg-[#007aff] rounded-full flex items-center justify-center ml-2">
              <span className="text-white text-[12px] font-bold">+</span>
            </button>
          </div>
        </div>

        {/* Cc/Bcc Field */}
        <div className="border-b border-[#e0e0e0] px-4 py-3">
          <div className="flex items-center">
            <span className="text-[16px] text-[#3c5998] mr-3 min-w-[70px] font-medium">Cc/Bcc:</span>
            <input
              type="email" 
              placeholder=""
              className="flex-1 text-[16px] text-black outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Subject Field */}
        <div className="border-b border-[#e0e0e0] px-4 py-3">
          <div className="flex items-center">
            <span className="text-[16px] text-[#3c5998] mr-3 min-w-[70px] font-medium">Subject:</span>
            <input
              type="text"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              onFocus={() => setActiveField('subject')}
              placeholder=""
              className="flex-1 text-[16px] text-black outline-none bg-transparent"
            />
          </div>
        </div>

        {/* From Field */}
        <div className="border-b border-[#e0e0e0] px-4 py-3">
          <div className="text-[16px] text-black">
            <span className="text-[#666]">Sent from my </span>
            <span className="text-[#007aff]">iPhone</span>
          </div>
        </div>
      </div>

      {/* Message Body */}
      <div className="flex-1 bg-white overflow-hidden">
        <textarea
          value={composeBody}
          onChange={(e) => setComposeBody(e.target.value)}
          onFocus={() => setActiveField('body')}
          placeholder=""
          className="w-full h-full text-[16px] text-black outline-none resize-none bg-transparent overflow-hidden"
          style={{ 
            verticalAlign: 'top', 
            textAlign: 'left',
            padding: '8px 16px 96px 16px',
            margin: 0,
            lineHeight: '20px'
          }}
        />
      </div>

      {/* Keyboard */}
      <div className="bg-[#cfd6de] border-t border-[#a8b0bd] relative z-[60]">
        <div className="grid grid-cols-10 gap-[6px] p-2">
          {!showNumbers ? (
            // Letters Mode
            <>
              {/* First Row */}
              {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key, 'body')}
                  className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[20px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                >
                  {isShiftPressed ? key : key.toLowerCase()}
                </button>
              ))}
              
              {/* Second Row */}
              <div className="col-span-10 grid grid-cols-9 gap-[6px] ml-4">
                {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key, 'body')}
                    className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[20px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                  >
                    {isShiftPressed ? key : key.toLowerCase()}
                  </button>
                ))}
              </div>
              
              {/* Third Row */}
              <button 
                onClick={() => setIsShiftPressed(!isShiftPressed)}
                className={`h-10 border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm ${
                  isShiftPressed ? 'bg-[#007aff] text-white' : 'bg-[#acb5c0]'
                }`}
              >
                ⇧
              </button>
              {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key, 'body')}
                  className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[20px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                >
                  {isShiftPressed ? key : key.toLowerCase()}
                </button>
              ))}
              <button 
                onClick={() => setComposeBody(prev => prev.slice(0, -1))}
                className="h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
              >
                ⌫
              </button>
              
              {/* Fourth Row */}
              <button 
                onClick={() => setShowNumbers(!showNumbers)}
                className="col-span-2 h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
              >
                123
              </button>
              <button 
                onClick={() => handleSpecialChar(' ', 'body')}
                className="col-span-5 h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[16px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
              >
                space
              </button>
              <button 
                onClick={() => handleSpecialChar('\n', 'body')}
                className="col-span-2 h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
              >
                return
              </button>
              <button className="h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[14px] font-medium text-black active:bg-[#9aa3b0] shadow-sm">
                @
              </button>
            </>
          ) : (
            // Numbers & Symbols Mode
            <>
              {/* First Row - Numbers */}
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleSpecialChar(key, 'body')}
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
                    onClick={() => handleSpecialChar(key, 'body')}
                    className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[18px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                  >
                    {key}
                  </button>
                ))}
              </div>
              
              {/* Third Row - More Symbols */}
              <button 
                onClick={() => setShowNumbers(!showNumbers)}
                className="h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[14px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
              >
                #+*
              </button>
              {['.', ',', '?', '!', "'", '"', '(', ')', '-'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleSpecialChar(key, 'body')}
                  className="h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[18px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
                >
                  {key}
                </button>
              ))}
              
              {/* Fourth Row */}
              <button 
                onClick={() => setShowNumbers(!showNumbers)}
                className="col-span-2 h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
              >
                ABC
              </button>
              <button 
                onClick={() => handleSpecialChar(' ', 'body')}
                className="col-span-5 h-10 bg-white border border-[#a8a8a8] rounded-[4px] text-[16px] font-medium text-black active:bg-[#d6dae0] shadow-sm"
              >
                space
              </button>
              <button 
                onClick={() => handleSpecialChar('\n', 'body')}
                className="col-span-2 h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[16px] font-medium text-black active:bg-[#9aa3b0] shadow-sm"
              >
                return
              </button>
              <button className="h-10 bg-[#acb5c0] border border-[#9aa3b0] rounded-[4px] text-[14px] font-medium text-black active:bg-[#9aa3b0] shadow-sm">
                .
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Render based on current view
  switch (currentView) {
    case "inbox":
      return renderInbox();
    case "email":
      return renderEmail();
    case "compose":
      return renderCompose();
    default:
      return renderInbox();
  }
};

export default MailApp;
