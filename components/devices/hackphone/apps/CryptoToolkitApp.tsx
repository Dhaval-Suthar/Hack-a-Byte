"use client";

import React, { useState } from "react";
import { AppContainer, AppHeader } from "../shared/AppContainer";

export const CryptoToolkitApp: React.FC = () => {
  const [hashInput, setHashInput] = useState("");
  const [base64Input, setBase64Input] = useState("");

  return (
    <AppContainer backgroundColor="bg-purple-900">
      <AppHeader title="Crypto Toolkit" />
      <div className="flex-1 p-4 space-y-4">
        <div className="bg-purple-800/50 rounded-lg p-4">
          <h3 className="text-purple-200 font-medium mb-3">Hash Generator</h3>
          <input
            type="text"
            placeholder="Enter text to hash..."
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            className="w-full bg-purple-700 text-purple-100 rounded px-3 py-2 mb-3"
          />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded hover:bg-purple-500 transition-colors">
              MD5
            </button>
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded hover:bg-purple-500 transition-colors">
              SHA256
            </button>
          </div>
        </div>

        <div className="bg-purple-800/50 rounded-lg p-4">
          <h3 className="text-purple-200 font-medium mb-3">Base64 Encoder/Decoder</h3>
          <textarea
            placeholder="Enter text to encode/decode..."
            value={base64Input}
            onChange={(e) => setBase64Input(e.target.value)}
            className="w-full bg-purple-700 text-purple-100 rounded px-3 py-2 mb-3 h-20 text-sm"
          />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded hover:bg-purple-500 transition-colors">
              Encode
            </button>
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded hover:bg-purple-500 transition-colors">
              Decode
            </button>
          </div>
        </div>

        <div className="bg-purple-800/50 rounded-lg p-4">
          <h3 className="text-purple-200 font-medium mb-3">Key Generator</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded hover:bg-purple-500 transition-colors">
              8 chars
            </button>
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded hover:bg-purple-500 transition-colors">
              16 chars
            </button>
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded hover:bg-purple-500 transition-colors">
              32 chars
            </button>
            <button className="bg-purple-600 text-purple-100 px-3 py-2 rounded hover:bg-purple-500 transition-colors">
              64 chars
            </button>
          </div>
        </div>
      </div>
    </AppContainer>
  );
};
