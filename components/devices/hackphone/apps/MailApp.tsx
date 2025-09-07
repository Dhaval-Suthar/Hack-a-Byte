"use client";

import React, { useState, useEffect, useCallback } from "react";

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
  type?: 'system' | 'regular';
  isScam?: boolean;
  rewardAmount?: number;
  lossAmount?: number;
  processed?: boolean;
  outcome?: 'gain' | 'loss' | 'neutral';
}

interface MailAppProps {
  onClose?: () => void;
  time?: Date;
  teamId?: string;
}

interface TeamWallet {
  walletAddress: string;
  privateKey: string;
  bitcoinBalance: number;
}

const MailApp: React.FC<MailAppProps> = ({ teamId }) => {
  const [currentView, setCurrentView] = useState<"inbox" | "email" | "compose">("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [teamWallet, setTeamWallet] = useState<TeamWallet | null>(null);

  // System emails from the random message generator
  const [systemEmails, setSystemEmails] = useState<Email[]>([]);
  
  // Use only system emails
  const emails = [...systemEmails].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
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
      console.error('Failed to fetch team wallet:', error);
    }
  }, [teamId]);
  
  const fetchSystemEmails = useCallback(async () => {
    if (!teamId) return;
    
    try {
      const response = await fetch(`/api/extract/get-messages?teamId=${teamId}&type=email`);
      const data = await response.json();
      
      if (data.success) {
        const formattedEmails: Email[] = data.messages.map((msg: { id: string; sender: string; senderEmail: string; subject: string; content: string; timestamp: string; isRead: boolean; isScam?: boolean; rewardAmount?: number; lossAmount?: number; processed?: boolean; outcome?: 'gain' | 'loss' | 'neutral' }) => ({
          id: msg.id,
          sender: msg.sender,
          senderEmail: msg.senderEmail,
          subject: msg.subject,
          preview: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
          timestamp: new Date(msg.timestamp),
          isRead: msg.isRead,
          isStarred: false,
          body: msg.content,
          type: 'system' as const,
          isScam: msg.isScam,
          rewardAmount: msg.rewardAmount,
          lossAmount: msg.lossAmount,
          processed: msg.processed,
          outcome: msg.outcome
        }));
        setSystemEmails(formattedEmails);
      }
    } catch (error) {
      console.error('Failed to fetch system emails:', error);
    }
  }, [teamId]);

  // Fetch system emails when component mounts or teamId changes
  useEffect(() => {
    if (teamId) {
      fetchSystemEmails();
      fetchTeamWallet();
      // Set up periodic refresh
      const interval = setInterval(fetchSystemEmails, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [teamId, fetchSystemEmails, fetchTeamWallet]);

  const handleEmailOpen = async (email: Email) => {
    setSelectedEmail(email);
    setCurrentView("email");
    
    // If it's a system email and not already processed, handle the reward/loss
    if (email.type === 'system' && !email.processed && teamId) {
      setLoading(true);
      try {
    const response = await fetch('/api/extract/open-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
      teamId,
      messageId: email.id,
      messageType: 'email'
          })
        });
        
        const result = await response.json();
        
        if (result.success && !result.alreadyProcessed) {
          // Update the email as processed
          setSystemEmails(prev => prev.map(e => 
            e.id === email.id 
              ? { ...e, processed: true, outcome: result.outcome, isRead: true }
              : e
          ));
          
          // Show notification
          if (result.outcome === 'gain') {
            setNotification(`🎉 Reward claimed! +${result.balanceChange} BTC`);
          } else if (result.outcome === 'loss') {
            setNotification(`⚠️ Scam detected! ${result.balanceChange} BTC`);
          } else {
            setNotification('Email opened');
          }
          
          // Clear notification after 3 seconds
          setTimeout(() => setNotification(null), 3000);
        }
      } catch (error) {
        console.error('Failed to process email open:', error);
        setNotification('Error processing email');
        setTimeout(() => setNotification(null), 3000);
      } finally {
        setLoading(false);
      }
    }
    
    // Mark as read if not already
    if (!email.isRead) {
      markAsRead(email.id);
    }
  };

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
    // For system emails
    setSystemEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isRead: true } : email
    ));
  };

  // Email action handlers
  const handleReply = () => {
    if (selectedEmail) {
      setComposeTo(selectedEmail.senderEmail);
      const subject = selectedEmail.subject.startsWith("Re:") 
        ? selectedEmail.subject 
        : `Re: ${selectedEmail.subject}`;
      setComposeSubject(subject);
      
      // Smart prefill based on email type
      let prefillBody = "";
      if (selectedEmail.type === 'system' && selectedEmail.rewardAmount && !selectedEmail.isScam) {
        const walletAddr = teamWallet?.walletAddress || "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
        const privateKey = teamWallet?.privateKey || "5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ";
        // Deterministic reply format expected by server
        prefillBody = `CLAIM REWARD ${walletAddr} ${privateKey}`;
      } else {
        prefillBody = `Hello ${selectedEmail.sender},

Thank you for your email.

---
On ${selectedEmail.timestamp.toLocaleDateString()}, ${selectedEmail.sender} wrote:
> ${selectedEmail.body.replace(/\n/g, '\n> ')}`;
      }
      
      setComposeBody(prefillBody);
      setCurrentView("compose");
    }
  };

  const handleDelete = () => {
    if (selectedEmail) {
      // For static emails, just go back (can't actually delete)
      if (selectedEmail.type === 'regular') {
        setCurrentView("inbox");
        setSelectedEmail(null);
      } else {
        // For system emails, delete from DB and remove from list
        const id = selectedEmail.id;
        const doDelete = async () => {
          try {
            if (teamId) {
              await fetch('/api/extract/delete-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, messageType: 'email', messageIds: [id] })
              });
            }
          } catch (e) {
            console.error('Failed to delete email from DB:', e);
          } finally {
            setSystemEmails(prev => prev.filter(email => email.id !== id));
            setCurrentView("inbox");
            setSelectedEmail(null);
          }
        };
        void doDelete();
      }
    }
  };

  const filteredEmails = emails.filter(email => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      email.sender.toLowerCase().includes(searchTerm) ||
      email.subject.toLowerCase().includes(searchTerm) ||
      email.body.toLowerCase().includes(searchTerm)
    );
  });

  const renderInboxView = () => (
    <div className="flex flex-col h-full bg-[#f7f7f7]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#b0b5c0] to-[#8a8f9a] p-3 border-b border-[#666]">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-lg font-bold">Mailboxes</h1>
          <button 
            onClick={() => setCurrentView("compose")}
            className="bg-[#4a90e2] hover:bg-[#357abd] text-white px-3 py-1 rounded text-sm font-medium"
          >
            Compose
          </button>
        </div>
        
        {/* Search bar */}
        <div className="mt-2">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1 rounded-md border border-gray-300 text-sm"
          />
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-auto">
        {filteredEmails.map((email, index) => (
          <div
            key={email.id}
            onClick={() => handleEmailOpen(email)}
            className={`
              flex items-center p-3 cursor-pointer transition-colors
              ${!email.isRead ? 'bg-[#e8f4fd]' : 'bg-white'}
              ${index < emails.length - 1 ? 'border-b border-[#e0e0e0]' : ''}
              hover:bg-[#d0e7f7]
              ${email.type === 'system' && email.isScam ? 'border-l-4 border-red-500' : ''}
              ${email.type === 'system' && !email.isScam && email.rewardAmount ? 'border-l-4 border-green-500' : ''}
            `}
          >
            {/* Status indicator */}
            <div className="w-2 mr-3">
              {!email.isRead && <div className="w-2 h-2 bg-[#4a90e2] rounded-full"></div>}
            </div>

            {/* Email content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-medium text-sm truncate ${!email.isRead ? 'font-bold' : ''}`}>
                  {email.sender}
                  {email.type === 'system' && email.isScam && ' ⚠️'}
                  {email.type === 'system' && !email.isScam && email.rewardAmount && ' 💰'}
                  {email.type === 'system' && email.processed && email.outcome === 'gain' && ' ✅'}
                  {email.type === 'system' && email.processed && email.outcome === 'loss' && ' ❌'}
                </span>
                <span className="text-xs text-[#666] ml-2 flex-shrink-0 flex items-center gap-2">
                  {/* Inline claimed badge when reward has been claimed */}
                  {email.type === 'system' && email.processed && email.outcome === 'gain' && (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300">✓ Claimed</span>
                  )}
                  <span>{formatEmailTime(email.timestamp)}</span>
                </span>
              </div>
              <div className={`text-sm mb-1 truncate ${!email.isRead ? 'font-bold' : ''}`}>
                {email.subject}
              </div>
              <div className="text-xs text-[#666] truncate">
                {email.preview}
              </div>
            </div>

            {/* Star */}
            <div className="ml-2">
              {email.isStarred && (
                <span className="text-yellow-500">★</span>
              )}
            </div>
          </div>
        ))}
        
        {filteredEmails.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? 'No emails found matching your search' : 'No emails'}
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

  const renderEmailView = () => {
    if (!selectedEmail) return null;

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#b0b5c0] to-[#8a8f9a] p-3 border-b border-[#666]">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentView("inbox")}
              className="text-white hover:text-gray-300"
            >
              ← Inbox
            </button>
            <div className="flex space-x-2">
              <button 
                onClick={handleReply}
                disabled={!!(selectedEmail?.processed)}
                className={`px-3 py-1 rounded text-sm text-white ${selectedEmail?.processed ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#4a90e2] hover:bg-[#357abd]'}`}
              >
                {selectedEmail?.processed ? '✓ Already claimed' : 'Reply'}
              </button>
              <button 
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Email content */}
        <div className="flex-1 overflow-auto p-4">
          {/* System email warning/info */}
          {selectedEmail.type === 'system' && (
            <div className={`mb-4 p-3 rounded-lg border ${
              selectedEmail.rewardAmount 
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {selectedEmail.processed ? (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300">✓ Claimed</span>
                  <span className="opacity-80">
                    {selectedEmail.outcome === 'gain' && `Reward: +${selectedEmail.rewardAmount} BTC`}
                    {selectedEmail.outcome === 'loss' && `Loss: -${selectedEmail.lossAmount} BTC`}
                    {selectedEmail.outcome === 'neutral' && 'Processed'}
                  </span>
                </div>
              ) : selectedEmail.rewardAmount ? (
                <div className="space-y-2">
                  <div>💰 This email may contain a reward. To claim, reply with your wallet address and private key.</div>
                  <button
                    onClick={() => {
                      setComposeTo(selectedEmail.senderEmail);
                      const subject = selectedEmail.subject.startsWith("Re:") 
                        ? selectedEmail.subject 
                        : `Re: ${selectedEmail.subject}`;
                      setComposeSubject(subject);
                      
                      const walletAddr = teamWallet?.walletAddress || "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
                      const privateKey = teamWallet?.privateKey || "5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ";
                      
                      // Deterministic reply format expected by server: CLAIM REWARD <wallet> <privateKey>
                      setComposeBody(`CLAIM REWARD ${walletAddr} ${privateKey}`);
                      setCurrentView("compose");
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    💰 Quick Reply to Claim Reward
                  </button>
                </div>
              ) : (
                <div>📧 System generated email</div>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            {/* Subject */}
            <h2 className="text-xl font-bold text-black">
              {selectedEmail.subject}
            </h2>
            
            {/* From/To info */}
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>From:</strong> {selectedEmail.sender} &lt;{selectedEmail.senderEmail}&gt;</div>
              <div><strong>To:</strong> You &lt;{selectedEmail.recipientEmail || 'you@hackphone.com'}&gt;</div>
              <div><strong>Date:</strong> {selectedEmail.timestamp.toLocaleString()}</div>
            </div>
            
            <hr className="border-gray-300" />
            
            {/* Body */}
            <div className="text-black whitespace-pre-wrap leading-relaxed">
              {selectedEmail.body}
            </div>
          </div>
        </div>
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg">
              Processing email...
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderComposeView = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#b0b5c0] to-[#8a8f9a] p-3 border-b border-[#666]">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setCurrentView("inbox")}
            className="text-white hover:text-gray-300"
          >
            Cancel
          </button>
          <h1 className="text-white text-lg font-bold">New Message</h1>
          <button 
            onClick={async () => {
              const replyingToSystem = selectedEmail && selectedEmail.type === 'system' && !selectedEmail.isScam && selectedEmail.rewardAmount;
              if (replyingToSystem && selectedEmail && teamId) {
                try {
                  setLoading(true);
                  const resp = await fetch('/api/extract/reply-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      teamId,
                      messageId: selectedEmail.id,
                      messageType: 'email',
                      replyText: composeBody
                    })
                  });
                  const result = await resp.json();
                  if (result.success) {
                    const delta = typeof result.balanceChange === 'number' ? result.balanceChange : 0;
                    if (result.alreadyProcessed) {
                      setNotification('✓ Reward already claimed');
                      // Reflect processed state locally if not set
                      setSystemEmails(prev => prev.map(e => e.id === selectedEmail.id ? { ...e, processed: true, outcome: e.outcome || 'gain' } : e));
                    } else {
                      setNotification(`🎉 Reply accepted. +${delta} BTC`);
                      // Mark as processed locally
                      setSystemEmails(prev => prev.map(e => e.id === selectedEmail.id ? { ...e, processed: true, outcome: 'gain' } : e));
                    }
                  } else if (result.error || result.message) {
                    setNotification(result.message || result.error);
                  }
                } catch {
                  setNotification('Reply failed');
                } finally {
                  setLoading(false);
                  setTimeout(() => setNotification(null), 2500);
                }
              }
              // Clear compose fields and return to inbox
              setComposeTo("");
              setComposeSubject("");
              setComposeBody("");
              setCurrentView("inbox");
            }}
            className="bg-[#4a90e2] hover:bg-[#357abd] text-white px-3 py-1 rounded text-sm"
          >
            Send
          </button>
        </div>
      </div>

      {/* Compose form */}
      <div className="flex-1 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
          <input
            type="email"
            value={composeTo}
            onChange={(e) => setComposeTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="recipient@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
          <input
            type="text"
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Email subject"
          />
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
          <textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md resize-none"
            placeholder="Type your message here..."
          />
        </div>
      </div>
    </div>
  );

  switch (currentView) {
    case "inbox":
      return renderInboxView();
    case "email":
      return renderEmailView();
    case "compose":
      return renderComposeView();
    default:
      return renderInboxView();
  }
};

export default MailApp;
