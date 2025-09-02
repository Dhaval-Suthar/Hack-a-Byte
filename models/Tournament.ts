import mongoose, { Schema, Document } from "mongoose";

export type TournamentStatus = 'upcoming' | 'registration_open' | 'registration_closed' | 'active' | 'completed' | 'cancelled';
export type TournamentType = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss' | 'free_for_all';

export interface TournamentBracket {
  round: number;
  matches: {
    matchId: string;
    team1Id: string;
    team2Id: string;
    winner?: string;
    score?: {
      team1: number;
      team2: number;
    };
    status: 'pending' | 'active' | 'completed';
    scheduledTime?: Date;
    completedTime?: Date;
  }[];
}

export interface TournamentPrize {
  position: number;
  description: string;
  value?: number;
  item?: string;
}

export interface Tournament extends Document {
  name: string;
  description: string;
  type: TournamentType;
  status: TournamentStatus;
  eventId?: mongoose.Schema.Types.ObjectId;

  // Configuration
  maxTeams: number;
  minTeams: number;
  teamSize: number;
  entryFee: number;

  // Timing
  registrationStart: Date;
  registrationEnd: Date;
  startDate: Date;
  endDate?: Date;

  // Participants
  registeredTeams: mongoose.Schema.Types.ObjectId[];
  acceptedTeams: mongoose.Schema.Types.ObjectId[];
  rejectedTeams: mongoose.Schema.Types.ObjectId[];

  // Bracket and matches
  bracket: TournamentBracket[];
  currentRound: number;

  // Results
  winner?: mongoose.Schema.Types.ObjectId;
  finalStandings: {
    teamId: mongoose.Schema.Types.ObjectId;
    position: number;
    finalScore: number;
  }[];

  // Prizes
  prizes: TournamentPrize[];

  // Settings
  rules: {
    maxGameDuration: number; // in minutes
    allowRematches: boolean;
    scoringSystem: 'points' | 'wins' | 'score_based';
    tiebreakerRules: string[];
  };

  // Statistics
  stats: {
    totalGames: number;
    totalParticipants: number;
    averageGameDuration: number;
    totalPrizePool: number;
  };

  // Metadata
  createdBy: mongoose.Schema.Types.ObjectId; // Reference to admin/organizer
  admins: mongoose.Schema.Types.ObjectId[]; // Admin user IDs
  isPublic: boolean;
  tags: string[];
}

const TournamentBracketSchema = new Schema({
  round: { type: Number, required: true },
  matches: [{
    matchId: { type: String, required: true },
    team1Id: { type: String, required: true },
    team2Id: { type: String, required: true },
    winner: String,
    score: {
      team1: { type: Number, default: 0 },
      team2: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed'],
      default: 'pending'
    },
    scheduledTime: Date,
    completedTime: Date
  }]
}, { _id: false });

const TournamentPrizeSchema = new Schema({
  position: { type: Number, required: true },
  description: { type: String, required: true },
  value: Number,
  item: String
}, { _id: false });

const TournamentSchema = new Schema<Tournament>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    type: {
      type: String,
      enum: ['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'free_for_all'],
      required: true
    },
    status: {
      type: String,
      enum: ['upcoming', 'registration_open', 'registration_closed', 'active', 'completed', 'cancelled'],
      default: 'upcoming'
    },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },

    // Configuration
    maxTeams: { type: Number, required: true, min: 2 },
    minTeams: { type: Number, required: true, min: 2 },
    teamSize: { type: Number, required: true, min: 1 },
    entryFee: { type: Number, default: 0, min: 0 },

    // Timing
    registrationStart: { type: Date, required: true },
    registrationEnd: { type: Date, required: true },
    startDate: { type: Date, required: true },
    endDate: Date,

    // Participants
    registeredTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    acceptedTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    rejectedTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],

    // Bracket and matches
    bracket: [TournamentBracketSchema],
    currentRound: { type: Number, default: 0 },

    // Results
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    finalStandings: [{
      teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
      position: { type: Number, required: true },
      finalScore: { type: Number, required: true }
    }],

    // Prizes
    prizes: [TournamentPrizeSchema],

    // Settings
    rules: {
      maxGameDuration: { type: Number, default: 25, min: 5 }, // minutes
      allowRematches: { type: Boolean, default: false },
      scoringSystem: {
        type: String,
        enum: ['points', 'wins', 'score_based'],
        default: 'score_based'
      },
      tiebreakerRules: [{ type: String }]
    },

    // Statistics
    stats: {
      totalGames: { type: Number, default: 0 },
      totalParticipants: { type: Number, default: 0 },
      averageGameDuration: { type: Number, default: 0 },
      totalPrizePool: { type: Number, default: 0 }
    },

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    admins: [{ type: mongoose.Schema.Types.ObjectId }],
    isPublic: { type: Boolean, default: true },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

// Indexes
TournamentSchema.index({ status: 1 });
TournamentSchema.index({ startDate: 1 });
TournamentSchema.index({ 'registeredTeams': 1 });
TournamentSchema.index({ createdBy: 1 });
TournamentSchema.index({ tags: 1 });

// Virtual for checking if registration is open
TournamentSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return this.status === 'registration_open' &&
         now >= this.registrationStart &&
         now <= this.registrationEnd;
});

// Instance methods
TournamentSchema.methods.canRegister = function(teamId: string) {
  return this.registeredTeams.includes(teamId) === false &&
         this.acceptedTeams.includes(teamId) === false &&
         this.isRegistrationOpen;
};

TournamentSchema.methods.addTeam = function(teamId: mongoose.Types.ObjectId) {
  if (!this.registeredTeams.includes(teamId)) {
    this.registeredTeams.push(teamId);
    this.stats.totalParticipants += 1;
  }
  return this.save();
};

TournamentSchema.methods.acceptTeam = function(teamId: mongoose.Types.ObjectId) {
  const index = this.registeredTeams.indexOf(teamId);
  if (index > -1) {
    this.registeredTeams.splice(index, 1);
    this.acceptedTeams.push(teamId);
  }
  return this.save();
};

TournamentSchema.methods.generateBracket = function() {
  // Implementation for bracket generation based on tournament type
  // This would be complex logic depending on the tournament format
  // For now, just initialize the bracket structure
  this.bracket = [];
  this.currentRound = 1;
  return this.save();
};

export default mongoose.models.Tournament || mongoose.model<Tournament>("Tournament", TournamentSchema);
