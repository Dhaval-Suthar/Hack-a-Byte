"use client";

import React, { useState } from "react";

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  photo?: string;
  linkedContacts?: string[];
}

interface PhoneAppProps {
  onClose: () => void;
  onOpenContacts?: () => void;
  initialPhoneNumber?: string;
  time?: Date;
}
const PhoneApp: React.FC<PhoneAppProps> = ({ onClose, onOpenContacts, initialPhoneNumber }) => {
  const [dialedNumber, setDialedNumber] = useState(initialPhoneNumber || "");
  const [activeTab, setActiveTab] = useState<"favorites" | "recents" | "contacts" | "keypad" | "voicemail">(initialPhoneNumber ? "keypad" : "keypad");
  const [callState, setCallState] = useState<"idle" | "dialing" | "ringing" | "connected" | "ended">("idle");
  const [callDuration, setCallDuration] = useState(0);

  

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Demo contacts data (same as ContactsApp)
  const contacts: Contact[] = [
    {
      id: "1",
      name: "Corey Barker",
      phone: "(808) 555-1234",
      email: "corey@example.com",
      company: "Tech Corp"
    },
    {
      id: "2", 
      name: "Help-Portrait Community",
      phone: "(555) 123-4567",
      company: "Non-profit"
    },
    {
      id: "3",
      name: "Jennifer Concepcion", 
      phone: "(555) 987-6543",
      email: "jennifer@example.com"
    },
    {
      id: "4",
      name: "RC Concepcion",
      phone: "(555) 456-7890"
    },
    {
      id: "5",
      name: "Scott Cowlin",
      phone: "(555) 321-0987"
    }
  ];

  const recentCalls = [
    { id: "1", name: "Corey Barker", phone: "(808) 555-1234", type: "outgoing", time: "2:30 PM", missed: false },
    { id: "2", name: "Jennifer Concepcion", phone: "(555) 987-6543", type: "incoming", time: "1:15 PM", missed: true },
    { id: "3", name: "RC Concepcion", phone: "(555) 456-7890", type: "outgoing", time: "11:45 AM", missed: false },
    { id: "4", name: "Unknown", phone: "(555) 999-8888", type: "incoming", time: "Yesterday", missed: false },
  ];

  const favorites = [
    { id: "1", name: "Corey Barker", phone: "(808) 555-1234" },
    { id: "3", name: "Jennifer Concepcion", phone: "(555) 987-6543" },
  ];

  const handleKeypadPress = (digit: string) => {
    if (callState === "idle") {
      setDialedNumber(prev => prev + digit);
    }
  };

  const handleCall = () => {
    if (dialedNumber && callState === "idle") {
      setCallState("dialing");
      setTimeout(() => setCallState("ringing"), 1000);
      setTimeout(() => setCallState("connected"), 3000);
      
      // Start call timer
      let duration = 0;
      const timer = setInterval(() => {
        duration++;
        setCallDuration(duration);
      }, 1000);
      
      // Store timer reference for cleanup
      (globalThis as { callTimer?: NodeJS.Timeout }).callTimer = timer;
    }
  };

  const handleEndCall = () => {
    // Clear the timer
    const globalObj = globalThis as { callTimer?: NodeJS.Timeout };
    if (globalObj.callTimer) {
      clearInterval(globalObj.callTimer);
      globalObj.callTimer = undefined;
    }
    
    setCallState("ended");
    setTimeout(() => {
      setCallState("idle");
      setCallDuration(0);
      setDialedNumber("");
    }, 2000);
  };

  const handleDelete = () => {
    setDialedNumber(prev => prev.slice(0, -1));
  };

  // status bar removed

  const renderKeypad = () => (
    <div className="flex-1 bg-white text-black flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900 text-center">Keypad</h1>
      </div>

      {/* Dialed number display */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-3xl font-light mb-2 min-h-[40px] tracking-wider text-gray-900">
            {dialedNumber || ""}
          </div>
          {dialedNumber && (
            <div className="text-gray-500 text-sm">
              {/* Try to find contact name */}
              {contacts.find(c => c.phone === dialedNumber)?.name || ""}
            </div>
          )}
        </div>
      </div>

      {/* Call controls */}
      <div className="px-8 py-4 flex justify-center space-x-8">
        {dialedNumber && (
          <button
            onClick={handleCall}
            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <span className="text-2xl text-white">📞</span>
          </button>
        )}
      </div>

      {/* Keypad */}
      <div className="px-8 pb-8">
        <div className="grid grid-cols-3 gap-4">
          {[
            { digit: "1", letters: "" },
            { digit: "2", letters: "ABC" },
            { digit: "3", letters: "DEF" },
            { digit: "4", letters: "GHI" },
            { digit: "5", letters: "JKL" },
            { digit: "6", letters: "MNO" },
            { digit: "7", letters: "PQRS" },
            { digit: "8", letters: "TUV" },
            { digit: "9", letters: "WXYZ" },
            { digit: "*", letters: "" },
            { digit: "0", letters: "+" },
            { digit: "#", letters: "" },
          ].map((key) => (
            <button
              key={key.digit}
              onClick={() => handleKeypadPress(key.digit)}
              className="w-20 h-20 rounded-full bg-gray-100 border border-gray-300 flex flex-col items-center justify-center active:bg-gray-200 mx-auto shadow-sm"
            >
              <span className="text-2xl font-light text-gray-900">{key.digit}</span>
              {key.letters && (
                <span className="text-xs text-gray-500 font-medium tracking-widest">
                  {key.letters}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Delete button */}
        {dialedNumber && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleDelete}
              className="w-12 h-12 flex items-center justify-center"
            >
              <span className="text-gray-500 text-lg">⌫</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderRecents = () => (
    <div className="flex-1 bg-white">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Recents</h1>
        <button className="text-blue-500 font-medium">Edit</button>
      </div>
      
      <div className="flex-1">
        {recentCalls.map((call) => (
          <div
            key={call.id}
            className="flex items-center px-4 py-3 border-b border-gray-200"
          >
            <div className="w-2 h-2 mr-3">
              {call.type === "outgoing" && <span className="text-blue-500">↗️</span>}
              {call.type === "incoming" && !call.missed && <span className="text-green-500">↙️</span>}
              {call.missed && <span className="text-red-500">📞</span>}
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-gray-900">{call.name}</div>
              <div className="text-sm text-gray-500">{call.phone}</div>
            </div>
            
            <div className="text-right mr-4">
              <div className="text-sm text-gray-500">{call.time}</div>
            </div>
            
            <button 
              onClick={() => {
                setDialedNumber(call.phone);
                setActiveTab("keypad");
              }}
              className="w-8 h-8 flex items-center justify-center"
            >
              <span className="text-blue-500 text-lg">📞</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFavorites = () => (
    <div className="flex-1 bg-white">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Favorites</h1>
        <button className="text-blue-500 font-medium">Edit</button>
      </div>
      
      <div className="flex-1">
        {favorites.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center px-4 py-3 border-b border-gray-200"
          >
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3 text-gray-600 text-sm">
              {contact.name.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-gray-900">{contact.name}</div>
              <div className="text-sm text-gray-500">{contact.phone}</div>
            </div>
            
            <button 
              onClick={() => {
                setDialedNumber(contact.phone);
                setActiveTab("keypad");
              }}
              className="ml-4 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-lg">📞</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="flex-1 bg-white">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Contacts</h1>
        <button 
          onClick={onOpenContacts}
          className="text-blue-500 font-medium"
        >
          All Contacts
        </button>
      </div>
      
      <div className="flex-1">
        {contacts.slice(0, 5).map((contact) => (
          <div
            key={contact.id}
            className="flex items-center px-4 py-3 border-b border-gray-200"
          >
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3 text-gray-600 text-sm">
              {contact.name.split(' ').map(n => n[0]).join('')}
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-gray-900">{contact.name}</div>
              <div className="text-sm text-gray-500">{contact.phone}</div>
            </div>
            
            <button 
              onClick={() => {
                setDialedNumber(contact.phone || "");
                setActiveTab("keypad");
              }}
              className="ml-4 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-lg">📞</span>
            </button>
          </div>
        ))}
        
        <button
          onClick={onOpenContacts}
          className="w-full px-4 py-3 text-blue-500 font-medium text-left"
        >
          See All Contacts...
        </button>
      </div>
    </div>
  );

  const renderVoicemail = () => (
    <div className="flex-1 bg-white">
      <div className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Voicemail</h1>
      </div>
      
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">📢</div>
          <div className="text-lg font-medium mb-2">No Voicemails</div>
          <div className="text-sm">You have no voicemail messages.</div>
        </div>
      </div>
    </div>
  );

  const renderCallScreen = () => (
    <div className="w-screen h-screen bg-white text-black flex flex-col">
      {/* Special call status bar */}
      <div className="flex justify-between items-center px-4 pt-2 pb-1 text-white text-[11px] tracking-wide bg-green-600">
        <div className="flex items-center space-x-1">
          <div className="flex items-end space-x-[2px]">
            <div className="w-[3px] h-[6px] bg-white rounded-[1px]" />
            <div className="w-[3px] h-[8px] bg-white rounded-[1px]" />
            <div className="w-[3px] h-[10px] bg-white rounded-[1px]" />
            <div className="w-[3px] h-[8px] bg-white/60 rounded-[1px]" />
            <div className="w-[3px] h-[6px] bg-white/40 rounded-[1px]" />
          </div>
          <span className="opacity-90">Verizon</span>
          <span className="opacity-90">📶</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* time removed */}
          <div className="w-7 h-[14px] border border-white/70 rounded-[2px] relative">
            <div className="absolute inset-[2px] w-[16px] bg-green-500 rounded-[1px]" />
            <div className="w-[3px] h-[6px] bg-white/70 rounded-sm absolute -right-[5px] top-[4px]" />
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Contact info */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-4xl text-gray-600">👤</span>
          </div>
          
          <div className="text-xl font-light mb-2 text-gray-900">
            {contacts.find(c => c.phone === dialedNumber)?.name || dialedNumber}
          </div>
          
          <div className="text-gray-500">
            {callState === "dialing" && "Calling..."}
            {callState === "ringing" && "Ringing..."}
            {callState === "connected" && formatDuration(callDuration)}
            {callState === "ended" && "Call Ended"}
          </div>
        </div>
        
        {/* Call controls */}
        <div className="flex space-x-8">
          {callState === "connected" && (
            <>
              <button className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl text-white">🔇</span>
              </button>
              <button className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl text-white">🔊</span>
              </button>
            </>
          )}
          
          <button
            onClick={handleEndCall}
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <span className="text-2xl text-white">📞</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (callState !== "idle") {
    return renderCallScreen();
  }

  return (
    <div className="w-screen h-screen bg-gray-100 flex flex-col">
      
      {/* Tab content */}
      {activeTab === "favorites" && renderFavorites()}
      {activeTab === "recents" && renderRecents()}
      {activeTab === "contacts" && renderContacts()}
      {activeTab === "keypad" && renderKeypad()}
      {activeTab === "voicemail" && renderVoicemail()}

      {/* Bottom Tab Bar */}
      <div className="bg-gray-200 border-t border-gray-300">
        <div className="flex">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 py-2 px-1 text-center ${
              activeTab === "favorites" ? "text-blue-500" : "text-gray-600"
            }`}
          >
            <div className="text-lg mb-1">⭐</div>
            <div className="text-xs">Favorites</div>
          </button>
          
          <button
            onClick={() => setActiveTab("recents")}
            className={`flex-1 py-2 px-1 text-center ${
              activeTab === "recents" ? "text-blue-500" : "text-gray-600"
            }`}
          >
            <div className="text-lg mb-1">🕐</div>
            <div className="text-xs">Recents</div>
          </button>
          
          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex-1 py-2 px-1 text-center ${
              activeTab === "contacts" ? "text-blue-500" : "text-gray-600"
            }`}
          >
            <div className="text-lg mb-1">👤</div>
            <div className="text-xs">Contacts</div>
          </button>
          
          <button
            onClick={() => setActiveTab("keypad")}
            className={`flex-1 py-2 px-1 text-center ${
              activeTab === "keypad" ? "text-blue-500" : "text-gray-600"
            }`}
          >
            <div className="text-lg mb-1">⌨️</div>
            <div className="text-xs">Keypad</div>
          </button>
          
          <button
            onClick={() => setActiveTab("voicemail")}
            className={`flex-1 py-2 px-1 text-center ${
              activeTab === "voicemail" ? "text-blue-500" : "text-gray-600"
            }`}
          >
            <div className="text-lg mb-1">📢</div>
            <div className="text-xs">Voicemail</div>
          </button>
        </div>
      </div>
      
      {/* Home button */}
      <div className="bg-gray-800 h-16 flex items-center justify-around">
        <button
          onClick={onClose}
          className="text-blue-400 text-sm font-medium flex flex-col items-center"
        >
          <span className="text-lg mb-1">⌂</span>
          <span className="text-xs">Home</span>
        </button>
        
        <div className="text-white text-sm font-medium flex flex-col items-center">
          <span className="text-lg mb-1">📞</span>
          <span className="text-xs">Phone</span>
        </div>
        
        <button
          onClick={onOpenContacts}
          className="text-green-400 text-sm font-medium flex flex-col items-center"
        >
          <span className="text-lg mb-1">👤</span>
          <span className="text-xs">Contacts</span>
        </button>
      </div>
    </div>
  );
};

export default PhoneApp;
