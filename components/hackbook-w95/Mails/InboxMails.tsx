"use client";

import { useState } from "react";
import clsx from "clsx";
import Image from "next/image";

interface Mail {
  id: string;
  sender: string;
  subject: string;
  date: string;
  content: string;
  isRead: boolean;
  link?: string;
}

export default function InboxMails({ openLink, setUnreadCount }: { openLink: (link: string) => void, setUnreadCount?: (count: number) => void }) {
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [mails, setMails] = useState<Mail[]>([
    {
      id: "mission-1",
      sender: "Security Officer",
      subject: "CONFIDENTIAL: First Mission Brief",
      date: "1995-11-28",
      content: `TOP SECRET - SECURITY CLEARANCE LEVEL 1
      
AGENT: NEW RECRUIT
MISSION: DATA RETRIEVAL 001

This is your first mission briefing. You have been granted access to a secure terminal with potential sensitive information.

OBJECTIVE:
1. Locate the encrypted files in the system
2. Find the decryption key in the hidden system files
3. Use the Terminal to decrypt the protected data
4. Retrieve the final password

INSTRUCTIONS:
- Open "My Computer" to navigate the file system
- Look for files in C:\\Documents\\Encrypted
- Check C:\\Windows\\System32 for hidden files (files starting with '.')
- Use the Terminal and enter "help" for available commands
- When you find the access code, use "access [CODE]" in the Terminal
- Use "decrypt-file" with the correct parameters to access encrypted information

NOTE: For security reasons, some files are encrypted with a Caesar cipher using a shift of 3.

IMPORTANT: Do not share this mission with unauthorized personnel.

DELETE THIS MESSAGE AFTER READING

-- Security Officer`,
      isRead: false,
    }
  ]);

  // Update unread count whenever mails state changes
  const updateUnreadCount = () => {
    if (setUnreadCount) {
      const unreadCount = mails.filter(mail => !mail.isRead).length;
      setUnreadCount(unreadCount);
    }
  };

  // Mark email as read when selected
  const handleMailSelect = (mail: Mail) => {
    if (!mail.isRead) {
      const updatedMails = mails.map(m => 
        m.id === mail.id ? { ...m, isRead: true } : m
      );
      setMails(updatedMails);
      setTimeout(updateUnreadCount, 0);
    }
    setSelectedMail(mail);
  };

  // Return early if there are no emails
  if (!mails || mails.length === 0) {
    return <div className="p-4 text-sm">No messages found.</div>;
  }

  return mails.map((mail: Mail, index: number) => (
    <div
      key={index}
      onClick={() => {
        handleMailSelect(mail);
      }}
      className="relative"
    >
      <div
        className={clsx("flex items-center border-b border-[#e0e0e0] py-1 px-1 cursor-pointer", {
          "bg-[#0000aa] text-white": selectedMail === mail,
          "hover:bg-[#e0e0e0]": selectedMail !== mail,
        })}
      >
        <div className="w-6 flex-shrink-0 flex items-center justify-center">
          <Image 
            src={mail.isRead ? "/hackbook-W95/mail.png" : "/hackbook-W95/new-mail.png"} 
            alt="Mail icon" 
            width={16} 
            height={16} 
            className="h-4 w-4" 
          />
        </div>
        <div className="w-1/3 px-2 truncate text-sm">{mail.sender}</div>
        <div className="w-1/2 px-2 truncate text-sm">{mail.subject}</div>
        <div className="flex-1 px-2 text-sm text-right">{mail.date}</div>
      </div>
      
      {selectedMail === mail && (
        <div className="fixed inset-16 z-10 flex flex-col bg-white border-2 border-[#808080]">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center">
            <div className="flex-1 text-sm font-bold">Welcome! - Microsoft Exchange</div>
            <button 
              className="text-white h-[14px] flex items-center justify-center text-sm font-bold leading-none"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMail(null);
              }}
            >
              ×
            </button>
          </div>
          
          <div className="flex-1 flex flex-col p-2 overflow-auto">
            <div className="border-b border-gray-300 pb-2 mb-2">
              <div className="text-sm"><strong>From:</strong> {mail.sender}</div>
              <div className="text-sm"><strong>Sent:</strong> {mail.date}</div>
              <div className="text-sm"><strong>To:</strong> New Windows 95 Customer</div>
              <div className="text-sm"><strong>Subject:</strong> {mail.subject}</div>
            </div>
            
            <div className="font-serif whitespace-pre-wrap text-sm flex-1">{mail.content}</div>
            
            {mail.link && (
              <div className="mt-4 text-sm">
                <span>Browse the link: </span>
                <span 
                  className="text-blue-800 underline cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mail.link) {
                      openLink(mail.link);
                    }
                  }}
                >
                  {mail.link}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  ));
}
