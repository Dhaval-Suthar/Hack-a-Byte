import React from "react";
import { Lock, Unlock, Plus } from "lucide-react";
import Password from "@/components/ui/password";
import BuyDevice from "@/components/ui/buyDevice";
import Link from "next/link";
import { getBalance, getModels, getUsername } from "../lib/actions";
import PowerButton from "@/components/ui/powerButton";

const HackingDashboard = async () => {
  let devices = [
    {
      id: "hackbook-L",
      name: "Hackbook-L",
      owned: false,
      password: "",
      price: 10000,
      image: "/hackbook-L.png",
      description: "Entry-level hacking terminal. Your first step into the network.",
    },
    {
      id: "hackbook-W95",
      name: "Hackbook-W95",
      owned: false,
      password: "",
      price: 50000,
      image: "/hackbook-W95.png",
      description: "Vintage hacking rig with enhanced network penetration capabilities.",
    },
  ];

  const userDevices = await getModels();
  const username = await getUsername();

  devices = devices.map((device) => {
    device.owned = userDevices[device.name] ? true : false;
    device.password = userDevices[device.name] ? userDevices[device.name].password : device.password;
    return device;
  });

  const balance = await getBalance();

  return (
    <div className="bg-[url('/hackingimg1.jpg')] bg-contain min-h-screen text-white">
      <div className="backdrop-blur-sm w-screen h-screen p-8">
        {" "}
        <div className="container mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-600">
                Hack a Byte
              </h1>
              <p className="text-indigo-300">Breach. Acquire. Exploit.</p>
            </div>
            <div className="bg-black p-4 rounded-lg font-mono text-center ">
              <div className="text-green-400 text-4xl font-bold animate-pulse drop-shadow-[0_0_10px_rgba(34,197,94,0.7)] tracking-wider">
                {balance}
              </div>
              <div className="text-xs text-green-600 mt-1 opacity-75">//SYSTEM_CREDITS</div>
            </div>
          </div>

          {/* Device Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {devices.map((device, index) => (
              <Link
                href={
                  device.owned
                    ? device.password === "-"
                      ? `/devices/${device.id}/setup`
                      : `/devices/${device.id}`
                    : "/dashboard"
                }
                passHref
              >
                <div
                  key={device.id}
                  className={`relative overflow-hidden rounded-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl
                ${
                  device.owned
                    ? "border-2 border-cyan-600 bg-cyan-900/20"
                    : "border-2 border-green-800 bg-green-900/10 opacity-80"
                }
              `}
                >
                  {/* Device Image */}
                  <div className="relative">
                    <img
                      src={device.image}
                      alt={device.name}
                      className="w-full h-48 object-cover filter brightness-75 hover:brightness-100 transition-all"
                    />
                    {/* Security Level Indicator */}
                    <div className="absolute top-2 right-2 bg-black/70 text-cyan-400 px-3 py-1 rounded-full text-xs">
                      Security Level: {index + 1}
                    </div>
                  </div>

                  {/* Device Details */}
                  <div className="p-5 bg-gray-800">
                    <h2 className="text-xl font-bold mb-2 flex items-center">
                      {device.owned ? (
                        <Unlock className="mr-2 text-green-400" />
                      ) : (
                        <Lock className="mr-2 text-red-400" />
                      )}
                      {device.name}
                    </h2>
                    <p className="text-indigo-300 text-sm mb-4">{device.description}</p>

                    {/* Action Button */}
                    {device.owned ? (
                      <Password device={device} username={username} />
                    ) : (
                      <BuyDevice device={device} balance={balance} />
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <PowerButton />
      </div>
    </div>
  );
};

export default HackingDashboard;
