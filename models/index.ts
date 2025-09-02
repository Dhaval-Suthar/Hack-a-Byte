// Model exports for easy importing
export { default as User } from './User';
export { default as AccessCode } from './AccessCode';
export { default as Device } from './Device';
export { default as DeviceUser } from './DeviceUser';
export { default as Event, type IEvent } from './Event';
export { default as EventRegistration, type IEventRegistration } from './EventRegistration';
export { default as GameSession, type IGameSession } from './GameSession';
export { default as LeaderboardEntry, type LeaderboardEntryDocument } from './LeaderboardEntry';
export { default as MissionModel, type Mission } from './Mission';
export { default as PlayspaceModel, type Playspace } from './Playspace';
export { default as SponsorContact, type ISponsorContact } from './SponsorContact';
export { default as Team, type EventTeam } from './Team';
export { default as TournamentModel, type Tournament } from './Tournament';
export { default as NotificationModel, type Notification } from './Notification';
export { default as WalletTransactionModel, type WalletTransaction } from './WalletTransaction';
export { default as AttackLogModel, type AttackLog } from './AttackLog';
export { default as AchievementModel, UserAchievementModel, type Achievement, type UserAchievement } from './Achievement';
export { default as AuditLogModel, type AuditLog } from './AuditLog';
export { default as ChatMessageModel, type ChatMessage } from './ChatMessage';

// Re-export mongoose for convenience
export { default as mongoose } from 'mongoose';
