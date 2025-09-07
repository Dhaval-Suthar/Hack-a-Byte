"use client";
import React, { useState } from "react";

interface Device {
  _id: string;
  name: string;
  status: string;
  deviceType?: string;
  playspace?: {
    _id: string;
    name: string;
  } | null;
}

interface Team {
  _id: string;
  name: string;
  wallet?: {
    walletAddress: string;
  };
}

interface MessageTemplate {
  id: string;
  type: 'email' | 'sms';
  subject?: string;
  content: string;
  isScam: boolean;
  rewardAmount?: number;
  lossAmount?: number;
}

interface MessagingSectionProps {
  devs: Device[];
  teams: Team[];
  q: string;
  setQ: (query: string) => void;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: '1',
    type: 'email',
    subject: '🎉 Bitcoin Reward Available!',
    content: 'Congratulations! You have earned a 50 BTC bonus. To receive it, reply to this email with your wallet address and private key. Rewards are processed automatically upon verification.',
    isScam: false,
    rewardAmount: 50
  },
  {
    id: '2',
    type: 'email',
    subject: '⚠️ Account Security Alert',
    content: 'We detected suspicious activity on your account. Click here to secure your account or lose access permanently!',
    isScam: true,
    lossAmount: 80
  },
  {
    id: '3',
    type: 'sms',
    content: 'BTC Alert: 25 BTC waiting. Reply with your wallet address and private key to receive.',
    isScam: false,
    rewardAmount: 25
  },
  {
    id: '4',
    type: 'sms',
    content: 'URGENT: Your account is frozen. Send wallet key to unlock: fake-bank.scam',
    isScam: true,
    lossAmount: 60
  }
];

export default function MessagingSection({ devs, teams, q, setQ }: MessagingSectionProps) {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<'email' | 'sms'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customSubject, setCustomSubject] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [isScam, setIsScam] = useState(false);
  const [rewardAmount, setRewardAmount] = useState('');
  const [lossAmount, setLossAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const filteredDevices = devs.filter(dev =>
    dev.name.toLowerCase().includes(q.toLowerCase()) ||
    dev.deviceType?.toLowerCase().includes(q.toLowerCase())
  );

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(q.toLowerCase())
  );

  const handleDeviceToggle = (deviceId: string) => {
    setSelectedDevices(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessageType(template.type);
      setCustomSubject(template.subject || '');
      setCustomContent(template.content);
      setIsScam(template.isScam);
      setRewardAmount(template.rewardAmount?.toString() || '');
      setLossAmount(template.lossAmount?.toString() || '');
    }
  };

  const handleSendMessage = async () => {
    if (selectedDevices.length === 0 && selectedTeams.length === 0) {
      setSendResult('Please select at least one device or team');
      return;
    }

    if (!customContent.trim()) {
      setSendResult('Please enter message content');
      return;
    }

    if (messageType === 'email' && !customSubject.trim()) {
      setSendResult('Please enter email subject');
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const messageData = {
        type: messageType,
        subject: customSubject,
        content: customContent,
        isScam,
        rewardAmount: rewardAmount ? parseFloat(rewardAmount) : 0,
        lossAmount: lossAmount ? parseFloat(lossAmount) : 0,
        targetDevices: selectedDevices,
        targetTeams: selectedTeams
      };

      const response = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-auth-key')}`
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();

      if (result.success) {
        setSendResult(`✅ Message sent successfully to ${result.recipientCount} recipients`);
        // Reset form
        setSelectedDevices([]);
        setSelectedTeams([]);
        setSelectedTemplate('');
        setCustomSubject('');
        setCustomContent('');
        setIsScam(false);
        setRewardAmount('');
        setLossAmount('');
      } else {
        setSendResult(`❌ Failed to send message: ${result.error}`);
      }
    } catch (error) {
      setSendResult(`❌ Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Messaging Center</h2>
        <div className="text-sm text-gray-400">
          Send targeted emails and SMS to specific devices
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search devices and teams..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
          />
          <div className="text-sm text-gray-400">
            {filteredDevices.length} devices, {filteredTeams.length} teams
          </div>
        </div>
      </div>

      {/* Recipients Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Selection */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Select Devices</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredDevices.map(device => (
              <label key={device._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedDevices.includes(device._id)}
                  onChange={() => handleDeviceToggle(device._id)}
                  className="rounded"
                />
                <span className="text-sm">
                  {device.name} ({device.deviceType}) - {device.status}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {selectedDevices.length} device(s) selected
          </div>
        </div>

        {/* Team Selection */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Select Teams</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredTeams.map(team => (
              <label key={team._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(team._id)}
                  onChange={() => handleTeamToggle(team._id)}
                  className="rounded"
                />
                <span className="text-sm">{team.name}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {selectedTeams.length} team(s) selected
          </div>
        </div>
      </div>

      {/* Message Templates */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Message Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MESSAGE_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className={`p-3 rounded border text-left ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{template.type.toUpperCase()}</span>
                {template.isScam ? (
                  <span className="text-xs bg-red-500 px-2 py-1 rounded">SCAM</span>
                ) : (
                  <span className="text-xs bg-green-500 px-2 py-1 rounded">LEGIT</span>
                )}
              </div>
              {template.subject && (
                <div className="text-sm font-medium mb-1">{template.subject}</div>
              )}
              <div className="text-xs text-gray-400 line-clamp-2">{template.content}</div>
              {(template.rewardAmount || template.lossAmount) && (
                <div className="text-xs mt-1">
                  {template.rewardAmount && `💰 +${template.rewardAmount} BTC`}
                  {template.lossAmount && `⚠️ -${template.lossAmount} BTC`}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Message */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Custom Message</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="messageType"
                value="email"
                checked={messageType === 'email'}
                onChange={(e) => setMessageType(e.target.value as 'email')}
              />
              <span>Email</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="messageType"
                value="sms"
                checked={messageType === 'sms'}
                onChange={(e) => setMessageType(e.target.value as 'sms')}
              />
              <span>SMS</span>
            </label>
          </div>

          {messageType === 'email' && (
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Email subject"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white h-32 resize-none"
              placeholder="Message content"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isScam}
                onChange={(e) => setIsScam(e.target.checked)}
              />
              <span className="text-sm">Mark as Scam</span>
            </label>

            <div>
              <label className="block text-xs font-medium mb-1">Reward BTC</label>
              <input
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Loss BTC</label>
              <input
                type="number"
                value={lossAmount}
                onChange={(e) => setLossAmount(e.target.value)}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Send Button and Results */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleSendMessage}
          disabled={sending || (selectedDevices.length === 0 && selectedTeams.length === 0)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium"
        >
          {sending ? 'Sending...' : 'Send Message'}
        </button>

        {sendResult && (
          <div className={`text-sm ${sendResult.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
            {sendResult}
          </div>
        )}
      </div>
    </div>
  );
}
