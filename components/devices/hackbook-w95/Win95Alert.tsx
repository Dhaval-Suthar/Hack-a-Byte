import React from "react";
import Image from "next/image";

interface Win95AlertProps {
  message: string;
  onClose: () => void;
}

const Win95Alert: React.FC<Win95AlertProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-[#BBC2C2] border-2 border-black border-t-white border-l-white shadow-lg w-80 p-4 relative">
        <div className="flex items-center mb-4">
          <Image src="/hackbook-w95/window_95Alert.png" alt="Alert" width={32} height={32} className="w-8 h-8 mr-2" />
          <span className="font-bold text-lg">Alert</span>
        </div>
        <div className="mb-4 text-black">{message}</div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#BBC2C2] h-8 w-20 border-2 border-black border-t-white border-l-white shadow text-black hover:bg-gray-200"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default Win95Alert;
