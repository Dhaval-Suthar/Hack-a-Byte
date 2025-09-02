// Access Code Management
export {
  getAccessCodes,
  generateAccessCode,
  createCustomAccessCode,
  toggleAccessCodeStatus,
  deleteAccessCode,
  updateAccessCode,
  linkAccessCodeToPlayspace,
} from "./access-codes";

// Team Management
export {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from "./teams";

// Playspace Management
export {
  getPlayspaces,
  getPlayspaceDetails,
  createPlayspace,
  deletePlayspace,
  updatePlayspace,
  getDevicesByPlayspaceId,
} from "./playspaces";

// Device Management
export {
  getAllDevices,
  createDevice,
  assignDeviceToPlayspace,
  unassignDeviceFromPlayspace,
  updateDevice,
  getDevicesByPlayspace,
  deleteDevice,
  updateDeviceStatus,
} from "./devices";

// Event Management
export {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getPublicEvents,
} from "./events";

// Re-export common utilities
export { verifyAdmin, assignPlayspaceToAccessCode, getAvailablePlayspaces } from "./admin-utils";
