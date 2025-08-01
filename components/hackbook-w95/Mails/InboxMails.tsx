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

export default function InboxMails({ setUnreadCount }: { setUnreadCount?: (count: number) => void }) {
  // Removed selectedMail state since mails now open in separate windows
  const [mails, setMails] = useState<Mail[]>([
    {
      id: "ghost-contract",
      sender: "Agent X",
      subject: "CONFIDENTIAL: First Contract - Password Recovery",
      date: "1995-11-28",
      content: `ENCRYPTED TRANSMISSION - AGENT X NETWORK
      
AGENT STATUS: PROBATIONARY
CONTRACT: #001-ZIP-RECOVERY

Welcome to the digital underground, new recruit. 

Your first assignment is a simple data recovery operation - consider it your initiation test. We've received a request from a client who has lost access to critical files stored in an old ZIP archive.

MISSION OBJECTIVES:
1. Open "My Computer" and navigate to the C:\\ drive
2. Locate the password-protected ZIP file at: C:\\Documents\\Old_Files\\Archive.zip
3. Recover the forgotten password using brute force methods
4. Extract the contents and examine all recovered files
5. Follow the instructions contained within

TOOLS AVAILABLE:
- Basic brute force utilities
- Your wit and determination

The client's data contains sensitive information about secure communication channels. Success will grant you access to our encrypted messaging network and more lucrative contracts.

Remember: In this business, trust is earned through results.

Good hunting.

-- AGENT X

`,
      isRead: false,
    },
  ]);

  // Update unread count whenever mails state changes
  const updateUnreadCount = (mailsArg?: Mail[]) => {
    if (setUnreadCount) {
      const mailsToCheck = mailsArg || mails;
      const unreadCount = mailsToCheck.filter(mail => !mail.isRead).length;
      setUnreadCount(unreadCount);
    }
  };

  // Mark email as read when selected and open in separate window
  const handleMailSelect = (mail: Mail) => {
    if (!mail.isRead) {
      const updatedMails = mails.map(m => 
        m.id === mail.id ? { ...m, isRead: true } : m
      );
      setMails(updatedMails);
      updateUnreadCount(updatedMails);
    }
    
    // Open mail in separate Notepad window
    const event = new CustomEvent('win95openfile', {
      detail: {
        path: `${mail.subject} - ${mail.sender}`,
        content: `From: ${mail.sender}
Sent: ${mail.date}
To: New Windows 95 Customer
Subject: ${mail.subject}

${mail.content}${mail.link ? `\n\nLink: ${mail.link}` : ''}`,
        extension: 'txt'
      }
    });
    window.dispatchEvent(event);
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
          "hover:bg-[#e0e0e0]": true,
        })}
      >
        <div className="w-6 flex-shrink-0 flex items-center justify-center">
          <Image 
            src={"/hackbook-W95/mail.png"} 
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
      
      {/* Mail detail view removed - mails now open in separate Notepad windows */}
    </div>
  ));
}
