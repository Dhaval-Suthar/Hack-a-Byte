"use client";
/**
 * Community Page - Now Functional with Real Data
 *
 * Changes made:
 * - Replaced static chat messages with real data from /api/chat-message
 * - Added socket integration for real-time messaging
 * - Added API call to send messages to database
 * - Added online members fetching from /api/users
 * - Added proper error handling and loading states
 * - Added periodic refresh of chat messages
 * - Added profanity filtering and rate limiting
 * - Added name persistence and character count validation
 */
import React, { useEffect, useState } from "react";
import {
  BackgroundAnimation,
  IntroAnimation,
  CommandLineModal,
  LatestActivity,
  OnlineMembers,
  CommunityChannels,
  ChatSection,
  ForumsSection,
  EventsSection,
} from "@/components/community";
import { useSocket } from "@/hooks/useSocket";
import leoProfanity from "leo-profanity";

interface Message {
  id: number;
  text: string;
  sender: string;
  time: string;
}

interface Member {
  id: number;
  name: string;
  status: "online" | "away" | "offline";
  avatar: number;
}

interface APIMessage {
  _id: string;
  content: string;
  senderName: string;
  senderId?: string; // Made optional since API handles user creation
  createdAt: string;
  type?: string;
}

interface APIMember {
  id: number;
  name: string;
  status: "online" | "away" | "offline";
  avatar?: number;
}

interface SocketMessage {
  teamId: string;
  message: string;
  senderId?: string; // Made optional since we don't send it
  senderName: string;
  type?: string;
  timestamp: number;
}

// Initialize leo-profanity with multi-language support
// Add support for multiple languages
leoProfanity.add([
  // English (already included by default)
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'piss',
  'dick', 'cock', 'pussy', 'tits', 'boobs', 'ass', 'butt', 'sex',
  'porn', 'nude', 'naked', 'slut', 'whore', 'fag', 'nigger', 'chink',
  'gook', 'spic', 'wetback', 'kike', 'heeb', 'coon', 'jap', 'slope',
  
  // Spanish
  'mierda', 'joder', 'coño', 'puta', 'marica', 'gilipollas', 'cabron', 'pendejo',
  'verga', 'chingar', 'madre', 'culo', 'tetas', 'cojones', 'follar', 'sexo',
  
  // French
  'merde', 'putain', 'connard', 'salope', 'enculé', 'bordel', 'bite', 'chatte',
  'cul', 'seins', 'foutre', 'baise', 'salaud', 'garce',
  
  // German
  'scheiße', 'ficken', 'arschloch', 'schlampe', 'wichser', 'verdammt', 'scheiß',
  'fotze', 'schwanz', 'titten', 'arsch', 'fick', 'bumsen',
  
  // Italian
  'merda', 'cazzo', 'figa', 'stronzo', 'puttana', 'culo', 'tette', 'coglioni',
  'scopare', 'fanculo', 'vaffanculo', 'rompicoglioni',
  
  // Portuguese
  'merda', 'foder', 'caralho', 'puta', 'cu', 'buceta', 'pau', 'bosta',
  'porra', 'filho da puta', 'arrombado', 'viado',
  
  // Russian
  'хуй', 'пизда', 'ебать', 'блядь', 'сука', 'мудак', 'говно', 'жопа',
  'титьки', 'член', 'еблан', 'пидор',
  
  // Arabic
  'كس', 'طيز', 'قحبة', 'شرموطة', 'منيك', 'زب', 'مص', 'شرج',
  
  // Hindi/Urdu
  'चूत', 'चुदाई', 'गांड', 'लंड', 'मादरचोद', 'बहनचोद', 'बेटीचोद',
  'लौड़ा', 'रंडी', 'साली', 'कुत्ती',
  
  // Japanese
  'くたばれ', '死ね', '馬鹿', 'アホ', 'バカ', 'チクショウ', 'くたばりやがれ',
  
  // Chinese
  '他妈的', '操', '屄', '鸡巴', '傻逼', '王八蛋', '狗日的'
]);

const checkProfanity = (text: string): boolean => {
  return leoProfanity.check(text);
};

const filterProfanity = (text: string): string => {
  return leoProfanity.clean(text);
};

export default function Page() {
  const [activeCommunity, setActiveCommunity] = useState("main");
  const [showIntro, setShowIntro] = useState(true);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [showCommandLine, setShowCommandLine] = useState(false);
  const [scanlines, setScanlines] = useState(true);
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);

  const { socket, isConnected } = useSocket();

  // Initialize user name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('hackabyte-username');
    if (savedName) {
      setUserName(savedName);
    } else {
      setShowNameModal(true);
    }
  }, []);

  // Handle name selection
  const handleNameSubmit = (name: string) => {
    if (name.trim()) {
      setUserName(name.trim());
      localStorage.setItem('hackabyte-username', name.trim());
      setShowNameModal(false);
    }
  };

  // Fetch chat messages from API
  const fetchChatMessages = async () => {
    setIsLoadingMessages(true);
    try {
      // Only fetch recent messages for efficiency
      const response = await fetch('/api/chat-message?limit=20&offset=0');
      const data = await response.json();
      if (data.success) {
        const transformedMessages: Message[] = data.messages.map((msg: APIMessage, index: number) => ({
          id: index + 1,
          text: msg.content,
          sender: msg.senderName || 'Unknown',
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        // Update messages efficiently - only replace if there are new messages
        setChatMessages(prevMessages => {
          // Check if we have new messages by comparing the latest message
          if (transformedMessages.length > 0 && prevMessages.length > 0) {
            const latestNewMessage = transformedMessages[transformedMessages.length - 1];
            const latestOldMessage = prevMessages[prevMessages.length - 1];

            // If the latest messages are the same, don't update
            if (latestNewMessage.text === latestOldMessage.text &&
                latestNewMessage.sender === latestOldMessage.sender) {
              return prevMessages;
            }
          }

          return transformedMessages;
        });
      }
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Fetch online members from API
  const fetchOnlineMembers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success && data.members.length > 0) {
        // Transform API data to match component interface
        const transformedMembers: Member[] = data.members.map((member: APIMember, index: number) => ({
          id: index + 1,
          name: member.name,
          status: member.status,
          avatar: member.avatar || 1
        }));
        setActiveMembers(transformedMembers);
      } else {
        // If no real members, show empty list (no static data)
        setActiveMembers([]);
      }
    } catch (error) {
      console.error('Failed to fetch online members:', error);
      // Show empty list on error
      setActiveMembers([]);
    }
  };

"use client";
/**
 * Community Page - Now Functional with Real Data
 *
 * Changes made:
 * - Replaced static chat messages with real data from /api/chat-message
 * - Added socket integration for real-time messaging
 * - Added API call to send messages to database
 * - Added online members fetching from /api/users
 * - Added proper error handling and loading states
 * - Added periodic refresh of chat messages
 * - Added profanity filtering and rate limiting
 * - Added name persistence and character count validation
 * - Added multi-language profanity filtering with leo-profanity
 */

useEffect(() => {
    // Toggle scanlines periodically for effect
    const scanlinesInterval = setInterval(() => {
      setScanlines((prev) => !prev);
      setTimeout(() => setScanlines(true), 100);
    }, 5000);

    // Hide intro after 4 seconds
    const introTimer = setTimeout(() => {
      setShowIntro(false);
    }, 4000);

    return () => {
      clearInterval(scanlinesInterval);
      clearTimeout(introTimer);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    fetchChatMessages();
    fetchOnlineMembers();
  }, []);

  // Periodic refresh of chat messages (increased frequency for better real-time feel)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!isLoadingMessages && activeCommunity === "chat") {
        fetchChatMessages();
      }
    }, 2000); // Refresh every 2 seconds for better responsiveness

    return () => clearInterval(refreshInterval);
  }, [isLoadingMessages, activeCommunity]);

  // Handle socket connection and room joining
  useEffect(() => {
    if (socket && isConnected) {
      // Join community room
      socket.emit('join-team', 'community');
      console.log('Joined community chat room');

      // Listen for new messages
      socket.on('new-message', (messageData: SocketMessage) => {
        console.log('Received socket message:', messageData);

        // Only add messages from other users to avoid duplicates
        if (messageData.senderName !== userName) {
          // Filter profanity from incoming messages
          const filteredMessage = filterProfanity(messageData.message);

          const newMessage: Message = {
            id: Date.now(),
            text: filteredMessage,
            sender: messageData.senderName,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };

          // Add to chat messages (append to existing)
          setChatMessages(prev => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.some(msg =>
              msg.sender === newMessage.sender &&
              msg.text === newMessage.text &&
              Math.abs(new Date(msg.time).getTime() - new Date(newMessage.time).getTime()) < 5000 // Within 5 seconds
            );

            if (!messageExists) {
              console.log('Adding new socket message to chat');
              return [...prev, newMessage];
            } else {
              console.log('Socket message already exists, skipping');
              return prev;
            }
          });
        } else {
          console.log('Ignoring own message from socket');
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new-message');
      }
    };
  }, [socket, isConnected, userName]);

  // Send message via API (optimized for speed)
  const sendMessage = async (content: string, senderName: string = 'Anonymous') => {
    try {
      // Fire and forget - don't wait for response to avoid blocking UI
      fetch('/api/chat-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Don't send senderId - let API handle anonymous user creation
          senderName,
          content,
          messageType: 'text'
        }),
      }).catch(error => {
        console.error('Failed to send message to API:', error);
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleChatSubmit = async (message: string) => {
    if (!userName) {
      setShowNameModal(true);
      return;
    }

    // Rate limiting - prevent spam (minimum 2 seconds between messages)
    const now = Date.now();
    if (now - lastMessageTime < 2000) {
      alert('⏱️ Please wait a moment before sending another message.');
      return;
    }

    // Check message length
    if (message.length > 500) {
      alert('📝 Message is too long. Please keep it under 500 characters.');
      return;
    }

    if (message.length < 1) {
      return; // Don't send empty messages
    }

    // Check for profanity
    if (checkProfanity(message)) {
      // Show warning and don't send the message
      alert('⚠️ Your message contains inappropriate content. Please keep the conversation respectful and family-friendly.');
      return;
    }

    // Filter profanity from the message
    const filteredMessage = filterProfanity(message);

    // Update last message time
    setLastMessageTime(now);

    // Add user message immediately for instant feedback
    const newUserMessage: Message = {
      id: Date.now(), // Use timestamp for unique ID
      text: filteredMessage,
      sender: userName,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newUserMessage]);

    try {
      // Send message via API (optimized - no await to prevent blocking)
      sendMessage(filteredMessage, userName);

      // Send via socket if connected for real-time updates
      if (socket && isConnected) {
        socket.emit('send-message', {
          teamId: 'community',
          message: filteredMessage,
          // Don't send senderId for socket - let server handle user identification
          senderName: userName,
          type: 'text'
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderCommunitySection = () => {
    if (activeCommunity === "main") {
      return (
        <div className="space-y-6">
          <CommunityChannels
            onChannelClick={setActiveCommunity}
            onCommandLineClick={() => setShowCommandLine(true)}
          />
          <LatestActivity />
          <OnlineMembers members={activeMembers} />
        </div>
      );
    } else if (activeCommunity === "chat") {
      return (
        <ChatSection
          onBack={() => setActiveCommunity("main")}
          messages={chatMessages}
          onSendMessage={handleChatSubmit}
          userName={userName}
        />
      );
    } else if (activeCommunity === "forums") {
      return <ForumsSection onBack={() => setActiveCommunity("main")} />;
    } else if (activeCommunity === "events") {
      return <EventsSection onBack={() => setActiveCommunity("main")} />;
    }

    return null;
  };

  return (
    <div className="min-h-screen w-full pt-20 relative">
      <BackgroundAnimation scanlines={scanlines} />
      <IntroAnimation showIntro={showIntro} />
      <CommandLineModal showCommandLine={showCommandLine} onClose={() => setShowCommandLine(false)} />

      {/* Name Selection Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-cyber-primary/50 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-cyber-primary text-xl font-bold mb-4 text-center">
              ENTER YOUR NAME
            </h2>
            <p className="text-gray-400 text-sm mb-6 text-center">
              Choose a name to join the community chat
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const name = formData.get('name') as string;
                handleNameSubmit(name);
              }}
              className="space-y-4"
            >
              <input
                type="text"
                name="name"
                placeholder="Your name..."
                className="w-full bg-black/60 border border-cyber-primary/30 rounded-md px-4 py-3 text-gray-200 focus:outline-none focus:border-cyber-primary/70"
                autoFocus
                maxLength={20}
                required
              />
              <button
                type="submit"
                className="w-full bg-cyber-primary/20 border border-cyber-primary px-4 py-3 rounded-md text-cyber-primary hover:bg-cyber-primary/30 font-bold"
              >
                JOIN CHAT
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="inline-block px-3 py-1 border border-cyber-primary/50 text-cyber-primary text-xs mb-2 rounded-sm">
              [SYSTEM:NETWORK]
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-primary to-cyber-secondary">
              HACKABYTE COMMUNITY
            </h1>
            {userName && (
              <p className="text-cyber-secondary text-sm mt-1">
                Logged in as: <span className="text-cyber-primary font-bold">{userName}</span>
                <button
                  onClick={() => setShowNameModal(true)}
                  className="ml-2 text-xs text-gray-400 hover:text-cyber-secondary underline"
                >
                  (change)
                </button>
              </p>
            )}
          </div>

          <div className="hidden md:block">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <span>STATUS:</span>
              <span className="text-cyber-primary">ONLINE</span>
              <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse"></div>
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {renderCommunitySection()}
      </div>
    </div>
  );
}
