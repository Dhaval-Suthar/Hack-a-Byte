"use client";

import React from "react";
import Image from "next/image";

interface ProgramsMenuProps {
  onClose: () => void;
  onProgramClick: (programName: string) => void;
}

const ProgramsMenu: React.FC<ProgramsMenuProps> = ({ onClose, onProgramClick }) => {
  return (
    <div
      className="absolute left-full top-0 w-56 bg-[#c0c0c0] rounded-sm border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-40"
      onMouseLeave={onClose}
    >
      <div className="p-1">
        <div className="border-b border-b-[#808080] mb-1">
          <span className="text-sm font-bold">Programs</span>
        </div>

        <div className="flex flex-col">
          <div className="px-1 py-1 hover:bg-[#000080] hover:text-white flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 flex items-center justify-center mr-1">
                <Image src="/hackbook-W95/app-icon/folder.png" alt="Accessories" width={24} height={24} priority />
              </div>
              <span className="text-sm">Accessories</span>
            </div>
            <span className="text-sm">▶</span>
          </div>

          <div className="px-1 py-1 hover:bg-[#000080] hover:text-white flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 flex items-center justify-center mr-1">
                <Image src="/hackbook-W95/app-icon/folder.png" alt="Startup" width={24} height={24} priority />
              </div>
              <span className="text-sm">StartUp</span>
            </div>
            <span className="text-sm">▶</span>
          </div>

          <div className="px-1 py-1 hover:bg-[#000080] hover:text-white flex items-center">
            <div className="w-6 h-6 flex items-center justify-center mr-1">
              <Image
                src="/hackbook-W95/app-icon/msexchange.png"
                alt="Microsoft Exchange"
                width={24}
                height={24}
                priority
              />
            </div>
            <span className="text-sm">Microsoft Exchange</span>
          </div>

          <div className="px-1 py-1 hover:bg-[#000080] hover:text-white flex items-center">
            <div className="w-6 h-6 flex items-center justify-center mr-1">
              <Image src="/hackbook-W95/app-icon/msdos.png" alt="MS-DOS Prompt" width={24} height={24} priority />
            </div>
            <span className="text-sm">MS-DOS Prompt</span>
          </div>

          <div
            className="px-1 py-1 hover:bg-[#000080] hover:text-white flex items-center"
            onClick={() => onProgramClick("The Microsoft Network")}
          >
            <div className="w-6 h-6 flex items-center justify-center mr-1">
              <Image
                src="/hackbook-W95/app-icon/msnetwork.png"
                alt="The Microsoft Network"
                width={24}
                height={24}
                priority
              />
            </div>
            <span className="text-sm">The Microsoft Network</span>
          </div>

          <div
            className="px-1 py-1 hover:bg-[#000080] hover:text-white flex items-center"
            onClick={() => onProgramClick("Windows Explorer")}
          >
            <div className="w-6 h-6 flex items-center justify-center mr-1">
              <Image src="/hackbook-W95/app-icon/explorer.png" alt="Windows Explorer" width={24} height={24} priority />
            </div>
            <span className="text-sm">Windows Explorer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramsMenu;
