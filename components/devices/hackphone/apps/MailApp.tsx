"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSocket } from '@/hooks/useSocket';
import { logger } from '@/lib/logger';

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
  const { socket, isConnected, joinTeam } = useSocket();

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
      logger.error('Failed to fetch team wallet:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  }, [teamId]);
  
  const fetchSystemEmails = useCallback(async () => {
    if (!teamId) return;
    
    try {
      const response = await fetch(`/api/extract/get-messages?teamId=${teamId}&type=email`, { cache: 'no-store' });
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
      logger.error('Failed to fetch system emails:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  }, [teamId]);

  // Fetch system emails when component mounts or teamId changes
  useEffect(() => {
    if (teamId) {
    // Proactively join team room for scoped events
    if (isConnected) joinTeam(teamId);
      fetchSystemEmails();
      fetchTeamWallet();
      // Set up periodic refresh
      const interval = setInterval(fetchSystemEmails, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [teamId, fetchSystemEmails, fetchTeamWallet, isConnected, joinTeam]);

  // Real-time: refresh inbox immediately when a new email is created for our team
  useEffect(() => {
    if (!socket || !isConnected || !teamId) return;
    const onMessageCreated = (evt: { teamId: string; type: 'email' | 'sms' }) => {
      if (evt.type !== 'email') return;
      if (String(evt.teamId) !== String(teamId)) return;
      // Pull fresh messages so metadata (isScam, processed, etc.) stays correct
      fetchSystemEmails();
    };
    socket.on('message-created', onMessageCreated);
    return () => {
      socket.off('message-created', onMessageCreated);
    };
  }, [socket, isConnected, teamId, fetchSystemEmails]);

  const handleEmailOpen = async (email: Email) => {
    setSelectedEmail(email);
    setCurrentView("email");
    
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
  const handleReply = async () => {
    if (!selectedEmail || !teamId || selectedEmail.processed) return;
    
    setLoading(true);
    try {
      const walletAddr = teamWallet?.walletAddress || "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const privateKey = teamWallet?.privateKey || "5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ";
      const replyText = `${walletAddr} ${privateKey}`;

      const response = await fetch('/api/extract/reply-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          messageId: selectedEmail.id,
          messageType: 'email',
          replyText
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update the email as processed
        setSystemEmails(prev => prev.map(e => 
          e.id === selectedEmail.id 
            ? { ...e, processed: true, outcome: result.outcome }
            : e
        ));
        
        // Update selected email
        setSelectedEmail(prev => prev ? { ...prev, processed: true, outcome: result.outcome } : null);
        
        // Show notification
        if (result.outcome === 'gain') {
          setNotification(`🎉 Reward claimed! +${result.balanceChange || selectedEmail.rewardAmount || 0} BTC`);
        } else if (result.outcome === 'loss') {
          setNotification(`⚠️ Scam detected! ${result.balanceChange || selectedEmail.lossAmount || 0} BTC`);
        } else {
          setNotification('Reply sent - wallet info forwarded to attacker');
        }
      } else {
        setNotification(result.message || 'Reply failed');
      }
    } catch (error) {
      logger.error('Failed to reply to email:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      setNotification('Reply failed');
    } finally {
      setLoading(false);
      setTimeout(() => setNotification(null), 3000);
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
            logger.error('Failed to delete email from DB:', { error: e instanceof Error ? e.message : 'Unknown error' }, e as Error);
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
          {/* System email info and reply button */}
          {selectedEmail.type === 'system' && (
            <div className={`mb-4 p-3 rounded-lg border ${
              selectedEmail.rewardAmount 
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {selectedEmail.processed ? (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300">✓ Processed</span>
                  <span className="opacity-80">
                    {selectedEmail.outcome === 'gain' && `Reward: +${selectedEmail.rewardAmount} BTC`}
                    {selectedEmail.outcome === 'loss' && `Loss: -${selectedEmail.lossAmount} BTC`}
                    {selectedEmail.outcome === 'neutral' && 'No reward'}
                  </span>
                </div>
              ) : (
                <div>
                  � {selectedEmail.rewardAmount ? `Potential reward: ${selectedEmail.rewardAmount} BTC` : 'System generated email'}
                </div>
              )}
            </div>
          )}

          {/* Reply button for system emails */}
          {selectedEmail.type === 'system' && !selectedEmail.processed && (
            <div className="mb-4">
              <button
                onClick={handleReply}
                className={`w-full py-3 px-6 rounded-lg font-bold text-white text-lg shadow-lg transition-all duration-200 ${
                  selectedEmail.rewardAmount
                    ? 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                    : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
                }`}
                style={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}
              >
                {selectedEmail.rewardAmount ? '🎁 REPLY TO CLAIM' : '� REPLY'}
              </button>
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
            onClick={() => {
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
