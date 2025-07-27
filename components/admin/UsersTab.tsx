"use client";

interface User {
  _id: string;
  username: string;
  email: string;
  isAuthenticated: boolean;
  isMentor: boolean;
  isAdmin: boolean;
  createdAt: string;
}

interface UsersTabProps {
  users: User[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  isLoading: boolean;
  onUserAction: (userId: string, action: string) => void;
}

export default function UsersTab({
  users,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  isLoading,
  onUserAction
}: UsersTabProps) {
  // Filter and pagination logic
  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-primary"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-gray-300">Username</th>
              <th className="px-4 py-3 text-left text-gray-300">Email</th>
              <th className="px-4 py-3 text-left text-gray-300">Roles</th>
              <th className="px-4 py-3 text-left text-gray-300">Joined</th>
              <th className="px-4 py-3 text-left text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedUsers.map((user) => (
              <tr key={user._id} className="hover:bg-gray-700">
                <td className="px-4 py-3">{user.username}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.isAdmin && (
                      <span className="bg-red-900/50 text-red-200 px-2 py-1 rounded text-xs">Admin</span>
                    )}
                    {user.isMentor && (
                      <span className="bg-blue-900/50 text-blue-200 px-2 py-1 rounded text-xs">Mentor</span>
                    )}
                    {!user.isAdmin && !user.isMentor && (
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">User</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {!user.isAdmin && (
                      <button
                        onClick={() => onUserAction(user._id, "promoteToAdmin")}
                        className="bg-green-900/50 hover:bg-green-800/50 text-green-200 px-2 py-1 rounded text-xs transition-colors"
                      >
                        Make Admin
                      </button>
                    )}
                    {!user.isMentor && (
                      <button
                        onClick={() => onUserAction(user._id, "promoteToMentor")}
                        className="bg-blue-900/50 hover:bg-blue-800/50 text-blue-200 px-2 py-1 rounded text-xs transition-colors"
                      >
                        Make Mentor
                      </button>
                    )}
                    {user.isAdmin && (
                      <button
                        onClick={() => onUserAction(user._id, "removeAdmin")}
                        className="bg-orange-900/50 hover:bg-orange-800/50 text-orange-200 px-2 py-1 rounded text-xs transition-colors"
                      >
                        Remove Admin
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
                          onUserAction(user._id, "delete");
                        }
                      }}
                      className="bg-red-900/50 hover:bg-red-800/50 text-red-200 px-2 py-1 rounded text-xs transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-center text-gray-400">
                  {isLoading ? "Loading users..." : "No users found"}
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