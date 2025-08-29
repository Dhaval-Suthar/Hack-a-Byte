"use client";

import React, { useState } from "react";

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
  hourly: {
    time: string;
    temp: number;
    icon: string;
  }[];
  forecastHourly: Record<string, { time: string; temp: number; icon: string }[]>;
}

const WeatherApp: React.FC<WeatherAppProps> = ({ onClose }) => {
  const [weatherData] = useState<WeatherData>({
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
    ],
    hourly: [
      { time: "5:00 PM", temp: 59, icon: "🌤️" },
      { time: "6:00 PM", temp: 58, icon: "🌤️" },
      { time: "7:00 PM", temp: 56, icon: "☁️" },
      { time: "8:00 PM", temp: 54, icon: "🌧️" },
      { time: "9:00 PM", temp: 52, icon: "🌧️" },
      { time: "10:00 PM", temp: 51, icon: "🌧️" },
    ],
    forecastHourly: {
      SUNDAY: [
        { time: "6:00 AM", temp: 64, icon: "🌧️" },
        { time: "9:00 AM", temp: 66, icon: "🌧️" },
        { time: "12:00 PM", temp: 68, icon: "🌧️" },
        { time: "3:00 PM", temp: 66, icon: "🌧️" },
      ],
      MONDAY: [
        { time: "6:00 AM", temp: 58, icon: "🌧️" },
        { time: "9:00 AM", temp: 60, icon: "🌧️" },
        { time: "12:00 PM", temp: 62, icon: "🌧️" },
        { time: "3:00 PM", temp: 61, icon: "🌧️" },
      ],
      TUESDAY: [
        { time: "6:00 AM", temp: 60, icon: "☀️" },
        { time: "9:00 AM", temp: 63, icon: "☀️" },
        { time: "12:00 PM", temp: 68, icon: "☀️" },
        { time: "3:00 PM", temp: 70, icon: "☀️" },
      ],
      WEDNESDAY: [
        { time: "6:00 AM", temp: 57, icon: "🌧️" },
        { time: "9:00 AM", temp: 58, icon: "🌧️" },
        { time: "12:00 PM", temp: 56, icon: "🌧️" },
        { time: "3:00 PM", temp: 55, icon: "🌧️" },
      ],
      THURSDAY: [
        { time: "6:00 AM", temp: 54, icon: "🌧️" },
        { time: "9:00 AM", temp: 55, icon: "🌧️" },
        { time: "12:00 PM", temp: 56, icon: "🌧️" },
        { time: "3:00 PM", temp: 57, icon: "🌧️" },
      ],
      FRIDAY: [
        { time: "6:00 AM", temp: 58, icon: "🌧️" },
        { time: "9:00 AM", temp: 60, icon: "🌧️" },
        { time: "12:00 PM", temp: 62, icon: "🌧️" },
        { time: "3:00 PM", temp: 63, icon: "🌧️" },
      ],
    },
  });

  const [selectedDay, setSelectedDay] = useState<string>(weatherData.forecast?.[0]?.day ?? "SUNDAY");

  const renderStatusBar = () => (
    <div className="flex justify-between items-center px-4 py-1 text-white text-sm font-medium bg-black bg-opacity-30">
      <div className="flex items-center space-x-1">
        <span>•••</span>
        <span className="text-xs">📶</span>
      </div>
      <div className="font-semibold">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      <div className="flex items-center space-x-1">
        <span className="text-xs">🔋</span>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-700"></div>

      {/* Cloud background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 text-white text-6xl">☁️</div>
        <div className="absolute top-32 right-20 text-white text-4xl">☁️</div>
        <div className="absolute top-60 left-1/4 text-white text-5xl">☁️</div>
      </div>

      <div className="relative z-10 flex flex-col h-full text-white overflow-y-auto">
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

        {/* Main weather content - two column layout */}
        <div className="flex-1 px-4 py-4">
          <div className="grid grid-cols-12 gap-4 min-h-full">
            {/* Left: current + weekly (full width) */}
            <div className="col-span-12">
              <div className="bg-black bg-opacity-20 rounded-xl p-6 mb-4 backdrop-blur-sm border border-white border-opacity-20">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-medium">{weatherData.location}</h1>
                    <div className="text-sm opacity-80">
                      H: {weatherData.high}° L: {weatherData.low}°
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-6xl font-light">{weatherData.currentTemp}°</div>
                    <div className="text-md opacity-90">{weatherData.condition}</div>
                  </div>
                </div>
              </div>

              <div className="bg-black bg-opacity-20 rounded-xl backdrop-blur-sm border border-white border-opacity-20 overflow-visible">
                <div className="p-3">
                  {weatherData.forecast.map((day, index) => (
                    <div key={index}>
                      <div
                        onClick={() => setSelectedDay(day.day)}
                        className={`flex items-center justify-between py-3 border-b border-white border-opacity-10 last:border-b-0 cursor-pointer px-2 ${
                          selectedDay === day.day ? "bg-white bg-opacity-10 rounded-md" : ""
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium w-28">{day.day}</span>
                          <span className="text-2xl">{day.icon}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-medium">{day.high}°</span>
                          <span className="text-lg opacity-60">{day.low}°</span>
                        </div>
                      </div>

                      {/* Inline hourly for the selected day */}
                      {selectedDay === day.day && (
                        <div className="bg-white bg-opacity-5 rounded-b-md p-3 border-t border-white border-opacity-5">
                          <div className="text-xs opacity-80 mb-2">Hourly for {day.day}</div>
                          <div className="space-y-2">
                            {(weatherData.forecastHourly?.[day.day] ?? weatherData.hourly).map((h, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <div className="text-sm opacity-90">{h.time}</div>
                                <div className="flex items-center space-x-3">
                                  <span className="text-lg">{h.temp}°</span>
                                  <span className="text-xl">{h.icon}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4 flex items-center justify-center text-xs opacity-70">
                  <div className="flex items-center space-x-2">
                    <span>🌐</span>
                    <span>
                      Updated {new Date().toLocaleDateString()}{" "}
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* right column removed - hourly now shown inline under selected day */}
          </div>
        </div>

        {/* Bottom navigation indicator removed */}
      </div>
    </div>
  );
};

export default WeatherApp;
