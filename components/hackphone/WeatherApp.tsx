"use client";

import React, { useState, useEffect } from "react";

interface WeatherAppProps {
  onClose: () => void;
  time: Date;
}

interface WeatherData {
  location: string;
  currentTemp: number;
  condition: string;
  icon: string;
  high: number;
  low: number;
  forecast: {
    day: string;
    icon: string;
    high: number;
    low: number;
  }[];
}

const WeatherApp: React.FC<WeatherAppProps> = ({ onClose, time }) => {
  const [weatherData, setWeatherData] = useState<WeatherData>({
    location: "Cupertino",
    currentTemp: 49,
    condition: "Partly Cloudy",
    icon: "☁️",
    high: 58,
    low: 42,
    forecast: [
      { day: "SUNDAY", icon: "🌧️", high: 58, low: 42 },
      { day: "MONDAY", icon: "🌧️", high: 58, low: 42 },
      { day: "TUESDAY", icon: "☀️", high: 60, low: 45 },
      { day: "WEDNESDAY", icon: "🌧️", high: 57, low: 45 },
      { day: "THURSDAY", icon: "🌧️", high: 54, low: 45 },
      { day: "FRIDAY", icon: "🌧️", high: 58, low: 45 },
    ]
  });

  const renderStatusBar = () => (
    <div className="flex justify-between items-center px-4 py-1 text-white text-sm font-medium bg-black bg-opacity-30">
      <div className="flex items-center space-x-1">
        <span>•••</span>
        <span className="text-xs">📶</span>
      </div>
      <div className="font-semibold">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className="flex items-center space-x-1">
        <span className="text-xs">🔋</span>
      </div>
    </div>
  );

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return '☀️';
      case 'partly cloudy':
      case 'cloudy':
        return '☁️';
      case 'rainy':
      case 'rain':
        return '🌧️';
      case 'stormy':
        return '⛈️';
      case 'snowy':
      case 'snow':
        return '❄️';
      default:
        return '☁️';
    }
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-700"></div>
      
      {/* Cloud background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 text-white text-6xl">☁️</div>
        <div className="absolute top-32 right-20 text-white text-4xl">☁️</div>
        <div className="absolute top-60 left-1/4 text-white text-5xl">☁️</div>
      </div>

      <div className="relative z-10 flex flex-col h-full text-white">
        {renderStatusBar()}
        
        {/* Header with back button */}
        <div className="px-4 py-3 flex items-center">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 backdrop-blur-sm"
          >
            <span className="text-white text-lg font-semibold">‹</span>
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-lg font-medium">Weather</h2>
          </div>
          <div className="w-10 h-10"></div> {/* Spacer for centering */}
        </div>
        
        {/* Main weather content */}
        <div className="flex-1 px-6 py-4">
          {/* Current weather card */}
          <div className="bg-black bg-opacity-20 rounded-xl p-6 mb-6 backdrop-blur-sm border border-white border-opacity-20">
            {/* Location and current temp */}
            <div className="text-center mb-4">
              <h1 className="text-xl font-medium mb-2">{weatherData.location}</h1>
              <div className="text-sm opacity-80 mb-4">
                H: {weatherData.high}° L: {weatherData.low}°
              </div>
              <div className="text-6xl font-light mb-2">{weatherData.currentTemp}°</div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-4xl">{getWeatherIcon(weatherData.condition)}</span>
              </div>
            </div>
          </div>

          {/* Weekly forecast */}
          <div className="bg-black bg-opacity-20 rounded-xl backdrop-blur-sm border border-white border-opacity-20">
            <div className="p-4">
              {weatherData.forecast.map((day, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-white border-opacity-10 last:border-b-0"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <span className="text-sm font-medium w-20">{day.day}</span>
                    <span className="text-2xl">{day.icon}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-medium">{day.high}°</span>
                    <span className="text-lg opacity-60">{day.low}°</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom info */}
            <div className="px-4 pb-4 flex items-center justify-center text-xs opacity-70">
              <div className="flex items-center space-x-2">
                <span>🌐</span>
                <span>Updated {time.toLocaleDateString()} {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom navigation indicator */}
        <div className="flex justify-center pb-2">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-white rounded-full opacity-100"></div>
            <div className="w-2 h-2 bg-white rounded-full opacity-30"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;
