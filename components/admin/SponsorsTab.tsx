"use client";

import { useState } from "react";
import { AdminSponsorContact } from "./types";

interface SponsorsTabProps {
  sponsors: AdminSponsorContact[];
  loading: boolean;
  onUpdateStatus: (contactId: string, status: 'new' | 'contacted' | 'in-progress' | 'closed', notes?: string) => Promise<void>;
  onDelete: (contactId: string) => Promise<void>;
}

export default function SponsorsTab({ sponsors, loading, onUpdateStatus, onDelete }: SponsorsTabProps) {
  const [selectedContact, setSelectedContact] = useState<AdminSponsorContact | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<'new' | 'contacted' | 'in-progress' | 'closed'>('new');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'in-progress' | 'closed'>('all');

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'contacted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'closed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedContact) return;
    
    try {
      await onUpdateStatus(selectedContact._id, newStatus, notes);
      setShowStatusModal(false);
      setSelectedContact(null);
      setNotes('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (contactId: string) => {
    if (window.confirm('Are you sure you want to delete this sponsor contact? This action cannot be undone.')) {
      try {
        await onDelete(contactId);
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
  };

  // Filter sponsors based on search term and status
  const filteredSponsors = sponsors.filter(sponsor => {
    const matchesSearch = !searchTerm || 
      sponsor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sponsor.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-cyber-primary animate-pulse">Loading sponsor contacts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="text-green-400 text-sm font-medium">New Contacts</div>
          <div className="text-2xl font-bold text-white">
            {sponsors.filter(s => s.status === 'new').length}
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="text-blue-400 text-sm font-medium">Contacted</div>
          <div className="text-2xl font-bold text-white">
            {sponsors.filter(s => s.status === 'contacted').length}
          </div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="text-yellow-400 text-sm font-medium">In Progress</div>
          <div className="text-2xl font-bold text-white">
            {sponsors.filter(s => s.status === 'in-progress').length}
          </div>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
          <div className="text-gray-400 text-sm font-medium">Total Contacts</div>
          <div className="text-2xl font-bold text-white">{sponsors.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by company name, contact name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/50 border border-cyber-primary/30 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-cyber-primary/70 focus:outline-none"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'new' | 'contacted' | 'in-progress' | 'closed')}
            className="bg-black/50 border border-cyber-primary/30 rounded-lg px-4 py-2 text-white focus:border-cyber-primary/70 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Contacts list */}
      <div className="space-y-4">
        {filteredSponsors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">
              {sponsors.length === 0 ? 'No sponsor contacts yet' : 'No contacts match your filters'}
            </div>
            <div className="text-gray-500 text-sm">
              {sponsors.length === 0 ? 'Contacts will appear here when sponsors submit the form' : 'Try adjusting your search or filters'}
            </div>
          </div>
        ) : (
          filteredSponsors.map((contact) => (
            <div key={contact._id} className="bg-black/50 border border-cyber-primary/30 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{contact.companyName}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(contact.status)}`}>
                      {contact.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-gray-300 mb-1">
                    <strong>Contact:</strong> {contact.contactName}
                  </div>
                  <div className="text-gray-300 mb-1">
                    <strong>Email:</strong> {contact.email}
                  </div>
                  {contact.phone && (
                    <div className="text-gray-300 mb-1">
                      <strong>Phone:</strong> {contact.phone}
                    </div>
                  )}
                  <div className="text-gray-400 text-sm">
                    <strong>Submitted:</strong> {new Date(contact.submittedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedContact(contact);
                      setNewStatus(contact.status);
                      setNotes(contact.notes || '');
                      setShowStatusModal(true);
                    }}
                    className="px-3 py-1 bg-cyber-primary/20 hover:bg-cyber-primary/30 border border-cyber-primary/30 rounded text-cyber-primary text-sm transition-colors"
                  >
                    Update Status
                  </button>
                  <button
                    onClick={() => handleDelete(contact._id)}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-400 text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <div className="text-gray-300 text-sm whitespace-pre-wrap">{contact.message}</div>
              </div>
              
              {contact.notes && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="text-blue-400 text-sm font-medium mb-1">Admin Notes:</div>
                  <div className="text-gray-300 text-sm whitespace-pre-wrap">{contact.notes}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedContact && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-black/90 border border-cyber-primary/60 rounded-lg overflow-hidden">
            <div className="bg-cyber-primary/20 px-4 py-3 border-b border-cyber-primary/30">
              <h3 className="font-bold text-white">Update Contact Status</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'new' | 'contacted' | 'in-progress' | 'closed')}
                  className="w-full bg-black/50 border border-cyber-primary/30 rounded-lg px-3 py-2 text-white focus:border-cyber-primary/70 focus:outline-none"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="in-progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-black/50 border border-cyber-primary/30 rounded-lg px-3 py-2 text-white focus:border-cyber-primary/70 focus:outline-none resize-none"
                  placeholder="Add any notes about this contact..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedContact(null);
                    setNotes('');
                  }}
                  className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/30 rounded text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 bg-cyber-primary/20 hover:bg-cyber-primary/30 border border-cyber-primary/30 rounded text-cyber-primary transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
