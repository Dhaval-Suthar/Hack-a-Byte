import handler from '@/pages/api/professor/scan';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Device from '@/models/Device';
import { createMocks } from 'node-mocks-http';
import { cleanupMemoryMongo } from './testMongoMemory';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.setTimeout(30000);

describe('professor scan rate limit', () => {
  let teamId: string; let deviceId: string;
  beforeAll(async () => {
    await connectDb();
    const dev = await Device.create({
      deviceMacAddress:'mac1',
      deviceType:'hackphone',
      status:'online',
      configuration:{
        osVersion:'1.0',
        installedApps:[],
        networkSettings:{ ipAddress:'1.1.1.1', subnet:'255.255.255.0', gateway:'1.1.1.254', dns:[], isNetworkEnabled:true },
        securitySettings:{ firewall:true, antiVirus:true, vulnerabilities:[] }
      }
    });
    await Device.create({
      deviceMacAddress:'mac2',
      deviceType:'hackphone',
      status:'online',
      configuration:{
        osVersion:'1.0',
        installedApps:[],
        networkSettings:{ ipAddress:'1.1.1.2', subnet:'255.255.255.0', gateway:'1.1.1.254', dns:[], isNetworkEnabled:true },
        securitySettings:{ firewall:true, antiVirus:true, vulnerabilities:[] }
      }
    });
    const team = await Team.create({ name:'ProfTeam', description:'p', numberOfPlayers:1, deviceId: dev._id, wallet:{ walletAddress:'wp', privateKey:'kp', bitcoinBalance:0 }, teamMembers:[{ username:'prof', role:'professor', accessCodeUsed:true }] });
    teamId = team._id.toString(); deviceId = dev._id.toString();
  });
  afterAll(async () => { await cleanupMemoryMongo(); });
  it('allows first two scans then rate limits third', async () => {
    for (let i=0;i<2;i++) {
      const { req, res } = createMocks({ method:'POST', body:{ teamId } });
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      expect(res.statusCode).toBe(202);
    }
    const { req, res } = createMocks({ method:'POST', body:{ teamId } });
    await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res.statusCode).toBe(429);
  });
});
