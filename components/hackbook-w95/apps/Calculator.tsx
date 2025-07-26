"use client";

import React, { useState } from "react";

interface CalculatorProps {
  onClose: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ onClose }) => {
  const [display, setDisplay] = useState("0");
  const [firstOperand, setFirstOperand] = useState<null | string>(null);
  const [operator, setOperator] = useState<null | string>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [memory, setMemory] = useState(0);

  const inputDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplay("0.");
      setWaitingForSecondOperand(false);
      return;
    }

    if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const clearDisplay = () => {
    setDisplay("0");
  };

  const clearAll = () => {
    setDisplay("0");
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const handleOperator = (nextOperator: string) => {
    // No need to use inputValue since we don't reference it later
    if (firstOperand === null) {
      setFirstOperand(display);
    } else if (operator) {
      const result = performCalculation();
      setDisplay(result.toString());
      setFirstOperand(result.toString());
    }
    
    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };

  const performCalculation = () => {
    const firstValue = parseFloat(firstOperand || "0");
    const secondValue = parseFloat(display);
    
    if (operator === "+") {
      return firstValue + secondValue;
    } else if (operator === "-") {
      return firstValue - secondValue;
    } else if (operator === "×") {
      return firstValue * secondValue;
    } else if (operator === "÷") {
      return firstValue / secondValue;
    }
    
    return secondValue;
  };

  const calculate = () => {
    if (!operator || firstOperand === null) return;
    
    const result = performCalculation();
    setDisplay(result.toString());
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const negate = () => {
    const value = parseFloat(display);
    if (value !== 0) {
      setDisplay((value * -1).toString());
    }
  };

  const percentage = () => {
    const value = parseFloat(display);
    setDisplay((value / 100).toString());
  };

  const sqrt = () => {
    const value = parseFloat(display);
    if (value >= 0) {
      setDisplay(Math.sqrt(value).toString());
    }
  };

  const reciprocal = () => {
    const value = parseFloat(display);
    if (value !== 0) {
      setDisplay((1 / value).toString());
    }
  };
  
  const memoryRecall = () => {
    setDisplay(memory.toString());
  };

  const memoryClear = () => {
    setMemory(0);
  };

  const memoryAdd = () => {
    setMemory(memory + parseFloat(display));
  };

  const memorySubtract = () => {
    setMemory(memory - parseFloat(display));
  };

  const renderButton = (content: string, onClick: () => void, className: string = "") => (
    <button 
      className={`flex-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] m-0.5 flex justify-center items-center font-bold ${className}`}
      onClick={onClick}
    >
      {content}
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#c0c0c0]">
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
      
      <div className="p-1.5 flex-1 flex flex-col">
        <div className="w-full px-2 py-1 mb-1 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff]">
          <div className="text-right text-xl font-mono leading-tight overflow-hidden">
            {display}
          </div>
        </div>
      
        <div className="flex-1 flex flex-col">
        {/* Memory functions */}
        <div className="flex h-8 mb-1">
          {renderButton("MC", memoryClear, "text-sm")}
          {renderButton("MR", memoryRecall, "text-sm")}
          {renderButton("MS", () => setMemory(parseFloat(display)), "text-sm")}
          {renderButton("M+", memoryAdd, "text-sm")}
          {renderButton("M-", memorySubtract, "text-sm")}
        </div>
        
        {/* Special functions */}
        <div className="flex h-8 mb-1">
          {renderButton("Backspace", () => setDisplay(display.length > 1 ? display.slice(0, -1) : "0"), "text-xs")}
          {renderButton("CE", clearDisplay, "text-sm")}
          {renderButton("C", clearAll, "text-sm")}
          {renderButton("±", negate, "text-sm")}
          {renderButton("√", sqrt, "text-sm")}
        </div>
        
        {/* Additional functions */}
        <div className="flex h-8 mb-1">
          {renderButton("1/x", reciprocal, "text-sm")}
          <div className="flex-[4]"></div>
        </div>
        
        {/* Numbers and operations */}
        <div className="flex flex-1">
          {/* Numbers */}
          <div className="flex-[3] flex flex-col">
            <div className="flex flex-1">
              {renderButton("7", () => inputDigit("7"))}
              {renderButton("8", () => inputDigit("8"))}
              {renderButton("9", () => inputDigit("9"))}
            </div>
            <div className="flex flex-1">
              {renderButton("4", () => inputDigit("4"))}
              {renderButton("5", () => inputDigit("5"))}
              {renderButton("6", () => inputDigit("6"))}
            </div>
            <div className="flex flex-1">
              {renderButton("1", () => inputDigit("1"))}
              {renderButton("2", () => inputDigit("2"))}
              {renderButton("3", () => inputDigit("3"))}
            </div>
            <div className="flex flex-1">
              {renderButton("0", () => inputDigit("0"))}
              {renderButton(".", inputDecimal)}
              {renderButton("%", percentage)}
            </div>
          </div>
          
          {/* Operations */}
          <div className="flex-1 flex flex-col">
            {renderButton("÷", () => handleOperator("÷"))}
            {renderButton("×", () => handleOperator("×"))}
            {renderButton("-", () => handleOperator("-"))}
            {renderButton("+", () => handleOperator("+"))}
            {renderButton("=", calculate)}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Calculator;
