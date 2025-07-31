"use client";

import clsx from "clsx";
import React, { useState } from "react";
import Win95Alert from "@/components/hackbook-w95/Win95Alert";
import InboxMails from "../Mails/InboxMails";
import OutboxMails from "../Mails/OutboxMails";
import Image from "next/image";

interface InboxProps {
  openLink: (link: string) => void;
  onClose: () => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

interface EmailDraft {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  attachments: string[];
}

interface Contact {
  name: string;
  email: string;
}

export default function Inbox({ openLink, onClose, unreadCount, setUnreadCount }: InboxProps) {
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [selected, setSelected] = useState("Inbox");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isComposeMenuOpen, setIsComposeMenuOpen] = useState(false);
  const [isFindDialogOpen, setIsFindDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [emailDraft, setEmailDraft] = useState<EmailDraft>({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
    attachments: []
  });
  const [contacts] = useState<Contact[]>([
    { name: "Security Officer", email: "security@hackbyte.corp" },
    { name: "System Admin", email: "sysadmin@hackbyte.corp" },
    { name: "Help Desk", email: "helpdesk@hackbyte.corp" },
    { name: "Mission Control", email: "mission@hackbyte.corp" }
  ]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  
  // Close all menus
  const closeAllMenus = () => {
    setIsFileMenuOpen(false);
    setIsEditMenuOpen(false);
    setIsViewMenuOpen(false);
    setIsToolsMenuOpen(false);
    setIsComposeMenuOpen(false);
  };
  
  // Handle new message creation
  const handleNewMessage = () => {
    setIsComposeOpen(true);
    closeAllMenus();
  };
  
  // Handle email draft changes
  const handleEmailDraftChange = (field: keyof EmailDraft, value: string) => {
    setEmailDraft(prev => ({ ...prev, [field]: value }));
  };
  
  // Send email
  const handleSendEmail = () => {
    // In a real implementation, we would save this to outbox
    // For now, we'll just close the compose window
    setIsComposeOpen(false);
    // Reset email draft
    setEmailDraft({
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      body: "",
      attachments: []
    });
    // Show a success message with Win95Alert
    setAlertMessage("Message sent successfully!");
    setAlertOpen(true);
  };
  
  // Add selected contacts to the To field
  const addSelectedContactsToEmail = () => {
    if (selectedContacts.length > 0) {
      const contactEmails = selectedContacts.map(c => c.email).join("; ");
      handleEmailDraftChange('to', emailDraft.to ? emailDraft.to + "; " + contactEmails : contactEmails);
      setSelectedContacts([]);
      setIsAddressBookOpen(false);
    }
  };
  
  // Handle contact selection in address book
  const toggleContactSelection = (contact: Contact) => {
    const isSelected = selectedContacts.some(c => c.email === contact.email);
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter(c => c.email !== contact.email));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };
  
  // Handle attachment browsing
  const handleBrowseAttachments = () => {
    // In a real implementation, we would open a file browser
    // For now, we'll just add a dummy attachment
    const dummyAttachment = "Report.doc";
    if (!emailDraft.attachments.includes(dummyAttachment)) {
      setEmailDraft(prev => ({
        ...prev,
        attachments: [...prev.attachments, dummyAttachment]
      }));
    }
  };
  
  // Remove an attachment
  const handleRemoveAttachment = (attachment: string) => {
    setEmailDraft(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a !== attachment)
    }));
  };
  
  // Get the status message for the status bar
  const getStatusMessage = () => {
    if (selected === "Inbox") {
      return `${unreadCount} item${unreadCount !== 1 ? 's' : ''}, ${unreadCount} unread`;
    } else if (selected === "Outbox") {
      return "All messages sent";
    } else {
      return `Folder: ${selected}`;
    }
  };

  // Handle search in emails
  const searchEmails = () => {
    if (searchTerm.trim()) {
      setIsFindDialogOpen(false);
      // In a real implementation we would search through emails
      setAlertMessage(`Searching for: "${searchTerm}"`);
      setAlertOpen(true);
    }
  };
  
  // Render the find dialog
  const renderFindDialog = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
        <div className="bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] p-4 w-[350px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Find Message</h3>
            <button 
              className="text-xl leading-none"
              onClick={() => setIsFindDialogOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm mb-1">Find what:</label>
            <input 
              type="text" 
              className="w-full border border-[#808080] p-1 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchEmails();
                }
              }}
            />
          </div>
          
          <div className="flex justify-between">
            <div>
              <label className="flex items-center text-sm mb-2">
                <input type="checkbox" className="mr-1" />
                Match case
              </label>
              <label className="flex items-center text-sm">
                <input type="checkbox" className="mr-1" />
                Find whole words only
              </label>
            </div>
            
            <div className="flex flex-col space-y-2">
              <button 
                className="px-4 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black text-sm"
                onClick={searchEmails}
              >
                Find Next
              </button>
              <button 
                className="px-4 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black text-sm"
                onClick={() => setIsFindDialogOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#c0c0c0]">
      {alertOpen && (
        <Win95Alert message={alertMessage} onClose={() => setAlertOpen(false)} />
      )}
      {/* Title Bar */}
      <div className="w-full flex items-center bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 text-white">
        <div className="flex-1 text-sm font-bold">Inbox - Microsoft Exchange</div>
        <button 
          className="text-white ml-2 px-2 h-[14px] flex items-center justify-center text-sm font-bold leading-none"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {/* Menu Bar */}
      <div className="w-full flex text-sm items-center bg-[#c0c0c0] border-b border-b-[#808080] p-0.5">
        <div 
          className={clsx("px-2 py-0.5 cursor-pointer", {
            "bg-[#000080] text-white": isFileMenuOpen
          })}
          onClick={() => {
            setIsFileMenuOpen(!isFileMenuOpen);
            setIsEditMenuOpen(false);
            setIsViewMenuOpen(false);
            setIsToolsMenuOpen(false);
            setIsComposeMenuOpen(false);
          }}
        >
          File
        </div>
        <div 
          className={clsx("px-2 py-0.5 cursor-pointer", {
            "bg-[#000080] text-white": isEditMenuOpen
          })}
          onClick={() => {
            setIsEditMenuOpen(!isEditMenuOpen);
            setIsFileMenuOpen(false);
            setIsViewMenuOpen(false);
            setIsToolsMenuOpen(false);
            setIsComposeMenuOpen(false);
          }}
        >
          Edit
        </div>
        <div 
          className={clsx("px-2 py-0.5 cursor-pointer", {
            "bg-[#000080] text-white": isViewMenuOpen
          })}
          onClick={() => {
            setIsViewMenuOpen(!isViewMenuOpen);
            setIsFileMenuOpen(false);
            setIsEditMenuOpen(false);
            setIsToolsMenuOpen(false);
            setIsComposeMenuOpen(false);
          }}
        >
          View
        </div>
        <div 
          className={clsx("px-2 py-0.5 cursor-pointer", {
            "bg-[#000080] text-white": isToolsMenuOpen
          })}
          onClick={() => {
            setIsToolsMenuOpen(!isToolsMenuOpen);
            setIsFileMenuOpen(false);
            setIsEditMenuOpen(false);
            setIsViewMenuOpen(false);
            setIsComposeMenuOpen(false);
          }}
        >
          Tools
        </div>
        <div 
          className={clsx("px-2 py-0.5 cursor-pointer", {
            "bg-[#000080] text-white": isComposeMenuOpen
          })}
          onClick={() => {
            setIsComposeMenuOpen(!isComposeMenuOpen);
            setIsFileMenuOpen(false);
            setIsEditMenuOpen(false);
            setIsViewMenuOpen(false);
            setIsToolsMenuOpen(false);
          }}
        >
          Compose
        </div>
      </div>
      
      {/* File Menu Dropdown */}
      {isFileMenuOpen && (
        <div className="absolute mt-6 ml-0 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md w-32">
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white text-sm"
            onClick={() => {
              handleNewMessage();
              setIsFileMenuOpen(false);
            }}
          >
            New Message
          </div>
          <div className="h-[1px] bg-[#808080] my-1"></div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white text-sm"
            onClick={() => {
              onClose();
              setIsFileMenuOpen(false);
            }}
          >
            Exit
          </div>
          <div className="h-[1px] bg-[#808080] my-1"></div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white text-center text-sm"
            onClick={() => setIsFileMenuOpen(false)}
          >
            Close
          </div>
        </div>
      )}
      
      {/* Edit Menu Dropdown */}
      {isEditMenuOpen && (
        <div className="absolute mt-6 ml-8 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md w-24">
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white opacity-50 text-sm"
          >
            Cut
          </div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white opacity-50 text-sm"
          >
            Copy
          </div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white opacity-50 text-sm"
          >
            Paste
          </div>
          <div className="h-[1px] bg-[#808080] my-1"></div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white text-sm"
            onClick={() => {
              setIsFindDialogOpen(true);
              setIsEditMenuOpen(false);
            }}
          >
            Find...
          </div>
          <div className="h-[1px] bg-[#808080] my-1"></div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white text-center text-sm"
            onClick={() => setIsEditMenuOpen(false)}
          >
            Close
          </div>
        </div>
      )}
      
      {/* View Menu Dropdown */}
      {isViewMenuOpen && (
        <div className="absolute mt-6 ml-16 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md w-24">
          <div 
            className={clsx("px-3 py-1 hover:bg-[#000080] hover:text-white text-sm", {
              "bg-[#000080] text-white": selected === "Inbox"
            })}
            onClick={() => {
              setSelected("Inbox");
              setIsViewMenuOpen(false);
            }}
          >
            Inbox
          </div>
          <div 
            className={clsx("px-3 py-1 hover:bg-[#000080] hover:text-white text-sm", {
              "bg-[#000080] text-white": selected === "Outbox"
            })}
            onClick={() => {
              setSelected("Outbox");
              setIsViewMenuOpen(false);
            }}
          >
            Outbox
          </div>
          <div className="h-[1px] bg-[#808080] my-1"></div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white text-sm"
            onClick={() => {
              // Refresh logic would go here
              setIsViewMenuOpen(false);
            }}
          >
            Refresh
          </div>
          <div className="h-[1px] bg-[#808080] my-1"></div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white text-center text-sm"
            onClick={() => setIsViewMenuOpen(false)}
          >
            Close
          </div>
        </div>
      )}
      {/* Tools Menu Dropdown */}
      {isToolsMenuOpen && (
        <div className="absolute mt-6 ml-24 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md w-32">
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white text-sm"
            onClick={() => {
              setIsAddressBookOpen(true);
              setIsToolsMenuOpen(false);
            }}
          >
            Address Book
          </div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white opacity-50 text-sm"
          >
            Options...
          </div>
          <div className="h-[1px] bg-[#808080] my-1"></div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white text-center text-sm"
            onClick={() => setIsToolsMenuOpen(false)}
          >
            Close
          </div>
        </div>
      )}
      
      {/* Compose Menu Dropdown */}
      {isComposeMenuOpen && (
        <div className="absolute mt-6 ml-32 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md w-32">
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white text-sm"
            onClick={() => {
              handleNewMessage();
              setIsComposeMenuOpen(false);
            }}
          >
            New Message
          </div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white opacity-50 text-sm"
          >
            Reply
          </div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white opacity-50 text-sm"
          >
            Reply All
          </div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white opacity-50 text-sm"
          >
            Forward
          </div>
          <div className="h-[1px] bg-[#808080] my-1"></div>
          <div 
            className="px-3 py-1 hover:bg-[#000080] hover:text-white text-center text-sm"
            onClick={() => setIsComposeMenuOpen(false)}
          >
            Close
          </div>
        </div>
      )}
      
     
      
      <div className="flex flex-1 overflow-hidden">
        {/* Folder Tree */}
        <div className="w-[200px] bg-white border border-[#808080] overflow-auto">
          {/* Microsoft Exchange root */}
          <div className="flex items-center justify-center p-1 border-b border-[#e0e0e0]">
            <span className="text-sm font-bold">Microsoft Exchange</span>
          </div>
          
          {/* Personal Folders */}
          <div>
            <div className="flex items-center p-1 border-b border-[#e0e0e0] bg-[#f0f0f0]">
              <div className="w-4 flex justify-center">
                <Image
                  src="/hackbook-W95/custom/minus.png"
                  alt="Expand"
                  width={9}
                  height={9}
                  className="h-2 w-2"
                />
              </div>
              <Image
                src="/hackbook-W95/file.png"
                alt="Personal Folders"
                width={24}
                height={24}
                className="h-6 w-6 mr-1"
              />
              <span className="text-sm font-bold">Personal Folders</span>
            </div>
            
            {/* Folder items */}
            <div>
              {[
                { name: "Deleted Items", icon: "deleted-folder", selected: selected === "Deleted Items", clickable: true },
                { name: "Inbox", icon: "inbox-folder", selected: selected === "Inbox", clickable: true },
                { name: "Outbox", icon: "outbox-folder", selected: selected === "Outbox", clickable: true },
                { name: "Sent Items", icon: "sent-folder", selected: selected === "Sent Items", clickable: true },
                { name: "Drafts", icon: "drafts-folder", selected: selected === "Drafts", clickable: true }
              ].map((folder) => (
                <div 
                  key={folder.name}
                  className={clsx("flex items-center p-1 border-b border-[#e0e0e0]", {
                    "bg-[#0000aa] text-white": folder.selected,
                    "cursor-pointer hover:bg-[#e0e0e0]": folder.clickable
                  })}
                  onClick={() => folder.clickable ? setSelected(folder.name) : null}
                >
                  <div className="w-4"></div>
                  <Image
                    src={`/hackbook-W95/file.png`}
                    alt={folder.name}
                    width={24}
                    height={24}
                    className="h-6 w-6 mr-1"
                  />
                  <span className="text-sm">{folder.name}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Other Folders */}
          <div>
            <div className="flex items-center p-1 border-b border-[#e0e0e0] bg-[#f0f0f0]">
              <div className="w-4 flex justify-center">
                <Image
                  src="/hackbook-W95/custom/minus.png"
                  alt="Expand"
                  width={9}
                  height={9}
                  className="h-2 w-2"
                />
              </div>
              <Image
                src="/hackbook-W95/file.png"
                alt="Other Folders"
                width={24}
                height={24}
                className="h-6 w-6 mr-1"
              />
              <span className="text-sm font-bold">Other Folders</span>
            </div>
            
            {/* Folder items */}
            <div>
              {["Spam", "Archive", "Work", "Personal"].map((folder) => (
                <div 
                  key={folder}
                  className="flex items-center p-1 border-b border-[#e0e0e0] hover:bg-[#e0e0e0] cursor-pointer"
                  onClick={() => setSelected(folder)}
                >
                  <div className="w-4"></div>
                  <Image
                    src="/hackbook-W95/file.png"
                    alt={folder}
                    width={24}
                    height={24}
                    className="h-6 w-6 mr-1"
                  />
                  <span className="text-sm">{folder}</span>
                </div>
              ))}
            </div>


          </div>
        </div>
        {/* Mail Content Area */}
        <div className="flex-1 bg-white border-l border-[#808080] overflow-auto">
          {/* Status Bar */}
          <div className="w-full bg-[#c0c0c0] border-t border-[#808080] p-1 text-sm">
            {getStatusMessage()}
          </div>
          
          {/* Mail List */}
          <div className="flex-1 overflow-auto">
            {selected === "Inbox" && (
              <InboxMails 
                openLink={openLink} 
                setUnreadCount={setUnreadCount} 
              />
            )}
            {selected === "Outbox" && (
              <OutboxMails 
                openLink={openLink} 
              />
            )}
            {(selected === "Drafts" || selected === "Sent Items" || selected === "Deleted Items") && (
              <div className="p-4 text-sm text-center text-gray-600">
                <div className="mb-4">
                  <div className="text-lg font-bold mb-2">{selected}</div>
                  <div>This folder is currently empty.</div>
                  {selected === "Drafts" && (
                    <div className="mt-2 text-xs">
                      Draft messages will appear here when you save emails without sending them.
                    </div>
                  )}
                  {selected === "Sent Items" && (
                    <div className="mt-2 text-xs">
                      Copies of sent messages will appear here after successful delivery.
                    </div>
                  )}
                  {selected === "Deleted Items" && (
                    <div className="mt-2 text-xs">
                      Deleted messages will be moved here before permanent removal.
                    </div>
                  )}
                </div>
              </div>
            )}
            {(selected === "Spam" || selected === "Archive" || selected === "Work" || selected === "Personal") && (
              <div className="p-4 text-sm text-center text-gray-600">
                <div className="mb-4">
                  <div className="text-lg font-bold mb-2">{selected} Folder</div>
                  <div>This folder is currently empty.</div>
                  <div className="mt-2 text-xs">
                    Messages organized in this category will appear here.
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Compose Window */}
          {isComposeOpen && (
            <div className="fixed inset-16 z-10 flex flex-col bg-white border-2 border-[#808080]">
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center">
                <div className="flex-1 text-sm font-bold">New Message - Microsoft Exchange</div>
                <button 
                  className="text-white h-[14px] flex items-center justify-center text-sm font-bold leading-none"
                  onClick={() => setIsComposeOpen(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 flex flex-col p-2 overflow-auto">
                <div className="mb-2">
                  <label className="block text-sm mb-1">To:</label>
                  <input 
                    type="text" 
                    value={emailDraft.to} 
                    onChange={(e) => handleEmailDraftChange('to', e.target.value)} 
                    className="w-full border border-[#808080] p-1 rounded"
                  />
                </div>
                
                <div className="mb-2">
                  <label className="block text-sm mb-1">CC:</label>
                  <input 
                    type="text" 
                    value={emailDraft.cc} 
                    onChange={(e) => handleEmailDraftChange('cc', e.target.value)} 
                    className="w-full border border-[#808080] p-1 rounded"
                  />
                </div>
                
                <div className="mb-2">
                  <label className="block text-sm mb-1">BCC:</label>
                  <input 
                    type="text" 
                    value={emailDraft.bcc} 
                    onChange={(e) => handleEmailDraftChange('bcc', e.target.value)} 
                    className="w-full border border-[#808080] p-1 rounded"
                  />
                </div>
                
                <div className="mb-2">
                  <label className="block text-sm mb-1">Subject:</label>
                  <input 
                    type="text" 
                    value={emailDraft.subject} 
                    onChange={(e) => handleEmailDraftChange('subject', e.target.value)} 
                    className="w-full border border-[#808080] p-1 rounded"
                  />
                </div>
                <div className="mb-2 flex-1">
                  <label className="block text-sm mb-1">Body:</label>
                  <textarea 
                    value={emailDraft.body} 
                    onChange={(e) => handleEmailDraftChange('body', e.target.value)} 
                    className="w-full h-32 border border-[#808080] p-1 rounded"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm mb-1">Attachments:</label>
                  <div className="flex flex-wrap gap-2">
                    {emailDraft.attachments.map((attachment) => (
                      <div 
                        key={attachment} 
                        className="flex items-center bg-[#f0f0f0] border border-[#808080] px-2 py-1 rounded"
                      >
                        <span className="text-xs">{attachment}</span>
                        <button 
                          className="ml-2 text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveAttachment(attachment)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button 
                      className="bg-[#c0c0c0] border border-[#808080] px-2 py-1 rounded hover:bg-[#d0d0d0]"
                      onClick={handleBrowseAttachments}
                    >
                      Browse...
                    </button>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-2">
                  <button 
                    className="bg-[#000080] text-white px-4 py-1 rounded hover:bg-[#0000aa]"
                    onClick={handleSendEmail}
                  >
                    Send
                  </button>
                  <button 
                    className="bg-[#808080] text-white px-4 py-1 rounded hover:bg-[#a0a0a0]"
                    onClick={() => setIsComposeOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Address Book */}
          {isAddressBookOpen && (
            <div className="fixed inset-16 z-10 flex flex-col bg-white border-2 border-[#808080]">
              <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center">
                <div className="flex-1 text-sm font-bold">Address Book - Microsoft Exchange</div>
                <button 
                  className="text-white h-[14px] flex items-center justify-center text-sm font-bold leading-none"
                  onClick={() => setIsAddressBookOpen(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 flex flex-col p-2 overflow-auto">
                <div className="mb-2">
                  <label className="block text-sm mb-1">Search:</label>
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full border border-[#808080] p-1 rounded"
                  />
                </div>
                
                <div className="flex-1 overflow-auto">
                  {contacts.filter(contact => contact.name.toLowerCase().includes(searchTerm.toLowerCase())).map((contact) => (
                    <div 
                      key={contact.email} 
                      className={clsx("flex items-center p-1 border-b border-[#e0e0e0] cursor-pointer", {
                        "bg-[#c0c0c0]": selectedContacts.some(c => c.email === contact.email),
                        "hover:bg-[#e0e0e0]": !selectedContacts.some(c => c.email === contact.email)
                      })}
                      onClick={() => toggleContactSelection(contact)}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedContacts.some(c => c.email === contact.email)}
                        onChange={() => toggleContactSelection(contact)}
                        className="mr-2"
                      />
                      <span className="text-sm">{contact.name} ({contact.email})</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-2 mt-2">
                  <button 
                    className="bg-[#000080] text-white px-4 py-1 rounded hover:bg-[#0000aa]"
                    onClick={addSelectedContactsToEmail}
                  >
                    Add to To
                  </button>
                  <button 
                    className="bg-[#808080] text-white px-4 py-1 rounded hover:bg-[#a0a0a0]"
                    onClick={() => setIsAddressBookOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}  
          {/* Find Dialog */}
          {isFindDialogOpen && renderFindDialog()}
        </div>
      </div>
    </div>
  );
}
