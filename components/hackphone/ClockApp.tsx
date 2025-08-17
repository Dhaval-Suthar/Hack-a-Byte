"use client";

import React, { useState, useEffect } from "react";

interface ClockAppProps {
  onClose: () => void;
  time: Date;
}

const ClockApp: React.FC<ClockAppProps> = ({ onClose, time }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState("world");

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatTimeWithSeconds = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDigitalTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDigitalSeconds = (date: Date) => {
    return date.getSeconds().toString().padStart(2, '0');
  };

  const renderStatusBar = () => (
    <div className="flex justify-between items-center px-4 pt-10 pb-2 text-white text-xs relative z-10">
      <div className="flex items-center space-x-2">
        <button onClick={onClose} className="text-blue-400 text-sm font-medium">
          ← Back
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium">{formatTime(time)}</span>
        <div className="w-6 h-3 border border-white/60 rounded-sm relative">
          <div className="w-3 h-1.5 bg-green-500 rounded-sm m-0.5" />
          <div className="w-0.5 h-1 bg-white/60 rounded-full absolute -right-0.5 top-0.5" />
        </div>
      </div>
    </div>
  );

  const renderAnalogClock = () => {
    const hours = currentTime.getHours() % 12;
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();

    const hourAngle = (hours * 30) + (minutes * 0.5) - 90;
    const minuteAngle = (minutes * 6) - 90;
    const secondAngle = (seconds * 6) - 90;

    return (
      <div className="flex items-center justify-center py-8">
        <div className="relative">
          {/* Clock face */}
          <div className="w-72 h-72 rounded-full bg-white shadow-2xl relative border-8 border-gray-200">
            {/* Hour markers */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-6 bg-black"
                style={{
                  top: '10px',
                  left: '50%',
                  transformOrigin: '50% 134px',
                  transform: `translateX(-50%) rotate(${i * 30}deg)`
                }}
              />
            ))}
            
            {/* Numbers */}
            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x = Math.cos(angle) * 110;
              const y = Math.sin(angle) * 110;
              return (
                <div
                  key={num}
                  className="absolute text-2xl font-bold text-black flex items-center justify-center w-8 h-8"
                  style={{
                    left: `calc(50% + ${x}px - 16px)`,
                    top: `calc(50% + ${y}px - 16px)`
                  }}
                >
                  {num}
                </div>
              );
            })}

            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-black rounded-full transform -translate-x-1/2 -translate-y-1/2 z-30" />

            {/* Hour hand */}
            <div
              className="absolute bg-black rounded-full z-20"
              style={{
                width: '6px',
                height: '80px',
                top: '50%',
                left: '50%',
                transformOrigin: '50% 100%',
                transform: `translateX(-50%) translateY(-100%) rotate(${hourAngle}deg)`
              }}
            />

            {/* Minute hand */}
            <div
              className="absolute bg-black rounded-full z-20"
              style={{
                width: '4px',
                height: '110px',
                top: '50%',
                left: '50%',
                transformOrigin: '50% 100%',
                transform: `translateX(-50%) translateY(-100%) rotate(${minuteAngle}deg)`
              }}
            />

            {/* Second hand */}
            <div
              className="absolute bg-red-500 rounded-full z-20"
              style={{
                width: '2px',
                height: '120px',
                top: '50%',
                left: '50%',
                transformOrigin: '50% 100%',
                transform: `translateX(-50%) translateY(-100%) rotate(${secondAngle}deg)`
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderDigitalClock = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-black">
      <div className="text-center">
        <div className="text-7xl font-light text-white font-mono tracking-wider mb-2">
          {formatDigitalTime(currentTime)}
        </div>
        <div className="text-3xl font-light text-gray-400 font-mono">
          {getDigitalSeconds(currentTime)}
        </div>
        <div className="text-lg text-gray-500 mt-4">
          {currentTime.toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>
    </div>
  );

  const worldClocks = [
    { city: "New York", timezone: "America/New_York", flag: "🇺🇸" },
    { city: "London", timezone: "Europe/London", flag: "🇬🇧" },
    { city: "Tokyo", timezone: "Asia/Tokyo", flag: "🇯🇵" },
    { city: "Sydney", timezone: "Australia/Sydney", flag: "🇦🇺" },
    { city: "Dubai", timezone: "Asia/Dubai", flag: "🇦🇪" },
    { city: "Mumbai", timezone: "Asia/Kolkata", flag: "🇮🇳" },
  ];

  const getTimeInTimezone = (timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(currentTime);
  };

  const getTimeOffset = (timezone: string) => {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    // Intentionally not using formatToParts here; remove unused assignment to satisfy linter
    new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(utc);
    const localOffset = now.getTimezoneOffset() / -60;
    return `${localOffset >= 0 ? '+' : ''}${localOffset}`;
  };

  const renderWorldClocks = () => (
    <div className="flex-1 bg-gray-100 overflow-y-auto">
      <div className="p-4 space-y-1">
        {worldClocks.map((clock, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{clock.flag}</span>
                <div>
                  <div className="font-medium text-gray-900">{clock.city}</div>
                  <div className="text-sm text-gray-500">Today, {getTimeOffset(clock.timezone)}HRS</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-light text-gray-900">
                  {getTimeInTimezone(clock.timezone)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: "world", label: "World Clock", icon: "🌍" },
    { id: "alarm", label: "Alarm", icon: "⏰" },
    { id: "stopwatch", label: "Stopwatch", icon: "⏱️" },
    { id: "timer", label: "Timer", icon: "⏲️" },
  ];

  return (
    <div className="w-screen h-screen bg-black flex flex-col">
      {renderStatusBar()}
      
      {/* Navigation header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-3">
        <h1 className="text-lg font-semibold text-white text-center">Clock</h1>
      </div>

      {/* Tab content */}
      <div className="flex-1 flex flex-col">
        {selectedTab === "world" && renderWorldClocks()}
        {selectedTab === "alarm" && (
          <div className="flex-1 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">⏰</div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">No Alarms</h2>
              <p className="text-gray-500">Tap the + to add an alarm</p>
            </div>
          </div>
        )}
        {selectedTab === "stopwatch" && (
          <div className="flex-1 bg-black flex flex-col">
            {renderAnalogClock()}
            <div className="text-center text-white py-8">
              <div className="text-6xl font-mono font-light mb-8">
                {formatTimeWithSeconds(currentTime)}
              </div>
              <div className="flex justify-center space-x-16">
                <button className="w-20 h-20 rounded-full bg-gray-600 border-4 border-gray-400 text-white font-medium">
                  Reset
                </button>
                <button className="w-20 h-20 rounded-full bg-green-600 border-4 border-green-400 text-white font-medium">
                  Start
                </button>
              </div>
            </div>
          </div>
        )}
        {selectedTab === "timer" && renderDigitalClock()}
      </div>

      {/* Tab bar */}
      <div className="bg-gray-900 border-t border-gray-700">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 py-3 px-2 flex flex-col items-center space-y-1 ${
                selectedTab === tab.id ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClockApp;
