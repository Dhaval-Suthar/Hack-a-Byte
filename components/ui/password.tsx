"use client";

import { Device } from "@/app/lib/definitions";
import React, { useState } from "react";

const Password = ({ device }: { device: Device }) => {
  const [passwordRevealed, setPasswordRevealed] = useState(false);

  const revealPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent the default behavior
    event.stopPropagation(); // Prevent the click event from bubbling up to the link
    setPasswordRevealed(!passwordRevealed);
  };

  return (
    <div>
      <button
        onClick={revealPassword}
        className="w-full relative bg-gradient-to-r from-cyan-700 to-green-700 hover:from-cyan-600 hover:to-green-600 text-white py-3 rounded-lg transition-all"
      >
        {passwordRevealed ? `Password: ${device.password}` : "Decrypt Password"}
      </button>
    </div>
  );
};

export default Password;
