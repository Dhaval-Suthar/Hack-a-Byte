"use client";

import React, { useState, useEffect, useCallback } from "react";

// Define card types
type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type Card = {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
};

interface SolitaireProps {
  onClose: () => void;
}

const Solitaire: React.FC<SolitaireProps> = ({ onClose }) => {
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [foundations, setFoundations] = useState<Card[][]>(Array(4).fill([]));
  const [tableaus, setTableaus] = useState<Card[][]>(Array(7).fill([]));
  const [selectedCard, setSelectedCard] = useState<{card: Card, source: string, index: number} | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Initialize game
  useEffect(() => {
    if (!gameStarted) {
      dealNewGame();
      setGameStarted(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);
  
  const shuffleDeck = useCallback((deck: Card[]): Card[] => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  }, []);
  
  const createDeck = useCallback((): Card[] => {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
    const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const newDeck: Card[] = [];
    
    suits.forEach(suit => {
      ranks.forEach(rank => {
        newDeck.push({
          id: `${rank}-${suit}`,
          suit,
          rank,
          faceUp: false
        });
      });
    });
    
    // Shuffle the deck
    return shuffleDeck(newDeck);
  }, [shuffleDeck]);
  
  const dealNewGame = useCallback(() => {
    const newDeck = createDeck();
    const newTableaus: Card[][] = Array(7).fill([]).map(() => []);
    
    // Deal cards to tableaus
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j <= i; j++) {
        const card = newDeck.pop();
        if (card) {
          // Only the top card is face up
          card.faceUp = j === i;
          newTableaus[i].push(card);
        }
      }
    }
    
    setStock(newDeck);
    setWaste([]);
    setFoundations([[], [], [], []]);
    setTableaus(newTableaus);
    setSelectedCard(null);
    setScore(0);
    setMoves(0);
  }, [createDeck]);
  
  // Simplified card rendering - in a real app, you'd have actual card images
  const renderCard = (card: Card | null, idx: number, source: string) => {
    if (!card) return (
      <div 
        key={`empty-${idx}`}
        className="w-16 h-24 rounded border-2 border-dashed border-gray-300 bg-[#007700]"
      />
    );
    
    const isRed = card.suit === "hearts" || card.suit === "diamonds";
    
    return (
      <div 
        key={card.id} 
        className={`w-16 h-24 rounded border-2 border-gray-800 ${
          card.faceUp 
            ? "bg-white shadow-md" 
            : "bg-blue-900 cursor-not-allowed"
        } ${
          selectedCard?.card.id === card.id ? "ring-2 ring-yellow-400" : ""
        }`}
        onClick={() => handleCardClick(card, source, idx)}
      >
        {card.faceUp && (
          <div className="p-0.5">
            <div className={`text-xs font-bold ${isRed ? "text-red-600" : "text-black"}`}>
              {card.rank}
              <span className="ml-0.5">
                {card.suit === "hearts" ? "♥" : 
                 card.suit === "diamonds" ? "♦" : 
                 card.suit === "clubs" ? "♣" : "♠"}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Handle card clicks
  const handleCardClick = (card: Card | null, source: string, index: number) => {
    // Handle click on empty spot
    if (card === null) {
      if (selectedCard) {
        moveCard(selectedCard, source, index);
      }
      return;
    }
    
    // If card is not face up and not in stock, ignore click
    if (!card.faceUp && source !== "stock") return;
    
    // If no card is selected, select this one
    if (!selectedCard) {
      setSelectedCard({ card, source, index });
      return;
    }
    
    // If same card is clicked, deselect it
    if (selectedCard.card.id === card.id) {
      setSelectedCard(null);
      return;
    }
    
    // Try to move the selected card to the clicked location
    moveCard(selectedCard, source, index);
  };
  
  // Simplified move logic - in a real game, you'd have more complex rules
  const moveCard = (selected: {card: Card, source: string, index: number}, targetSource: string, targetIndex: number) => {
    // Placeholder for move logic
    
    // Increment moves
    setMoves(prev => prev + 1);
    
    // Reset selection after move
    setSelectedCard(null);
  };
  
  // Draw from stock
  const drawFromStock = () => {
    if (stock.length === 0) {
      // Reset stock from waste
      setStock([...waste].reverse().map(card => ({ ...card, faceUp: false })));
      setWaste([]);
      return;
    }
    
    const drawnCard = stock[stock.length - 1];
    drawnCard.faceUp = true;
    
    setStock(prev => prev.slice(0, -1));
    setWaste(prev => [...prev, drawnCard]);
    setMoves(prev => prev + 1);
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="w-full flex items-center bg-[#c0c0c0] border-b border-b-[#808080] p-1">
        <div className="flex-1"></div>
        <button 
          className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={onClose}
        >
          <span className="text-xs">Close</span>
        </button>
      </div>
      
      <div className="flex-1 bg-[#007700] p-2 overflow-auto">
        {/* Game header - score, timer, etc. */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-white">
            <div>Score: {score}</div>
            <div>Moves: {moves}</div>
          </div>
          <button 
            className="px-3 py-1 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
            onClick={dealNewGame}
          >
            New Game
          </button>
        </div>
      </div>
      
      {/* Game area */}
      <div className="flex space-x-4">
        {/* Stock and waste */}
        <div className="flex space-x-4">
          <div 
            className="w-16 h-24 rounded bg-[#007700] border-2 border-dashed border-gray-300 cursor-pointer"
            onClick={drawFromStock}
          >
            {stock.length > 0 && (
              <div className="w-full h-full rounded bg-blue-900 border-2 border-gray-800" />
            )}
          </div>
          <div>
            {waste.length > 0 && renderCard(waste[waste.length - 1], 0, "waste")}
          </div>
        </div>
        
        {/* Gap */}
        <div className="w-8"></div>
        
        {/* Foundations */}
        <div className="flex space-x-4">
          {foundations.map((foundation, idx) => (
            <div key={`foundation-${idx}`}>
              {foundation.length > 0 
                ? renderCard(foundation[foundation.length - 1], idx, `foundation-${idx}`)
                : (
                  <div 
                    className="w-16 h-24 rounded border-2 border-dashed border-gray-300 bg-[#007700]"
                    onClick={() => handleCardClick(null, `foundation-${idx}`, 0)}
                  />
                )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Tableau */}
      <div className="flex space-x-4 mt-4">
        {tableaus.map((column, columnIdx) => (
          <div key={`tableau-${columnIdx}`} className="flex flex-col">
            {column.length > 0 ? (
              column.map((card, cardIdx) => (
                <div key={card.id} className="-mt-16 first:mt-0">
                  {renderCard(card, cardIdx, `tableau-${columnIdx}`)}
                </div>
              ))
            ) : (
              <div 
                className="w-16 h-24 rounded border-2 border-dashed border-gray-300 bg-[#007700]"
                onClick={() => handleCardClick(null, `tableau-${columnIdx}`, 0)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Solitaire;
