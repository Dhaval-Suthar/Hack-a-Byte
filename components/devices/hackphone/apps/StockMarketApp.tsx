"use client";

import React, { useState, useEffect } from "react";
import { getPlayspaceId } from "@/lib/playspace-utils";
import { logger } from '@/lib/logger';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high24h?: number;
  low24h?: number;
}

interface Portfolio {
  symbol: string;
  shares: number;
  avgPrice: number;
}

interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: Date;
}

interface MarketNews {
  id: string;
  headline: string;
  summary: string;
  timestamp: Date;
  relevantSymbols: string[];
}

const StockMarketApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"market" | "portfolio" | "trade" | "watchlist" | "news" | "alerts">("market");
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [tradeAmount, setTradeAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [marketNews, setMarketNews] = useState<MarketNews[]>([]);
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'volume'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [marketStats, setMarketStats] = useState({
    totalVolume: 0,
    activeStocks: 0,
    avgChange: 0,
    sentiment: 0,
    trendingStocks: [] as string[],
    marketSentiment: 'neutral' as 'bullish' | 'bearish' | 'neutral'
  });

  // Check localStorage for selected role on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const selectedRole = localStorage.getItem('selectedRole');
      setUserRole(selectedRole);
      
      // Load watchlist from localStorage
      const savedWatchlist = localStorage.getItem('stockWatchlist');
      if (savedWatchlist) {
        setWatchlist(JSON.parse(savedWatchlist));
      }

      // Load price alerts from localStorage
      const savedAlerts = localStorage.getItem('priceAlerts');
      if (savedAlerts) {
        setPriceAlerts(JSON.parse(savedAlerts));
      }

      // Initialize market news
      setMarketNews([
        {
          id: '1',
          headline: 'Bitcoin Reaches New All-Time High',
          summary: 'Bitcoin surges past $70,000 as institutional adoption continues to grow.',
          timestamp: new Date(),
          relevantSymbols: ['BTC']
        },
        {
          id: '2',
          headline: 'Tech Stocks Rally on AI Optimism',
          summary: 'NVIDIA, Microsoft, and Apple see gains as AI investments show promise.',
          timestamp: new Date(Date.now() - 3600000),
          relevantSymbols: ['NVDA', 'MSFT', 'AAPL']
        },
        {
          id: '3',
          headline: 'Indian Markets Show Strong Performance',
          summary: 'Reliance and TCS lead the charge in a bullish session for Indian stocks.',
          timestamp: new Date(Date.now() - 7200000),
          relevantSymbols: ['RELIANCE', 'TCS']
        }
      ]);
    }
  }, []);

  const [stocks, setStocks] = useState<StockData[]>([
    // Indian Stocks (converted to Bitcoin prices - scaled up for better readability)
    { symbol: "RELIANCE", name: "Reliance Industries", price: 34.4, change: 0.51, changePercent: 1.51, volume: 2850000, high24h: 35.2, low24h: 33.8 },
    { symbol: "TCS", name: "Tata Consultancy Services", price: 49.7, change: -0.31, changePercent: -0.61, volume: 1240000, high24h: 50.3, low24h: 48.9 },
    { symbol: "INFY", name: "Infosys Limited", price: 21.6, change: 0.23, changePercent: 1.06, volume: 3920000, high24h: 22.1, low24h: 21.2 },
    { symbol: "HDFCBANK", name: "HDFC Bank", price: 19.9, change: -0.15, changePercent: -0.73, volume: 5670000, high24h: 20.5, low24h: 19.5 },
    { symbol: "ADANIENT", name: "Adani Enterprises", price: 39.2, change: 0.95, changePercent: 2.48, volume: 4320000, high24h: 40.1, low24h: 38.5 },
    
    // International Stocks (converted to Bitcoin prices - scaled up)
    { symbol: "AAPL", name: "Apple Inc.", price: 4.39, change: 0.057, changePercent: 1.31, volume: 89500000, high24h: 4.47, low24h: 4.32 },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 3.31, change: -0.042, changePercent: -1.24, volume: 34200000, high24h: 3.39, low24h: 3.25 },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 9.87, change: 0.12, changePercent: 1.24, volume: 52100000, high24h: 10.01, low24h: 9.73 },
    { symbol: "TSLA", name: "Tesla Inc.", price: 5.55, change: -0.098, changePercent: -3.40, volume: 78900000, high24h: 5.73, low24h: 5.47 },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 10.8, change: 0.29, changePercent: 2.73, volume: 67800000, high24h: 10.95, low24h: 10.65 },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 4.14, change: 0.073, changePercent: 1.80, volume: 45600000, high24h: 4.21, low24h: 4.08 },
    
    // Cryptocurrencies (scaled appropriately)
    { symbol: "BTC", name: "Bitcoin", price: 1000.0, change: 28.5, changePercent: 2.93, volume: 21000000, high24h: 1034.1, low24h: 967.8 },
    { symbol: "ETH", name: "Ethereum", price: 62.1, change: -1.05, changePercent: -1.66, volume: 120000000, high24h: 64.1, low24h: 61.2 },
    { symbol: "BNB", name: "Binance Coin", price: 7.24, change: 0.20, changePercent: 2.88, volume: 890000000, high24h: 7.38, low24h: 7.01 },
    { symbol: "ADA", name: "Cardano", price: 0.121, change: 0.007, changePercent: 6.12, volume: 45000000000, high24h: 0.125, low24h: 0.115 },
    { symbol: "SOL", name: "Solana", price: 2.29, change: 0.10, changePercent: 4.58, volume: 2100000000, high24h: 2.37, low24h: 2.21 },
    { symbol: "DOT", name: "Polkadot", price: 1.73, change: -0.053, changePercent: -3.00, volume: 1500000000, high24h: 1.79, low24h: 1.68 },
    { symbol: "MATIC", name: "Polygon", price: 0.202, change: 0.012, changePercent: 6.10, volume: 8900000000, high24h: 0.208, low24h: 0.195 },
    { symbol: "DOGE", name: "Dogecoin", price: 0.185, change: 0.046, changePercent: 2.56, volume: 67000000000, high24h: 0.191, low24h: 0.179 },
  ]);

  // Initialize price history and market stats
  useEffect(() => {
    // Generate initial price history for all stocks
    const initialHistory: Record<string, number[]> = {};
    stocks.forEach(stock => {
      initialHistory[stock.symbol] = Array.from({ length: 20 }, () => 
        stock.price * (0.95 + Math.random() * 0.1)
      );
    });
    setPriceHistory(initialHistory);

    // Calculate market stats
    const totalVolume = stocks.reduce((sum, stock) => sum + Math.abs(stock.change), 0);
    const activeStocks = stocks.length;
    const avgChange = stocks.reduce((sum, stock) => sum + stock.changePercent, 0) / stocks.length;
    const sentiment = avgChange;
    const trendingStocks = stocks
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 3)
      .map(stock => stock.symbol);
    
    setMarketStats({
      totalVolume,
      activeStocks,
      avgChange,
      sentiment,
      trendingStocks,
      marketSentiment: totalVolume > 0.1 ? 'bullish' : totalVolume < -0.1 ? 'bearish' : 'neutral'
    });
  }, [stocks]);

  // Fetch team bitcoin balance and portfolio
  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const playspaceId = getPlayspaceId();
      const response = await fetch('/api/team', {
        headers: {
          'x-playspace-id': playspaceId || '',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.bitcoinBalance);
        setPortfolio(data.stockPortfolio || []);
      } else {
        setError(data.error || 'Failed to fetch team data');
      }
    } catch (err) {
      logger.error('Error fetching team data:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
      setError('Failed to connect to team service');
    } finally {
      setLoading(false);
    }
  };

  // Update team bitcoin balance
  const updateTeamBalance = async (amount: number, operation: 'add' | 'subtract') => {
    try {
      const playspaceId = getPlayspaceId();
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-playspace-id': playspaceId || '',
        },
        body: JSON.stringify({ amount, operation }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.bitcoinBalance);
        return true;
      } else {
        setError(data.error || 'Failed to update balance');
        return false;
      }
    } catch (err) {
      logger.error('Error updating team balance:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
      setError('Failed to connect to team service');
      return false;
    }
  };

  // Update team portfolio
  const updateTeamPortfolio = async (newPortfolio: Portfolio[]) => {
    try {
      const playspaceId = getPlayspaceId();
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-playspace-id': playspaceId || '',
        },
        body: JSON.stringify({ 
          operation: 'updatePortfolio',
          portfolioUpdate: newPortfolio 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPortfolio(data.stockPortfolio);
        return true;
      } else {
        setError(data.error || 'Failed to update portfolio');
        return false;
      }
    } catch (err) {
      logger.error('Error updating team portfolio:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
      setError('Failed to connect to team service');
      return false;
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  // Check price alerts
  useEffect(() => {
    priceAlerts.forEach(alert => {
      if (!alert.isActive) return;
      
      const stock = stocks.find(s => s.symbol === alert.symbol);
      if (!stock) return;
      
      const triggered = alert.condition === 'above' 
        ? stock.price >= alert.targetPrice
        : stock.price <= alert.targetPrice;
        
      if (triggered) {
        const message = `${alert.symbol} reached ${formatCurrency(alert.targetPrice)}`;
        setNotifications(prev => [...prev, message]);
        
        // Deactivate alert
        setPriceAlerts(prev => prev.map(a => 
          a.id === alert.id ? { ...a, isActive: false } : a
        ));
      }
    });
  }, [stocks, priceAlerts]);

  // Simulate real-time price updates with volume and high/low tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => 
        prevStocks.map(stock => {
          const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
          const newPrice = stock.price * (1 + changePercent / 100);
          const change = newPrice - stock.price;
          const volumeChange = (Math.random() - 0.5) * 0.2; // ±10% volume change
          const newVolume = Math.max(0, stock.volume! * (1 + volumeChange));
          
          return {
            ...stock,
            price: newPrice,
            change: change,
            changePercent: changePercent,
            volume: Math.floor(newVolume),
            high24h: Math.max(stock.high24h!, newPrice),
            low24h: Math.min(stock.low24h!, newPrice)
          };
        })
      );
      
      // Update price history
      setPriceHistory(prevHistory => {
        const newHistory = { ...prevHistory };
        stocks.forEach(stock => {
          if (!newHistory[stock.symbol]) {
            newHistory[stock.symbol] = [];
          }
          newHistory[stock.symbol] = [...newHistory[stock.symbol].slice(-19), stock.price];
        });
        return newHistory;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [stocks]);

  // Check price alerts
  useEffect(() => {
    priceAlerts.forEach(alert => {
      if (!alert.isActive) return;
      
      const stock = stocks.find(s => s.symbol === alert.symbol);
      if (!stock) return;
      
      const triggered = alert.condition === 'above' 
        ? stock.price >= alert.targetPrice
        : stock.price <= alert.targetPrice;
        
      if (triggered) {
        const message = `${alert.symbol} reached ${formatCurrency(alert.targetPrice)}`;
        setNotifications(prev => [...prev, message]);
        
        // Deactivate alert
        setPriceAlerts(prev => prev.map(a => 
          a.id === alert.id ? { ...a, isActive: false } : a
        ));
      }
    });
  }, [stocks, priceAlerts]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1) {
      return `₿${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else {
      return `₿${amount.toLocaleString('en-US', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      })}`;
    }
  };

  const formatPercent = (percent: number) => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Format volume with K, M, B suffixes
  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  // Show loading while checking role
  if (userRole === null) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-[#b4c6d7] to-[#8fa4b8] flex flex-col relative overflow-hidden font-[Helvetica,Arial,ui-sans-serif] items-center justify-center">
        <div className="text-center px-4">
          <div className="text-2xl mb-4">⏳</div>
          <h3 className="text-lg font-medium text-[#2c2c2c] mb-2">Loading...</h3>
          <p className="text-[#666] text-sm">Checking access permissions</p>
        </div>
      </div>
    );
  }

  // Check if user is professor
  if (userRole && userRole.toLowerCase() !== 'professor') {
    return (
      <div className="w-full h-full bg-gradient-to-b from-[#b4c6d7] to-[#8fa4b8] flex flex-col relative overflow-hidden font-[Helvetica,Arial,ui-sans-serif] items-center justify-center">
        <div className="text-center px-4">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-[#2c2c2c] mb-2">Access Restricted</h3>
          <p className="text-[#666] text-sm">Only the Professor can access the Stock Market</p>
          <p className="text-[#888] text-xs mt-2">Your role: {userRole}</p>
        </div>
      </div>
    );
  }

  

  const formatStockPrice = (stock: StockData, amount: number) => {
    // All stocks are now priced in Bitcoin
    return formatCurrency(amount);
  };

  // Watchlist management
  const toggleWatchlist = (symbol: string) => {
    const newWatchlist = watchlist.includes(symbol)
      ? watchlist.filter(s => s !== symbol)
      : [...watchlist, symbol];
    
    setWatchlist(newWatchlist);
    localStorage.setItem('stockWatchlist', JSON.stringify(newWatchlist));
  };

  // Search functionality with sorting
  const filteredStocks = stocks
    .filter(stock =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change':
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case 'volume':
          aValue = a.volume || 0;
          bValue = b.volume || 0;
          break;
        default:
          aValue = a.symbol;
          bValue = b.symbol;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue);
      }
      
      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  // Price alert management
  const addPriceAlert = (symbol: string, targetPrice: number, condition: 'above' | 'below') => {
    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      symbol,
      targetPrice,
      condition,
      isActive: true,
      createdAt: new Date()
    };
    
    const updatedAlerts = [...priceAlerts, newAlert];
    setPriceAlerts(updatedAlerts);
    localStorage.setItem('priceAlerts', JSON.stringify(updatedAlerts));
  };

  const removeAlert = (alertId: string) => {
    const updatedAlerts = priceAlerts.filter(alert => alert.id !== alertId);
    setPriceAlerts(updatedAlerts);
    localStorage.setItem('priceAlerts', JSON.stringify(updatedAlerts));
  };

  // Simple sparkline generator for price history
  const generateSparkline = (history: number[]) => {
    if (!history || history.length < 2) return '';
    
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min;
    
    if (range === 0) return '▬';
    
    const steps = 10;
    const stepSize = range / steps;
    let sparkline = '';
    
    for (let i = 0; i < steps; i++) {
      const threshold = min + (stepSize * i);
      const currentValue = history[Math.floor((history.length - 1) * (i / (steps - 1)))];
      
      if (currentValue >= threshold + stepSize * 0.75) sparkline += '█';
      else if (currentValue >= threshold + stepSize * 0.5) sparkline += '▇';
      else if (currentValue >= threshold + stepSize * 0.25) sparkline += '▅';
      else sparkline += '▂';
    }
    
    return sparkline;
  };

  const handleTrade = async (type: "buy" | "sell") => {
    if (!selectedStock || !tradeAmount) return;
    
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Show loading state
    setLoading(true);

    try {
      if (type === "buy") {
        const cost = amount * selectedStock.price;
        if (cost > balance) {
          alert("Insufficient team bitcoin balance!");
          return;
        }
        
        // Update team balance
        const balanceSuccess = await updateTeamBalance(cost, 'subtract');
        if (!balanceSuccess) return;
        
        // Update portfolio locally
        const newPortfolio = [...portfolio];
        const existing = newPortfolio.find(p => p.symbol === selectedStock.symbol);
        if (existing) {
          const totalShares = existing.shares + amount;
          const avgPrice = ((existing.shares * existing.avgPrice) + cost) / totalShares;
          const index = newPortfolio.findIndex(p => p.symbol === selectedStock.symbol);
          newPortfolio[index] = { ...existing, shares: totalShares, avgPrice };
        } else {
          newPortfolio.push({ symbol: selectedStock.symbol, shares: amount, avgPrice: selectedStock.price });
        }
        
        // Update portfolio in team database
        const portfolioSuccess = await updateTeamPortfolio(newPortfolio);
        if (!portfolioSuccess) {
          // Rollback balance change if portfolio update failed
          await updateTeamBalance(cost, 'add');
          return;
        }
        
        alert(`Successfully bought ${amount} shares of ${selectedStock.symbol}!`);
      } else {
        const holding = portfolio.find(p => p.symbol === selectedStock.symbol);
        if (!holding || holding.shares < amount) {
          alert("Insufficient shares!");
          return;
        }
        
        const proceeds = amount * selectedStock.price;
        
        // Update team balance
        const balanceSuccess = await updateTeamBalance(proceeds, 'add');
        if (!balanceSuccess) return;
        
        // Update portfolio locally
        const newPortfolio = portfolio.map(p => 
          p.symbol === selectedStock.symbol 
            ? { ...p, shares: p.shares - amount }
            : p
        ).filter(p => p.shares > 0);
        
        // Update portfolio in team database
        const portfolioSuccess = await updateTeamPortfolio(newPortfolio);
        if (!portfolioSuccess) {
          // Rollback balance change if portfolio update failed
          await updateTeamBalance(proceeds, 'subtract');
          return;
        }
        
        alert(`Successfully sold ${amount} shares of ${selectedStock.symbol}!`);
      }
      
      setTradeAmount("");
    } catch (err) {
      logger.error('Trading error:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
      setError('Trading failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPortfolioValue = () => {
    return portfolio.reduce((total, holding) => {
      const stock = stocks.find(s => s.symbol === holding.symbol);
      return total + (stock ? holding.shares * stock.price : 0);
    }, 0);
  };

  const renderMarketTab = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 bg-gradient-to-b from-[#e6e6e6] to-[#d4d4d4] border-b border-[#c0c0c0]">
        <h2 className="text-lg font-semibold text-[#2c2c2c]">Global Markets</h2>
        <p className="text-sm text-[#666] mt-1">All prices in Bitcoin (₿)</p>
        <p className="text-xs text-[#888] mt-1">Live prices updated every 3 seconds</p>
      </div>
      
      {/* Search and Controls */}
      <div className="px-4 py-3 bg-gradient-to-b from-[#f5f5f5] to-[#ebebeb] border-b border-[#d0d0d0] space-y-3">
        <input
          type="text"
          placeholder="Search stocks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-[#c0c0c0] rounded-lg bg-white text-[#2c2c2c] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        {/* Sort Controls */}
        <div className="flex gap-2 text-sm">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'symbol' | 'price' | 'change' | 'volume')}
            className="px-2 py-1 border border-[#c0c0c0] rounded bg-white text-[#2c2c2c] focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="symbol">Symbol</option>
            <option value="price">Price</option>
            <option value="change">Change</option>
            <option value="volume">Volume</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2 py-1 border border-[#c0c0c0] rounded bg-white text-[#2c2c2c] hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
          
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="px-2 py-1 border border-[#c0c0c0] rounded bg-white text-[#2c2c2c] hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {viewMode === 'list' ? '⊞' : '☰'}
          </button>
        </div>
      </div>
      
      {/* Market Stats */}
      <div className="px-4 py-3 bg-gradient-to-b from-[#f5f5f5] to-[#ebebeb] border-b border-[#d0d0d0]">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white p-2 rounded border border-[#c0c0c0]">
            <div className="text-xs text-[#666]">Volume</div>
            <div className="text-sm font-semibold text-[#2c2c2c]">{formatVolume(marketStats.totalVolume)}</div>
          </div>
          <div className="bg-white p-2 rounded border border-[#c0c0c0]">
            <div className="text-xs text-[#666]">Active</div>
            <div className="text-sm font-semibold text-[#2c2c2c]">{marketStats.activeStocks}</div>
          </div>
          <div className={`bg-white p-2 rounded border border-[#c0c0c0] ${
            marketStats.avgChange > 0 ? 'border-green-300' : 'border-red-300'
          }`}>
            <div className="text-xs text-[#666]">Avg Change</div>
            <div className={`text-sm font-semibold ${
              marketStats.avgChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercent(marketStats.avgChange)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <div className="text-sm font-medium text-yellow-800 mb-1">Price Alerts</div>
          {notifications.slice(-3).map((notification, index) => (
            <div key={index} className="text-xs text-yellow-700">
              {notification}
            </div>
          ))}
        </div>
      )}
      
      <div className="divide-y divide-[#c0c0c0]">
        {filteredStocks.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-[#2c2c2c] mb-2">No Results</h3>
            <p className="text-[#666] text-sm">Try a different search term</p>
          </div>
        ) : (
          filteredStocks.map((stock) => (
            <div key={stock.symbol} className="bg-gradient-to-b from-white to-[#f8f8f8]">
              <div
                role="button"
                aria-label={`Open trade panel for ${stock.symbol}`}
                tabIndex={0}
                onClick={() => {
                  setSelectedStock(stock);
                  setActiveTab("trade");
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedStock(stock);
                    setActiveTab('trade');
                  }
                }}
                className="w-full px-4 py-3 text-left hover:from-[#f0f8ff] hover:to-[#e6f3ff] active:from-[#e0f0ff] active:to-[#d0e8ff] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400/60"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#2c2c2c]">{stock.symbol}</div>
                        <div className="text-sm text-[#666]">{stock.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addPriceAlert(stock.symbol, stock.price, 'above');
                          }}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Alert
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(stock.symbol);
                          }}
                          className={`p-1 rounded-full transition-colors ${
                            watchlist.includes(stock.symbol)
                              ? 'text-yellow-500 hover:text-yellow-600'
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                        >
                          {watchlist.includes(stock.symbol) ? '★' : '☆'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-[#888] font-mono">
                        {generateSparkline(priceHistory[stock.symbol] || [])}
                      </div>
                      <div className="text-xs text-[#666]">
                        Vol: {formatVolume(stock.volume || 0)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-[#666]">
                      <span>H: {formatCurrency(stock.high24h || stock.price)}</span>
                      <span>L: {formatCurrency(stock.low24h || stock.price)}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-semibold text-[#2c2c2c]">
                      {formatCurrency(stock.price)}
                    </div>
                    <div className={`text-sm font-medium ${
                      stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(stock.change)} ({formatPercent(stock.changePercent)})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderPortfolioTab = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-4xl mb-4">⏳</div>
            <h3 className="text-lg font-medium text-[#2c2c2c] mb-2">Loading Team Data</h3>
            <p className="text-[#666] text-sm">Fetching bitcoin balance...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-[#2c2c2c] mb-2">Connection Error</h3>
            <p className="text-[#666] text-sm">{error}</p>
            <button 
              onClick={fetchTeamData}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 bg-gradient-to-b from-[#e6e6e6] to-[#d4d4d4] border-b border-[#c0c0c0]">
          <h2 className="text-lg font-semibold text-[#2c2c2c]">Team Portfolio</h2>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-[#666]">Team Bitcoin Balance:</span>
            <span className="font-bold text-[#2c2c2c]">
              ₿{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-[#666]">Portfolio Value:</span>
            <span className="font-semibold text-[#2c2c2c]">
              ₿{getPortfolioValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-[#666]">Total Value:</span>
            <span className="font-bold text-green-600">
              ₿{(balance + getPortfolioValue()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        {portfolio.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-[#2c2c2c] mb-2">No Holdings</h3>
              <p className="text-[#666] text-sm">Start investing team bitcoins to build your portfolio!</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#c0c0c0]">
            {portfolio.map((holding) => {
              const stock = stocks.find(s => s.symbol === holding.symbol);
              if (!stock) return null;
              
              const currentValue = holding.shares * stock.price;
              const totalCost = holding.shares * holding.avgPrice;
              const gainLoss = currentValue - totalCost;
              const gainLossPercent = (gainLoss / totalCost) * 100;
              
              return (
                <div key={holding.symbol} className="px-4 py-3 bg-gradient-to-b from-white to-[#f8f8f8]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-bold text-[#2c2c2c]">{stock.symbol}</div>
                      <div className="text-sm text-[#666]">
                        {holding.shares.toFixed(6)} shares @ ₿{holding.avgPrice.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#888] mt-1">
                        Current: {formatCurrency(stock.price)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#2c2c2c]">
                        ₿{currentValue.toFixed(2)}
                      </div>
                      <div className={`text-sm font-medium ${
                        gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₿{gainLoss.toFixed(2)} ({formatPercent(gainLossPercent)})
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Trade Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedStock(stock);
                        setTradeAmount((holding.shares * 0.25).toFixed(6)); // 25% of holdings
                        setActiveTab("trade");
                      }}
                      className="flex-1 py-2 px-3 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      Buy More
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStock(stock);
                        setTradeAmount((holding.shares * 0.5).toFixed(6)); // 50% of holdings
                        setActiveTab("trade");
                      }}
                      className="flex-1 py-2 px-3 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Sell 50%
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStock(stock);
                        setTradeAmount(holding.shares.toFixed(6)); // All holdings
                        setActiveTab("trade");
                      }}
                      className="flex-1 py-2 px-3 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                    >
                      Sell All
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderTradeTab = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 bg-gradient-to-b from-[#e6e6e6] to-[#d4d4d4] border-b border-[#c0c0c0]">
        <h2 className="text-lg font-semibold text-[#2c2c2c]">Trade</h2>
        {selectedStock && (
          <p className="text-sm text-[#666] mt-1">{selectedStock.name} ({selectedStock.symbol})</p>
        )}
      </div>
      
      {!selectedStock ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-lg font-medium text-[#2c2c2c] mb-2">Select an Asset</h3>
            <p className="text-[#666] text-sm">Go to Market tab to select stocks or crypto to trade</p>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Current Price */}
          <div className="bg-gradient-to-b from-white to-[#f8f8f8] rounded-lg border border-[#c0c0c0] p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#2c2c2c] mb-1">
                {formatStockPrice(selectedStock, selectedStock.price)}
              </div>
              <div className={`text-sm font-medium ${
                selectedStock.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatStockPrice(selectedStock, selectedStock.change)} ({formatPercent(selectedStock.changePercent)})
              </div>
            </div>
          </div>

          {/* Trade Input */}
          <div className="bg-gradient-to-b from-white to-[#f8f8f8] rounded-lg border border-[#c0c0c0] p-4">
            <label className="block text-sm font-medium text-[#2c2c2c] mb-2">
              Amount (shares)
            </label>
            <input
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border border-[#c0c0c0] rounded-lg bg-white text-[#2c2c2c] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="0.000001"
              min="0"
            />
            
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setTradeAmount("1")}
                className="flex-1 py-1 px-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                1
              </button>
              <button
                onClick={() => setTradeAmount("10")}
                className="flex-1 py-1 px-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                10
              </button>
              <button
                onClick={() => setTradeAmount("100")}
                className="flex-1 py-1 px-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                100
              </button>
              <button
                onClick={() => {
                  const maxAffordable = Math.floor(balance / selectedStock!.price);
                  setTradeAmount(maxAffordable.toString());
                }}
                className="flex-1 py-1 px-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Max Buy
              </button>
            </div>
            
            {/* Holdings-based buttons if user owns this stock */}
            {(() => {
              const holding = portfolio.find(p => p.symbol === selectedStock!.symbol);
              if (holding) {
                return (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setTradeAmount((holding.shares * 0.25).toFixed(6))}
                      className="flex-1 py-1 px-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                    >
                      25% Hold
                    </button>
                    <button
                      onClick={() => setTradeAmount((holding.shares * 0.5).toFixed(6))}
                      className="flex-1 py-1 px-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                    >
                      50% Hold
                    </button>
                    <button
                      onClick={() => setTradeAmount(holding.shares.toFixed(6))}
                      className="flex-1 py-1 px-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      All ({holding.shares.toFixed(2)})
                    </button>
                  </div>
                );
              }
              return null;
            })()}
            
            {tradeAmount && selectedStock && (
              <div className="mt-2 text-sm text-[#666]">
                Total: {formatCurrency(parseFloat(tradeAmount || "0") * selectedStock.price)}
              </div>
            )}
            <div className="mt-2 text-xs text-[#888]">
              Team Balance: {formatCurrency(balance)}
            </div>
          </div>

          {/* Trade Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => handleTrade("buy")}
              disabled={loading || !tradeAmount || parseFloat(tradeAmount) <= 0}
              className="flex-1 py-3 bg-gradient-to-b from-green-500 to-green-600 text-white font-semibold rounded-lg border border-green-700 active:from-green-600 active:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-600 transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              {loading ? "Processing..." : "Buy"}
            </button>
            <button
              onClick={() => handleTrade("sell")}
              disabled={loading || !tradeAmount || parseFloat(tradeAmount) <= 0}
              className="flex-1 py-3 bg-gradient-to-b from-red-500 to-red-600 text-white font-semibold rounded-lg border border-red-700 active:from-red-600 active:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-600 transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              {loading ? "Processing..." : "Sell"}
            </button>
          </div>

          {/* Current Holdings */}
          {(() => {
            const holding = portfolio.find(p => p.symbol === selectedStock!.symbol);
            if (holding && selectedStock) {
              const currentValue = holding.shares * selectedStock.price;
              const totalCost = holding.shares * holding.avgPrice;
              const gainLoss = currentValue - totalCost;
              
              return (
                <div className="bg-gradient-to-b from-white to-[#f8f8f8] rounded-lg border border-[#c0c0c0] p-4">
                  <h4 className="font-medium text-[#2c2c2c] mb-2">Current Holdings</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#666]">Shares:</span>
                      <span className="text-[#2c2c2c]">{holding.shares.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">Avg Price:</span>
                      <span className="text-[#2c2c2c]">{formatCurrency(holding.avgPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">Current Value:</span>
                      <span className="text-[#2c2c2c]">{formatCurrency(currentValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">Gain/Loss:</span>
                      <span className={gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(gainLoss)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );

  const renderWatchlistTab = () => {
    const watchlistStocks = stocks.filter(stock => watchlist.includes(stock.symbol));
    
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 bg-gradient-to-b from-[#e6e6e6] to-[#d4d4d4] border-b border-[#c0c0c0]">
          <h2 className="text-lg font-semibold text-[#2c2c2c]">Watchlist</h2>
          <p className="text-sm text-[#666] mt-1">{watchlistStocks.length} stocks tracked</p>
        </div>
        
        {watchlistStocks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-lg font-medium text-[#2c2c2c] mb-2">No Watchlist Items</h3>
              <p className="text-[#666] text-sm">Add stocks to your watchlist from the Market tab</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#c0c0c0]">
            {watchlistStocks.map((stock) => (
              <div key={stock.symbol} className="bg-gradient-to-b from-white to-[#f8f8f8]">
                <button
                  onClick={() => {
                    setSelectedStock(stock);
                    setActiveTab("trade");
                  }}
                  className="w-full px-4 py-3 text-left hover:from-[#f0f8ff] hover:to-[#e6f3ff] active:from-[#e0f0ff] active:to-[#d0e8ff] transition-all duration-150"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#2c2c2c]">{stock.symbol}</div>
                          <div className="text-sm text-[#666]">{stock.name}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(stock.symbol);
                          }}
                          className="ml-2 p-1 rounded-full text-yellow-500 hover:text-yellow-600 transition-colors"
                        >
                          ★
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs text-[#888] font-mono">
                          {generateSparkline(priceHistory[stock.symbol] || [])}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-[#2c2c2c]">
                        {formatCurrency(stock.price)}
                      </div>
                      <div className={`text-sm font-medium ${
                        stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(stock.change)} ({formatPercent(stock.changePercent)})
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNewsTab = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 bg-gradient-to-b from-[#e6e6e6] to-[#d4d4d4] border-b border-[#c0c0c0]">
        <h2 className="text-lg font-semibold text-[#2c2c2c]">Market News</h2>
        <p className="text-sm text-[#666] mt-1">Latest market updates and analysis</p>
      </div>
      
      <div className="divide-y divide-[#c0c0c0]">
        {marketNews.map((news) => (
          <div key={news.id} className="px-4 py-4 bg-gradient-to-b from-white to-[#f8f8f8]">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-[#2c2c2c] text-sm flex-1">{news.headline}</h3>
              <span className="text-xs text-[#888] ml-2">
                {news.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-[#666] mb-3">{news.summary}</p>
            <div className="flex flex-wrap gap-1">
              {news.relevantSymbols.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => {
                    const stock = stocks.find(s => s.symbol === symbol);
                    if (stock) {
                      setSelectedStock(stock);
                      setActiveTab("trade");
                    }
                  }}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 bg-gradient-to-b from-[#e6e6e6] to-[#d4d4d4] border-b border-[#c0c0c0]">
        <h2 className="text-lg font-semibold text-[#2c2c2c]">Price Alerts</h2>
        <p className="text-sm text-[#666] mt-1">{priceAlerts.length} alerts configured</p>
      </div>
      
      {priceAlerts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-[#2c2c2c] mb-2">No Price Alerts</h3>
            <p className="text-[#666] text-sm">Add alerts from the Market tab to get notified when prices hit your targets</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-[#c0c0c0]">
          {priceAlerts.map((alert) => {
            const stock = stocks.find(s => s.symbol === alert.symbol);
            const currentPrice = stock?.price || 0;
            const difference = ((currentPrice - alert.targetPrice) / alert.targetPrice) * 100;
            
            return (
              <div key={alert.id} className="px-4 py-4 bg-gradient-to-b from-white to-[#f8f8f8]">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-[#2c2c2c]">{alert.symbol}</div>
                    <div className="text-sm text-[#666] mt-1">
                      Alert when price goes {alert.condition} {formatCurrency(alert.targetPrice)}
                    </div>
                    <div className="text-xs text-[#888] mt-1">
                      Current: {formatCurrency(currentPrice)} ({difference >= 0 ? '+' : ''}{difference.toFixed(2)}%)
                    </div>
                    <div className={`text-xs mt-1 ${alert.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      Status: {alert.isActive ? 'Active' : 'Triggered'}
                    </div>
                  </div>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Typed tabs for the tab bar
  const tabs: { id: "market" | "portfolio" | "trade" | "watchlist" | "news" | "alerts"; label: string }[] = [
    { id: "market", label: "Market" },
    { id: "portfolio", label: "Portfolio" },
    { id: "trade", label: "Trade" },
    { id: "watchlist", label: "Watch" },
    { id: "news", label: "News" },
    { id: "alerts", label: "Alerts" },
  ];

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#b4c6d7] to-[#8fa4b8] flex flex-col relative overflow-hidden font-[Helvetica,Arial,ui-sans-serif]">
  {/* status bar removed */}

      {/* App header */}
      <div className="px-4 py-2 bg-gradient-to-b from-[#c8d4e0] to-[#a8bcc8] border-b border-[#8fa4b8] relative">
        <div className="flex items-center justify-between">
          {/* Back removed per UX: stay inside Stocks app */}
          <h1 className="text-lg font-bold text-[#2c2c2c]">Stocks</h1>
          <div className="w-[60px]" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-gradient-to-b from-[#e6e6e6] to-[#d4d4d4] border-b border-[#c0c0c0] overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-3 text-sm font-medium transition-all duration-150 whitespace-nowrap min-w-[80px] ${
                activeTab === tab.id
                  ? "bg-gradient-to-b from-white to-[#f0f0f0] text-blue-600 border-b-2 border-blue-600"
                  : "text-[#666] hover:text-[#2c2c2c] active:bg-gradient-to-b active:from-[#d8d8d8] active:to-[#c8c8c8]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "market" && renderMarketTab()}
      {activeTab === "portfolio" && renderPortfolioTab()}
      {activeTab === "trade" && renderTradeTab()}
      {activeTab === "watchlist" && renderWatchlistTab()}
      {activeTab === "news" && renderNewsTab()}
      {activeTab === "alerts" && renderAlertsTab()}
    </div>
  );
};

export default StockMarketApp;
