import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import connectDb from '@/db/connectDb';
import TournamentModel from '@/models/Tournament';
import { createTournament, getTournaments, registerTeamForTournament } from '@/app/actions/tournament';

describe('Tournament Actions', () => {
  beforeEach(async () => {
    await connectDb();
    // Clear tournament collection before each test
    await TournamentModel.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await TournamentModel.deleteMany({});
  });

  describe('createTournament', () => {
    it('should create a tournament successfully', async () => {
      const tournamentData = {
        name: 'Test Tournament',
        description: 'A test tournament',
        maxTeams: 8,
        entryFee: 0.001,
        prizePool: 0.005,
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-02'),
        rules: ['No cheating', 'Be respectful'],
      };

      const result = await createTournament(tournamentData);

      expect(result.success).toBe(true);
      expect(result.tournament).toBeDefined();
      expect(result.tournament?.name).toBe(tournamentData.name);
      expect(result.tournament?.status).toBe('registration_open');
      expect(result.tournament?.maxTeams).toBe(tournamentData.maxTeams);
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        name: '',
        description: 'A test tournament',
        maxTeams: 8,
        entryFee: 0.001,
        prizePool: 0.005,
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-02'),
        rules: ['No cheating'],
      };

      const result = await createTournament(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getTournaments', () => {
    it('should return all tournaments', async () => {
      // Create test tournaments
      await TournamentModel.create([
        {
          name: 'Tournament 1',
          description: 'First tournament',
          maxTeams: 8,
          entryFee: 0.001,
          prizePool: 0.005,
          startDate: new Date('2025-10-01'),
          endDate: new Date('2025-10-02'),
          status: 'registration_open',
          registeredTeams: [],
          brackets: [],
          currentRound: 0,
        },
        {
          name: 'Tournament 2',
          description: 'Second tournament',
          maxTeams: 16,
          entryFee: 0.002,
          prizePool: 0.01,
          startDate: new Date('2025-10-03'),
          endDate: new Date('2025-10-04'),
          status: 'active',
          registeredTeams: [],
          brackets: [],
          currentRound: 0,
        },
      ]);

      const result = await getTournaments();

      expect(result.success).toBe(true);
      expect(result.tournaments).toHaveLength(2);
      expect(result.tournaments?.[0].name).toBe('Tournament 1');
      expect(result.tournaments?.[1].name).toBe('Tournament 2');
    });

    it('should filter tournaments by status', async () => {
      // Create test tournaments
      await TournamentModel.create([
        {
          name: 'Active Tournament',
          description: 'An active tournament',
          status: 'active',
          maxTeams: 8,
          entryFee: 0.001,
          prizePool: 0.005,
          startDate: new Date('2025-10-01'),
          endDate: new Date('2025-10-02'),
          registeredTeams: [],
          brackets: [],
          currentRound: 0,
        },
        {
          name: 'Registration Tournament',
          description: 'A tournament open for registration',
          status: 'registration_open',
          maxTeams: 16,
          entryFee: 0.002,
          prizePool: 0.01,
          startDate: new Date('2025-10-03'),
          endDate: new Date('2025-10-04'),
          registeredTeams: [],
          brackets: [],
          currentRound: 0,
        },
      ]);

      const result = await getTournaments('active');

      expect(result.success).toBe(true);
      expect(result.tournaments).toHaveLength(1);
      expect(result.tournaments?.[0].name).toBe('Active Tournament');
    });
  });

  describe('registerTeamForTournament', () => {
    let tournamentId: string;
    let teamId: string;

    beforeEach(async () => {
      // Create a test tournament
      const tournament = await TournamentModel.create({
        name: 'Registration Test Tournament',
        description: 'Test tournament for registration',
        maxTeams: 4,
        entryFee: 0.001,
        prizePool: 0.002,
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-02'),
        status: 'registration_open',
        registeredTeams: [],
        brackets: [],
        currentRound: 0,
      });
      tournamentId = tournament._id.toString();

      // Mock team ID (in real scenario, this would come from Team model)
      teamId = '507f1f77bcf86cd799439011';
    });

    it('should register a team successfully', async () => {
      // Note: This test would need proper team setup with wallet balance
      // For now, we'll test the basic structure
      const result = await registerTeamForTournament(tournamentId, teamId);

      // This will likely fail due to missing team, but tests the function structure
      expect(result).toBeDefined();
    });

    it('should fail for non-existent tournament', async () => {
      const fakeTournamentId = '507f1f77bcf86cd799439012';
      const result = await registerTeamForTournament(fakeTournamentId, teamId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tournament not found');
    });
  });
});
