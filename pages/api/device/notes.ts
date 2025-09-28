import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Device from '@/models/Device';
import { logger } from '@/lib/logger';

interface Note {
  id: number;
  title: string;
  body?: string;
}

/* GET /api/device/notes?deviceMacAddress=<mac>
   Returns the notes for the device
*/

/* POST /api/device/notes
   Body: {
     deviceMacAddress: string,
     notes: Note[]
   }
   Updates the notes for the device
*/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { deviceMacAddress } = req.query as { deviceMacAddress?: string };

    if (!deviceMacAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing deviceMacAddress parameter'
      });
    }

    try {
      await connectDb();

      const device = await Device.findOne({ deviceMacAddress });
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      return res.status(200).json({
        success: true,
        notes: device.notes || []
      });

    } catch (error) {
      logger.error('Error fetching device notes:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        detail: (error as Error).message
      });
    }
  }

  if (req.method === 'POST') {
    const { deviceMacAddress, notes } = req.body as {
      deviceMacAddress?: string;
      notes?: Note[];
    };

    if (!deviceMacAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing deviceMacAddress'
      });
    }

    if (!Array.isArray(notes)) {
      return res.status(400).json({
        success: false,
        error: 'Notes must be an array'
      });
    }

    // Validate notes structure
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      if (!note || typeof note !== 'object') {
        return res.status(400).json({
          success: false,
          error: `Note at index ${i} is not a valid object`
        });
      }
      if (typeof note.id !== 'number') {
        return res.status(400).json({
          success: false,
          error: `Note at index ${i} has invalid id`
        });
      }
      if (typeof note.title !== 'string') {
        return res.status(400).json({
          success: false,
          error: `Note at index ${i} has invalid title`
        });
      }
      if (typeof note.body !== 'string' && note.body !== undefined) {
        return res.status(400).json({
          success: false,
          error: `Note at index ${i} has invalid body`
        });
      }
    }

    try {
      await connectDb();

      const device = await Device.findOne({ deviceMacAddress });
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      device.notes = notes;
      await device.save();

      return res.status(200).json({
        success: true,
        message: 'Device notes updated successfully'
      });

    } catch (error) {
      logger.error('Error updating device notes:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        detail: (error as Error).message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}