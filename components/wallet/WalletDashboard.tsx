"use client";

import React, { useEffect, useState } from "react";
import { getTeamTransactions, getTeamBalance, transferBitcoin } from "@/app/actions/wallet";

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'tournament_fee' | 'prize' | 'attack' | 'defense';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  attackerId?: { username: string };
  defenderId?: { username: string };
  transactionHash?: string;
}

interface WalletBalance {
  bitcoinBalance: number;
  totalEarned: number;
  totalSpent: number;
}

export function WalletDashboard() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSendForm, setShowSendForm] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      // TODO: Get teamId from authentication context
      const teamId = 'placeholder-team-id';

      const [balanceResult, transactionsResult] = await Promise.all([
        getTeamBalance(teamId),
        getTeamTransactions(teamId)
      ]);

      if (balanceResult.success) {
        setBalance({ bitcoinBalance: balanceResult.balance, totalEarned: 0, totalSpent: 0 });
      } else {
        setError(balanceResult.error || 'Failed to load balance');
      }

      if (transactionsResult.success && transactionsResult.transactions) {
        setTransactions(transactionsResult.transactions as unknown as Transaction[]);
      }
    } catch (err) {
      console.error('Failed to load wallet data:', err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBitcoin = async (formData: FormData) => {
    try {
      const toTeamId = formData.get('toAddress') as string;
      const amount = parseFloat(formData.get('amount') as string);

      if (!toTeamId || !amount || amount <= 0) {
        alert('Please provide valid team ID and amount');
        return;
      }

      // TODO: Get fromTeamId from authentication context
      const fromTeamId = 'placeholder-from-team-id';
      const result = await transferBitcoin(fromTeamId, toTeamId, amount, 'User transfer');

      if (result.success) {
        alert('Bitcoin sent successfully!');
        setShowSendForm(false);
        loadWalletData(); // Refresh data
      } else {
        alert(result.error || 'Failed to send bitcoin');
      }
    } catch (err) {
      console.error('Failed to send bitcoin:', err);
      alert('Failed to send bitcoin');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadWalletData}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <button
          onClick={() => setShowSendForm(true)}
          className="px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-medium"
        >
          Send Bitcoin
        </button>
      </div>

      {/* Balance Cards */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Current Balance</p>
                <p className="text-2xl font-bold">{balance.bitcoinBalance.toFixed(8)} BTC</p>
              </div>
              <div className="text-4xl">₿</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Total Earned</p>
                <p className="text-2xl font-bold">{balance.totalEarned.toFixed(8)} BTC</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">Total Spent</p>
                <p className="text-2xl font-bold">{balance.totalSpent.toFixed(8)} BTC</p>
              </div>
              <div className="text-4xl">📉</div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p>No transactions yet</p>
              <p className="text-sm mt-1">Your transaction history will appear here</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      ['deposit', 'prize', 'transfer'].includes(transaction.type) ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {['deposit', 'prize', 'transfer'].includes(transaction.type) ? '📈' : '📉'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </p>
                      {transaction.transactionHash && (
                        <p className="text-xs text-blue-600 font-mono">
                          TX: {transaction.transactionHash.substring(0, 20)}...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-semibold ${
                      ['deposit', 'prize', 'transfer'].includes(transaction.type) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {['deposit', 'prize', 'transfer'].includes(transaction.type) ? '+' : '-'}{Math.abs(transaction.amount).toFixed(8)} BTC
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Send Bitcoin Modal */}
      {showSendForm && (
        <SendBitcoinModal
          onClose={() => setShowSendForm(false)}
          onSubmit={handleSendBitcoin}
          maxAmount={balance?.bitcoinBalance || 0}
        />
      )}
    </div>
  );
}

interface SendBitcoinModalProps {
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  maxAmount: number;
}

function SendBitcoinModal({ onClose, onSubmit, maxAmount }: SendBitcoinModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-6">Send Bitcoin</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Team ID
            </label>
            <input
              type="text"
              name="toAddress"
              required
              placeholder="Enter recipient team ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (BTC)
            </label>
            <input
              type="number"
              name="amount"
              required
              min="0.00000001"
              max={maxAmount}
              step="0.00000001"
              placeholder="0.00000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: {maxAmount.toFixed(8)} BTC
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Bitcoin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
