"use client";

import { buyModel } from "@/app/lib/actions";
import { Device } from "@/app/lib/definitions";
import { Plus } from "lucide-react";
import React from "react";

const BuyDevice = ({ device, balance }: { device: Device; balance: number }) => {
  const buyDevice = () => {
    buyModel(device.name);
  };

  return (
    <button
      onClick={buyDevice}
      disabled={balance < device.price}
      className={`w-full py-3 rounded-lg transition-all
        ${
          balance >= device.price
            ? "bg-gradient-to-r from-green-800 to-indigo-800 hover:from-green-700 hover:to-indigo-700 text-white"
            : "bg-gray-800 text-gray-500 cursor-not-allowed"
        }`}
    >
      <Plus className="inline-block mr-2" />
      Acquire for {device.price} HackTokens
    </button>
  );
};

export default BuyDevice;
