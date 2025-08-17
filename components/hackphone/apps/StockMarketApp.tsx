"use client";

import React, { useState, useEffect } from "react";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface Portfolio {
  symbol: string;
  shares: number;
  avgPrice: number;
}

interface StockMarketAppProps { time?: Date }
const StockMarketApp: React.FC<StockMarketAppProps> = () => {
  const [activeTab, setActiveTab] = useState<"market" | "portfolio" | "trade">("market");
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [tradeAmount, setTradeAmount] = useState("");
  const [balance, setBalance] = useState(10000);
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [stocks, setStocks] = useState<StockData[]>([
    // Indian Stocks
    { symbol: "RELIANCE", name: "Reliance Industries", price: 2850.75, change: 42.30, changePercent: 1.51 },
    { symbol: "TCS", name: "Tata Consultancy Services", price: 4125.60, change: -25.40, changePercent: -0.61 },
    { symbol: "INFY", name: "Infosys Limited", price: 1789.25, change: 18.75, changePercent: 1.06 },
    { symbol: "HDFCBANK", name: "HDFC Bank", price: 1650.80, change: -12.20, changePercent: -0.73 },
    { symbol: "ADANIENT", name: "Adani Enterprises", price: 3245.90, change: 78.50, changePercent: 2.48 },
    
    // International Stocks
    { symbol: "AAPL", name: "Apple Inc.", price: 189.50, change: 2.45, changePercent: 1.31 },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.75, change: -1.80, changePercent: -1.24 },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 425.30, change: 5.20, changePercent: 1.24 },
    { symbol: "TSLA", name: "Tesla Inc.", price: 238.85, change: -8.40, changePercent: -3.40 },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 465.20, change: 12.35, changePercent: 2.73 },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.25, change: 3.15, changePercent: 1.80 },
    
    // Cryptocurrencies
    { symbol: "BTC", name: "Bitcoin", price: 43250.50, change: 1230.45, changePercent: 2.93 },
    { symbol: "ETH", name: "Ethereum", price: 2680.32, change: -45.22, changePercent: -1.66 },
    { symbol: "BNB", name: "Binance Coin", price: 312.45, change: 8.75, changePercent: 2.88 },
    { symbol: "ADA", name: "Cardano", price: 0.52, change: 0.03, changePercent: 6.12 },
    { symbol: "SOL", name: "Solana", price: 98.76, change: 4.32, changePercent: 4.58 },
    { symbol: "DOT", name: "Polkadot", price: 7.45, change: -0.23, changePercent: -3.00 },
    { symbol: "MATIC", name: "Polygon", price: 0.87, change: 0.05, changePercent: 6.10 },
    { symbol: "DOGE", name: "Dogecoin", price: 0.08, change: 0.002, changePercent: 2.56 },
  ]);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => 
        prevStocks.map(stock => {
          const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
          const newPrice = stock.price * (1 + changePercent / 100);
          const change = newPrice - stock.price;
          
          return {
            ...stock,
            price: newPrice,
            change: change,
            changePercent: changePercent
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  

  const formatStockPrice = (stock: StockData, amount: number) => {
    const indianStocks = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ADANIENT'];
    
    if (indianStocks.includes(stock.symbol)) {
      return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return formatCurrency(amount);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const handleTrade = (type: "buy" | "sell") => {
    if (!selectedStock || !tradeAmount) return;
    
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (type === "buy") {
      const cost = amount * selectedStock.price;
      if (cost > balance) {
        alert("Insufficient balance!");
        return;
      }
      
      setBalance(prev => prev - cost);
      setPortfolio(prev => {
        const existing = prev.find(p => p.symbol === selectedStock.symbol);
        if (existing) {
          const totalShares = existing.shares + amount;
          const avgPrice = ((existing.shares * existing.avgPrice) + cost) / totalShares;
          return prev.map(p => 
            p.symbol === selectedStock.symbol 
              ? { ...p, shares: totalShares, avgPrice }
              : p
          );
        } else {
          return [...prev, { symbol: selectedStock.symbol, shares: amount, avgPrice: selectedStock.price }];
        }
      });
    } else {
      const holding = portfolio.find(p => p.symbol === selectedStock.symbol);
      if (!holding || holding.shares < amount) {
        alert("Insufficient shares!");
        return;
      }
      
      const proceeds = amount * selectedStock.price;
      setBalance(prev => prev + proceeds);
      setPortfolio(prev => 
        prev.map(p => 
          p.symbol === selectedStock.symbol 
            ? { ...p, shares: p.shares - amount }
            : p
        ).filter(p => p.shares > 0)
      );
    }
    
    setTradeAmount("");
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
        <p className="text-sm text-[#666] mt-1">Indian Stocks • International Stocks • Cryptocurrency</p>
        <p className="text-xs text-[#888] mt-1">Live prices updated every 3 seconds</p>
      </div>
      
      <div className="divide-y divide-[#c0c0c0]">
        {/* Indian Stocks Section */}
        <div className="px-4 py-2 bg-gradient-to-b from-[#f5f5f5] to-[#ebebeb] border-b border-[#d0d0d0]">
          <h3 className="text-sm font-semibold text-[#2c2c2c] flex items-center">
            🇮🇳 Indian Stocks
          </h3>
        </div>
        {stocks.filter(stock => ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ADANIENT'].includes(stock.symbol)).map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => {
              setSelectedStock(stock);
              setActiveTab("trade");
            }}
            className="w-full px-4 py-3 text-left bg-gradient-to-b from-white to-[#f8f8f8] hover:from-[#f0f8ff] hover:to-[#e6f3ff] active:from-[#e0f0ff] active:to-[#d0e8ff] transition-all duration-150"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-[#2c2c2c]">{stock.symbol}</div>
                <div className="text-sm text-[#666]">{stock.name}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[#2c2c2c]">
                  ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-sm font-medium ${
                  stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₹{stock.change.toFixed(2)} ({formatPercent(stock.changePercent)})
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* International Stocks Section */}
        <div className="px-4 py-2 bg-gradient-to-b from-[#f5f5f5] to-[#ebebeb] border-b border-[#d0d0d0]">
          <h3 className="text-sm font-semibold text-[#2c2c2c] flex items-center">
            🌍 International Stocks
          </h3>
        </div>
        {stocks.filter(stock => ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN'].includes(stock.symbol)).map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => {
              setSelectedStock(stock);
              setActiveTab("trade");
            }}
            className="w-full px-4 py-3 text-left bg-gradient-to-b from-white to-[#f8f8f8] hover:from-[#f0f8ff] hover:to-[#e6f3ff] active:from-[#e0f0ff] active:to-[#d0e8ff] transition-all duration-150"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-[#2c2c2c]">{stock.symbol}</div>
                <div className="text-sm text-[#666]">{stock.name}</div>
              </div>
              <div className="text-right">
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
        ))}

        {/* Cryptocurrency Section */}
        <div className="px-4 py-2 bg-gradient-to-b from-[#f5f5f5] to-[#ebebeb] border-b border-[#d0d0d0]">
          <h3 className="text-sm font-semibold text-[#2c2c2c] flex items-center">
            ₿ Cryptocurrency
          </h3>
        </div>
        {stocks.filter(stock => ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'MATIC', 'DOGE'].includes(stock.symbol)).map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => {
              setSelectedStock(stock);
              setActiveTab("trade");
            }}
            className="w-full px-4 py-3 text-left bg-gradient-to-b from-white to-[#f8f8f8] hover:from-[#f0f8ff] hover:to-[#e6f3ff] active:from-[#e0f0ff] active:to-[#d0e8ff] transition-all duration-150"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-[#2c2c2c]">{stock.symbol}</div>
                <div className="text-sm text-[#666]">{stock.name}</div>
              </div>
              <div className="text-right">
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
        ))}
      </div>
    </div>
  );

  const renderPortfolioTab = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 bg-gradient-to-b from-[#e6e6e6] to-[#d4d4d4] border-b border-[#c0c0c0]">
        <h2 className="text-lg font-semibold text-[#2c2c2c]">My Portfolio</h2>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-[#666]">Total Value:</span>
          <span className="font-bold text-[#2c2c2c]">
            {formatCurrency(balance + getPortfolioValue())}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm text-[#666]">Cash Balance:</span>
          <span className="font-semibold text-[#2c2c2c]">
            {formatCurrency(balance)}
          </span>
        </div>
      </div>
      
      {portfolio.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-[#2c2c2c] mb-2">No Holdings</h3>
            <p className="text-[#666] text-sm">Start investing to build your portfolio!</p>
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
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-[#2c2c2c]">{stock.symbol}</div>
                    <div className="text-sm text-[#666]">
                      {holding.shares.toFixed(6)} shares @ {formatCurrency(holding.avgPrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[#2c2c2c]">
                      {formatCurrency(currentValue)}
                    </div>
                    <div className={`text-sm font-medium ${
                      gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(gainLoss)} ({formatPercent(gainLossPercent)})
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

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
            {tradeAmount && selectedStock && (
              <div className="mt-2 text-sm text-[#666]">
                Total: {formatStockPrice(selectedStock, parseFloat(tradeAmount || "0") * selectedStock.price)}
              </div>
            )}
          </div>

          {/* Trade Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => handleTrade("buy")}
              disabled={!tradeAmount || parseFloat(tradeAmount) <= 0}
              className="flex-1 py-3 bg-gradient-to-b from-green-500 to-green-600 text-white font-semibold rounded-lg border border-green-700 active:from-green-600 active:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-600 transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              Buy
            </button>
            <button
              onClick={() => handleTrade("sell")}
              disabled={!tradeAmount || parseFloat(tradeAmount) <= 0}
              className="flex-1 py-3 bg-gradient-to-b from-red-500 to-red-600 text-white font-semibold rounded-lg border border-red-700 active:from-red-600 active:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:border-gray-600 transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              Sell
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
                      <span className="text-[#2c2c2c]">{formatStockPrice(selectedStock, holding.avgPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">Current Value:</span>
                      <span className="text-[#2c2c2c]">{formatStockPrice(selectedStock, currentValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">Gain/Loss:</span>
                      <span className={gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatStockPrice(selectedStock, gainLoss)}
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

  // Typed tabs for the tab bar
  const tabs: { id: "market" | "portfolio" | "trade"; label: string }[] = [
    { id: "market", label: "Market" },
    { id: "portfolio", label: "Portfolio" },
    { id: "trade", label: "Trade" },
  ];

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-[#b4c6d7] to-[#8fa4b8] flex flex-col relative overflow-hidden font-[Helvetica,Arial,ui-sans-serif]">
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
      <div className="bg-gradient-to-b from-[#e6e6e6] to-[#d4d4d4] border-b border-[#c0c0c0] flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-150 ${
              activeTab === tab.id
                ? "bg-gradient-to-b from-white to-[#f0f0f0] text-blue-600 border-b-2 border-blue-600"
                : "text-[#666] hover:text-[#2c2c2c] active:bg-gradient-to-b active:from-[#d8d8d8] active:to-[#c8c8c8]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "market" && renderMarketTab()}
      {activeTab === "portfolio" && renderPortfolioTab()}
      {activeTab === "trade" && renderTradeTab()}
    </div>
  );
};

export default StockMarketApp;
