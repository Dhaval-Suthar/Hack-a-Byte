"use client";

interface Device {
  _id: string;
  name: string;
  type: string;
  status: string;
  ipAddress: string;
  macAddress: string;
  isAssigned: boolean;
  assignedPlayspace?: {
    _id: string;
    name: string;
    description: string;
  };
}

interface DevicesTabProps {
  devices: Device[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  isLoading: boolean;
  onCreateDevice: (deviceType: string) => void;
  onUnassignDevice: (deviceId: string) => void;
  onDeleteDevice: (deviceId: string) => void;
  onUpdateStatus: (deviceId: string, newStatus: string) => void;
}

export default function DevicesTab({
  devices,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  isLoading,
  onCreateDevice,
  onUnassignDevice,
  onDeleteDevice,
  onUpdateStatus
}: DevicesTabProps) {
  // Filter and pagination logic
  const filteredDevices = devices.filter(
    (device) =>
      device.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search devices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-primary"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-300 mb-2">Create New Device</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {["hackbook-w95", "hackbook-l", "hackdroid", "hackphone", "admin-console"].map((deviceType) => (
            <button
              key={deviceType}
              onClick={() => onCreateDevice(deviceType)}
              className="flex items-center justify-between bg-blue-900/30 hover:bg-blue-800/50 text-blue-200 p-3 rounded-md text-left"
            >
              <div>
                <div className="font-medium">{deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}</div>
                <div className="text-sm text-blue-300">Click to create new device</div>
              </div>
              <span className="text-sm">+ Create</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-gray-300">MAC Address</th>
              <th className="px-4 py-3 text-left text-gray-300">Type</th>
              <th className="px-4 py-3 text-left text-gray-300">Status</th>
              <th className="px-4 py-3 text-left text-gray-300">Assigned Playspace</th>
              <th className="px-4 py-3 text-left text-gray-300">Action</th>
              <th className="px-4 py-3 text-left text-gray-300">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedDevices.map((device) => (
              <tr key={device._id} className="hover:bg-gray-700">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                    {device.macAddress || "N/A"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-200">{device.type}</div>
                    <div className="text-sm text-gray-400">Virtual Device</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={device.status}
                    onChange={(e) => onUpdateStatus(device._id, e.target.value)}
                    className={`px-2 py-1 rounded text-xs border-0 focus:outline-none focus:ring-2 focus:ring-cyber-primary ${
                      device.status === "online"
                        ? "bg-green-900/50 text-green-200"
                        : device.status === "maintenance"
                        ? "bg-yellow-900/50 text-yellow-200"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {device.assignedPlayspace ? (
                    <div className="flex items-center space-x-2">
                      <div>
                        <div className="font-medium text-gray-200">{device.assignedPlayspace.name}</div>
                        <div className="text-sm text-gray-400">{device.assignedPlayspace.description}</div>
                      </div>
                      <button
                        onClick={() => onUnassignDevice(device._id)}
                        className="bg-orange-900/50 hover:bg-orange-800/50 text-orange-200 px-2 py-1 rounded text-xs"
                      >
                        Unassign
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not assigned</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onDeleteDevice(device._id)}
                    className="bg-red-900/50 hover:bg-red-800/50 text-red-200 px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-400">N/A</span>
                </td>
              </tr>
            ))}
            {paginatedDevices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-center text-gray-400">
                  {isLoading ? "Loading devices..." : "No devices found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-800 rounded-md disabled:opacity-50 hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-800 rounded-md disabled:opacity-50 hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}