"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  photo?: string;
  linkedContacts?: string[];
}

interface ContactsAppProps {
  onClose: () => void;
  onOpenPhone?: (phoneNumber?: string) => void;
  time?: Date;
}
const ContactsApp: React.FC<ContactsAppProps> = ({ onClose, onOpenPhone }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [view, setView] = useState<"list" | "details" | "link" | "unified">("list");
  const [linkingContact, setLinkingContact] = useState<Contact | null>(null);

  // Demo contacts data
  const contacts: Contact[] = useMemo(() => [
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
    },
    {
      id: "6",
      name: "John Smith",
      phone: "(808) 555-1234",
      linkedContacts: ["7"]
    },
    {
      id: "7",
      name: "John Doe",
      phone: "(808) 968-1234", 
      email: "john.smith@me.com",
      company: "MobileMe",
      linkedContacts: ["6"]
    }
  ], []);

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, contacts]);

  // Get linked contacts for unified view
  const getLinkedContacts = (contact: Contact) => {
    if (!contact.linkedContacts) return [contact];
    const linked = contact.linkedContacts.map(id => 
      contacts.find(c => c.id === id)
    ).filter(Boolean) as Contact[];
    return [contact, ...linked];
  };

  // status bar removed

  const renderSearchBar = () => (
    <div className="px-4 py-2 bg-white border-b border-gray-200">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">×</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );

  const renderContactList = () => (
    <div className="flex-1 bg-white">
      {filteredContacts.map((contact) => (
        <div
          key={contact.id}
          className="w-full px-4 py-3 flex items-center border-b border-gray-200"
        >
          <button
            onClick={() => {
              setSelectedContact(contact);
              setView("details");
            }}
            className="flex-1 flex items-center text-left"
          >
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3 text-gray-600 text-sm">
              {contact.photo ? (
                <Image src={contact.photo} alt={contact.name} width={40} height={40} className="rounded-full" />
              ) : (
                contact.name.split(' ').map(n => n[0]).join('')
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{contact.name}</div>
              {contact.company && (
                <div className="text-sm text-gray-500">{contact.company}</div>
              )}
            </div>
          </button>
          
          {contact.phone && (
            <button
              onClick={() => onOpenPhone?.(contact.phone)}
              className="ml-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-lg">📞</span>
            </button>
          )}
          
          <button
            onClick={() => {
              setSelectedContact(contact);
              setView("details");
            }}
            className="ml-2 text-gray-400 text-lg"
          >
            ›
          </button>
        </div>
      ))}
    </div>
  );

  const renderContactDetails = () => {
    if (!selectedContact) return null;

    const isLinked = selectedContact.linkedContacts && selectedContact.linkedContacts.length > 0;

    return (
      <div className="flex-1 bg-white">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setView("list")}
            className="text-blue-500 font-medium"
          >
            All Contacts
          </button>
          <h1 className="font-semibold text-gray-900">Info</h1>
          <button className="text-blue-500 font-medium">Edit</button>
        </div>

        {/* Contact Info */}
        <div className="p-4">
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mr-4 text-gray-600">
              {selectedContact.photo ? (
                <Image src={selectedContact.photo} alt={selectedContact.name} width={64} height={64} className="rounded-full" />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{selectedContact.name}</h2>
              {selectedContact.company && (
                <p className="text-gray-500">{selectedContact.company}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          {selectedContact.phone && (
            <div className="mb-4">
              <div className="bg-white border border-gray-300 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-blue-500 text-sm">iPhone</div>
                    <div className="text-gray-900 font-medium">{selectedContact.phone}</div>
                  </div>
                  <button
                    onClick={() => onOpenPhone?.(selectedContact.phone)}
                    className="ml-4 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-white text-lg">📞</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Email */}
          {selectedContact.email && (
            <div className="mb-4">
              <div className="bg-white border border-gray-300 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-blue-500 text-sm">home</div>
                    <div className="text-gray-900 font-medium">{selectedContact.email}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Share Contact */}
          <div className="mb-4">
            <button className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-blue-500 font-medium">
              Share Contact
            </button>
          </div>

          {/* Link New Contact */}
          <button
            onClick={() => {
              setLinkingContact(selectedContact);
              setView("link");
            }}
            className="w-full flex items-center justify-between py-3 border-b border-gray-200"
          >
            <span className="text-gray-900">Link New Contact...</span>
            <span className="text-gray-400 text-lg">›</span>
          </button>

          {/* Linked Contacts */}
          {isLinked && (
            <button
              onClick={() => setView("unified")}
              className="w-full flex items-center justify-between py-3"
            >
              <div className="flex items-center">
                <span className="text-gray-900">Linked Contacts</span>
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedContact.linkedContacts?.length || 0}
                </span>
              </div>
              <span className="text-gray-400 text-lg">›</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderLinkContact = () => {
    if (!linkingContact) return null;

    const availableContacts = contacts.filter(c => 
      c.id !== linkingContact.id && 
      !linkingContact.linkedContacts?.includes(c.id)
    );

    return (
      <div className="flex-1 bg-white">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-100">
          <button
            onClick={() => setView("details")}
            className="text-blue-500 font-medium"
          >
            All Contacts
          </button>
          <h1 className="font-semibold text-gray-900">Info</h1>
          <button className="text-blue-500 font-medium">Link</button>
        </div>

        {/* Instruction */}
        <div className="p-4 bg-gray-100">
          <p className="text-center text-gray-600 text-sm">
            Choose a card to link with {linkingContact.name}.
          </p>
        </div>

        {/* Available contacts */}
        <div className="flex-1">
          {availableContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => {
                // Link the contacts (in a real app, this would update the backend)
                console.log(`Linking ${linkingContact.name} with ${contact.name}`);
                setView("details");
              }}
              className="w-full px-4 py-3 flex items-center border-b border-gray-200 hover:bg-gray-50"
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3 text-gray-600 text-sm">
                {contact.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">{contact.name}</div>
                {contact.company && (
                  <div className="text-sm text-gray-500">{contact.company}</div>
                )}
                {contact.phone && (
                  <div className="text-sm text-gray-500">{contact.phone}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderUnifiedView = () => {
    if (!selectedContact) return null;

    const linkedContacts = getLinkedContacts(selectedContact);
    const allPhones = linkedContacts.flatMap(c => c.phone ? [{ contact: c, phone: c.phone }] : []);
    const allEmails = linkedContacts.flatMap(c => c.email ? [{ contact: c, email: c.email }] : []);

    return (
      <div className="flex-1 bg-white">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setView("details")}
            className="text-blue-500 font-medium"
          >
            All Contacts
          </button>
          <h1 className="font-semibold text-gray-900">Unified Info</h1>
          <button className="text-blue-500 font-medium">Edit</button>
        </div>

        {/* Unified Contact Info */}
        <div className="p-4">
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mr-4 text-gray-600">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{selectedContact.name}</h2>
            </div>
          </div>

          {/* All Phone Numbers */}
          {allPhones.map((item, index) => (
            <div key={index} className="mb-4">
              <div className="bg-white border border-gray-300 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-blue-500 text-sm">iPhone</div>
                    <div className="text-gray-900 font-medium">{item.phone}</div>
                  </div>
                  <button
                    onClick={() => onOpenPhone?.(item.phone)}
                    className="ml-4 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-white text-lg">📞</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* All Emails */}
          {allEmails.map((item, index) => (
            <div key={index} className="mb-4">
              <div className="bg-white border border-gray-300 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-blue-500 text-sm">home</div>
                    <div className="text-gray-900 font-medium">{item.email}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Share Contact */}
          <div className="mb-4">
            <button className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-blue-500 font-medium">
              Share Contact
            </button>
          </div>

          {/* Linked Contacts Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Linked Contacts</h3>
              <button
                onClick={() => setView("link")}
                className="text-blue-500 font-medium"
              >
                Edit
              </button>
            </div>
            
            {linkedContacts.slice(1).map((contact) => (
              <div key={contact.id} className="flex items-center py-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs">📱</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{contact.company || "MobileMe"}</div>
                  <div className="text-sm text-gray-500">{contact.name}</div>
                </div>
              </div>
            ))}
            
            <button
              onClick={() => {
                setLinkingContact(selectedContact);
                setView("link");
              }}
              className="w-full text-left py-2 text-blue-500"
            >
              Link New Contact...
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-gray-100 flex flex-col">
      
      {view === "list" && (
        <>
          {renderSearchBar()}
          {renderContactList()}
        </>
      )}
      
      {view === "details" && renderContactDetails()}
      {view === "link" && renderLinkContact()}
      {view === "unified" && renderUnifiedView()}

      {/* Bottom Tab Bar */}
      <div className="bg-gray-800 h-16 flex items-center justify-around">
        <button
          onClick={onClose}
          className="text-blue-400 text-sm font-medium flex flex-col items-center"
        >
          <span className="text-lg mb-1">⌂</span>
          <span className="text-xs">Home</span>
        </button>
        
        <button
          onClick={() => onOpenPhone?.()}
          className="text-green-400 text-sm font-medium flex flex-col items-center"
        >
          <span className="text-lg mb-1">📞</span>
          <span className="text-xs">Phone</span>
        </button>
        
        <div className="text-white text-sm font-medium flex flex-col items-center">
          <span className="text-lg mb-1">👤</span>
          <span className="text-xs">Contacts</span>
        </div>
      </div>
    </div>
  );
};

export default ContactsApp;
