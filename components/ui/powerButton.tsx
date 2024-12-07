"use client";

import React, { useState } from "react";
import { Power } from "lucide-react";
import { logout } from "@/app/lib/actions";

const PowerButton = () => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => {
    logout();
    setIsPressed(false);
  };

  return (
    <button
      className={`fixed top-[90vh] right-4
        flex items-center justify-center 
        w-16 h-16 rounded-full 
        transition-all duration-200 ease-in-out  
        ${isPressed ? "scale-95 shadow-inner text-red-600" : "scale-100 shadow-md "}
        focus:outline-none hover:scale-105
      `}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      aria-label="Power Off"
    >
      <Power
        size={32}
        strokeWidth={2.5}
        className={`
          transition-transform duration-200 
          ${isPressed ? "scale-90" : "scale-100"}
        `}
      />
    </button>
  );
};

export default PowerButton;
