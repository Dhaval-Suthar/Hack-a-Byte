import { teamHasRole } from '@/lib/role-access';
import Team from '@/models/Team';

jest.mock('@/models/Team', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

// Type helper for mocked model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedTeam = Team as unknown as { findById: jest.Mock<any, any> };

describe('role access utilities', () => {
  afterEach(() => jest.clearAllMocks());

  function mockFind(teamMembers: { role?: string|null }[] | null) {
    mockedTeam.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(teamMembers ? { teamMembers } : null),
    });
  }

  it('teamHasRole returns true when at least one member matches', async () => {
    mockFind([ { role: 'rio' }, { role: 'nairobi' } ]);
    const ok = await teamHasRole('tid','tokyo,rio'.split(','));
    expect(ok).toBe(true);
  });

  it('teamHasRole returns false when no roles match', async () => {
    mockFind([ { role: 'professor' } ]);
    const ok = await teamHasRole('tid',['rio','tokyo']);
    expect(ok).toBe(false);
  });
});
