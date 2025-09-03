import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Sponsor from '@/models/Sponsor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDb();

    const sponsors = await Sponsor.find({ isActive: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: sponsors,
      message: 'Sponsors retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sponsors'
    });
  }
}
