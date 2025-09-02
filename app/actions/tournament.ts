"use server";

import connectDb from "@/db/connectDb";
import TournamentModel from "@/models/Tournament";
import Team from "@/models/Team";

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

    // Verify admin key if provided
    if (data.adminKey) {
      // Add admin verification logic here
    }

    const tournament = new TournamentModel({
      name: data.name,
      description: data.description,
      maxTeams: data.maxTeams,
      entryFee: data.entryFee,
      prizePool: data.prizePool,
      startDate: data.startDate,
      endDate: data.endDate,
      rules: data.rules,
      status: 'registration_open',
      registeredTeams: [],
      brackets: [],
      currentRound: 0,
      totalRounds: Math.ceil(Math.log2(data.maxTeams)),
    });

    await tournament.save();
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
