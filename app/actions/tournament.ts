"use server";

import connectDb from "@/db/connectDb";
import TournamentModel from "@/models/Tournament";
import Team from "@/models/Team";
import { Types } from 'mongoose';

interface LegacyTournamentInput { [k: string]: unknown }
function mapLegacyTournamentInput(data: LegacyTournamentInput) {
  const now = new Date();
  const regStart = new Date(now.getTime() - 5 * 60 * 1000);
  const regEnd = new Date(now.getTime() + 60 * 60 * 1000);
  const maxTeams = typeof data.maxTeams === 'number' ? data.maxTeams : 8;
  const entryFee = typeof data.entryFee === 'number' ? data.entryFee : 0;
  const prizePool = typeof (data.prizePool) === 'number' ? (data.prizePool as number) : 0;
  return {
    name: data.name || 'Tournament',
    description: data.description || 'No description',
    type: 'single_elimination',
    status: 'registration_open',
    maxTeams,
    minTeams: Math.min(2, maxTeams),
    teamSize: 1,
    entryFee,
    registrationStart: regStart,
    registrationEnd: regEnd,
    startDate: data.startDate || new Date(Date.now() + 2 * 60 * 60 * 1000),
    endDate: data.endDate || new Date(Date.now() + 3 * 60 * 60 * 1000),
    bracket: [],
    currentRound: 0,
    registeredTeams: [],
    acceptedTeams: [],
    rejectedTeams: [],
    prizes: [],
    rules: {
      maxGameDuration: 25,
      allowRematches: false,
      scoringSystem: 'score_based',
      tiebreakerRules: []
    },
    stats: {
      totalGames: 0,
      totalParticipants: 0,
      averageGameDuration: 0,
      totalPrizePool: prizePool
    },
  createdBy: new Types.ObjectId(),
    admins: [],
    isPublic: true,
    tags: []
  };
}

export async function createTournament(data: {
  name: string;
  description: string;
  maxTeams: number;
  entryFee: number;
  prizePool: number;
  startDate: Date;
  endDate: Date;
  rules: string[];
  adminKey?: string;
}) {
  try {
    await connectDb();
  if (!data.name || !data.name.trim()) return { success: false, error: 'Name required' };
  if (!data.description || !data.description.trim()) return { success: false, error: 'Description required' };
  if (!Array.isArray(data.rules) || !data.rules.length) return { success: false, error: 'At least one rule required' };

    // Verify admin key if provided
    if (data.adminKey) {
      // Add admin verification logic here
    }

  const mapped = mapLegacyTournamentInput(data);
  const tournament = await TournamentModel.create(mapped);
    return { success: true, tournament: tournament.toObject() };
  } catch (error) {
    console.error("Error creating tournament:", error);
    return { success: false, error: "Failed to create tournament" };
  }
}

export async function getTournaments(status?: string) {
  try {
    await connectDb();

    const query = status ? { status } : {};
    const tournaments = await TournamentModel.find(query)
      .populate('registeredTeams', 'name leaderUserId')
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, tournaments };
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return { success: false, error: "Failed to fetch tournaments" };
  }
}

export async function registerTeamForTournament(tournamentId: string, teamId: string) {
  try {
    await connectDb();

    const tournament = await TournamentModel.findById(tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    // Check if tournament is accepting registrations
    if (tournament.status !== 'registration_open') {
      return { success: false, error: "Tournament is not accepting registrations" };
    }

    // Check if team is already registered
    if (tournament.registeredTeams.includes(teamId)) {
      return { success: false, error: "Team is already registered" };
    }

    // Check if tournament is full
    if (tournament.registeredTeams.length >= tournament.maxTeams) {
      return { success: false, error: "Tournament is full" };
    }

    // Check if team has enough balance for entry fee
    if (team.wallet.bitcoinBalance < tournament.entryFee) {
      return { success: false, error: "Insufficient balance for entry fee" };
    }

    // Deduct entry fee and register team
    team.wallet.bitcoinBalance -= tournament.entryFee;
    tournament.registeredTeams.push(teamId);

    await Promise.all([
      team.save(),
      tournament.save()
    ]);

    return { success: true, message: "Team registered successfully" };
  } catch (error) {
    console.error("Error registering team:", error);
    return { success: false, error: "Failed to register team" };
  }
}

export async function startTournament(tournamentId: string, adminKey?: string) {
  try {
    await connectDb();

    // Verify admin key if provided
    if (adminKey) {
      // Add admin verification logic here
    }

    const tournament = await TournamentModel.findById(tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    if (tournament.registeredTeams.length < 2) {
      return { success: false, error: "Not enough teams registered" };
    }

    // Generate brackets
    const brackets = await tournament.generateBrackets();
    tournament.brackets = brackets;
    tournament.status = 'in_progress';
    tournament.currentRound = 1;

    await tournament.save();

    return { success: true, tournament: tournament.toObject() };
  } catch (error) {
    console.error("Error starting tournament:", error);
    return { success: false, error: "Failed to start tournament" };
  }
}

export async function updateMatchResult(tournamentId: string, matchId: string, winnerId: string, adminKey?: string) {
  try {
    await connectDb();

    // Verify admin key if provided
    if (adminKey) {
      // Add admin verification logic here
    }

    const tournament = await TournamentModel.findById(tournamentId);
    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    const result = await tournament.updateMatchResult(matchId, winnerId);
    if (!result.success) {
      return result;
    }

    await tournament.save();
    return { success: true, tournament: tournament.toObject() };
  } catch (error) {
    console.error("Error updating match result:", error);
    return { success: false, error: "Failed to update match result" };
  }
}
