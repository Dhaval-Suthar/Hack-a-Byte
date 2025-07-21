"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import Image from "next/image";

interface Mail {
  id: string;
  receiver: string;
  subject: string;
  date: string;
  content: string;
  link?: string;
}

export default function OutboxMails({ openLink }: { openLink: (link: string) => void }) {
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [mails, setMails] = useState<Mail[]>([]);

  // Check if mission is completed using user-specific mission tracker
  useEffect(() => {
    const checkMissionStatus = () => {
      try {
        // Import dynamically to avoid SSR issues
        import('../hooks/useMissionTracker').then(({ MissionTracker }) => {
          const missionCompleted = MissionTracker.isMissionCompleted('mission1');
          if (missionCompleted) {
            // Add response email if mission is completed
            setMails([
              {
                id: "mission1-response",
                receiver: "Security Officer",
                subject: "RE: First Mission Complete",
                date: new Date().toISOString().split('T')[0],
                content: `MISSION REPORT: DATA RETRIEVAL 001
                
STATUS: COMPLETE

I have successfully located and decrypted the protected data.

The password is: HACKBOOK

Awaiting further instructions.
                
-- New Recruit`,
              }
            ]);
          }
        });
      } catch (error) {
        console.error("Error checking mission status:", error);
      }
    };

    checkMissionStatus();

    // Set up listener to catch mission completion event
    const handleMissionComplete = () => checkMissionStatus();
    window.addEventListener('missionComplete', handleMissionComplete);

    return () => {
      window.removeEventListener('missionComplete', handleMissionComplete);
    };
  }, []);

  if (mails.length === 0) {
    return <div className="p-4 text-sm">No outgoing messages.</div>;
  }

  return mails.map((mail: Mail, index: number) => (
    <div
      key={index}
      onClick={() => {
        setSelectedMail(mail);
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
            src="/hackbook-W95/mail.png"
            alt="Mail icon"
            width={16}
            height={16}
            className="h-4 w-4"
          />
        </div>
        <div className="w-1/3 px-2 truncate text-sm">{mail.receiver}</div>
        <div className="w-1/2 px-2 truncate text-sm">{mail.subject}</div>
        <div className="flex-1 px-2 text-sm text-right">{mail.date}</div>
      </div>
      
      {selectedMail === mail && (
        <div className="fixed inset-16 z-10 flex flex-col bg-white border-2 border-[#808080]">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center">
            <div className="flex-1 text-sm font-bold">Message - Microsoft Exchange</div>
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
              <div className="text-sm"><strong>To:</strong> {mail.receiver}</div>
              <div className="text-sm"><strong>Sent:</strong> {mail.date}</div>
              <div className="text-sm"><strong>From:</strong> New Recruit</div>
              <div className="text-sm"><strong>Subject:</strong> {mail.subject}</div>
            </div>
            
            <div className="font-serif whitespace-pre-wrap text-sm flex-1">{mail.content}</div>
            
            {mail.link && (
              <div className="mt-4 text-sm">
                <span>Link: </span>
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