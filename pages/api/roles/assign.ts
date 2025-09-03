import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import AccessCode from '@/models/AccessCode';
import { ROLE_LIMITS } from '@/lib/constants/app-constants';
import type { NextApiResponseServerIo } from '@/lib/socket';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { accessCode, username, role } = req.body || {};
    if (!accessCode || !username || !role) return res.status(400).json({ error: 'accessCode, username, role required' });
    await connectDb();
    const codeDoc = await AccessCode.findOne({ code: accessCode, isActive: true });
    if (!codeDoc) return res.status(404).json({ error: 'Invalid access code' });
    if (codeDoc.maxUsages && codeDoc.usageCount >= codeDoc.maxUsages) return res.status(400).json({ error: 'Code usage limit reached' });
    const team = await Team.findOne({ accessCodeId: codeDoc._id });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const normalizedRole = String(role).toLowerCase();
    const limits = ROLE_LIMITS[team.numberOfPlayers as keyof typeof ROLE_LIMITS] || ROLE_LIMITS[4];
    const maxAllowed = (limits as Record<string, number>)[normalizedRole] || 0;
  const currentCount = team.teamMembers.filter((m: { role?: string|null }) => m.role && m.role.toLowerCase() === normalizedRole).length;
    if (currentCount >= maxAllowed) return res.status(400).json({ error: `Role "${normalizedRole}" limit reached` });
    // slot
  const slot = team.teamMembers.find((m: { accessCodeUsed: boolean }) => !m.accessCodeUsed);
    if (!slot) return res.status(400).json({ error: 'No available slots' });
    slot.username = username;
    slot.role = normalizedRole;
    slot.accessCodeUsed = true;
    slot.accessCodeUsedAt = new Date();
    codeDoc.usageCount += 1;
    await codeDoc.save();
  const allJoined = team.teamMembers.every((m: { accessCodeUsed: boolean }) => m.accessCodeUsed);
    if (allJoined) {
      if (team.deviceId) {
        const Device = (await import('@/models/Device')).default;
        await Device.findByIdAndUpdate(team.deviceId, { status: 'online' });
      }
      if (!team.timer.isActive) {
        team.timer.startTime = new Date();
        team.timer.isActive = true;
      }
    }
    await team.save();

    // Socket events
    try {
      const resAny = res as unknown as NextApiResponseServerIo;
      const io = resAny.socket?.server?.io;
      if (io) {
        io.emit('role-assigned', { teamId: team._id.toString(), username, role: normalizedRole, allJoined, ts: Date.now() });
        if (allJoined) {
          io.emit('team-ready', { teamId: team._id.toString(), ts: Date.now() });
        }
      }
    } catch {}

    return res.status(200).json({ success: true, teamId: team._id.toString(), allJoined });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return res.status(500).json({ error: 'Internal error', detail: msg });
  }
}