"use client";

interface Team {
  _id: string;
  name: string;
  description: string;
  members: number;
}

interface TeamsTabProps {
  teams: Team[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  isLoading: boolean;
  onViewTeamDetails: (teamId: string) => void;
}

export default function TeamsTab({
  teams,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  isLoading,
  onViewTeamDetails
}: TeamsTabProps) {
  // Filter and pagination logic
  const filteredTeams = teams.filter(
    (team) =>
      team.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeams = filteredTeams.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-cyber-primary"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-gray-300">Team Name</th>
              <th className="px-4 py-3 text-left text-gray-300">Description</th>
              <th className="px-4 py-3 text-left text-gray-300">Members</th>
              <th className="px-4 py-3 text-left text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedTeams.map((team) => (
              <tr key={team._id} className="hover:bg-gray-700">
                <td className="px-4 py-3">{team.name || "Unknown"}</td>
                <td className="px-4 py-3">{team.description || "No description"}</td>
                <td className="px-4 py-3">{team.members || 0}</td>
                <td className="px-4 py-3 flex space-x-2">
                  <button
                    onClick={() => onViewTeamDetails(team._id)}
                    className="bg-blue-800 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
            {paginatedTeams.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center text-gray-400">
                  {isLoading ? "Loading teams..." : "No teams found"}
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