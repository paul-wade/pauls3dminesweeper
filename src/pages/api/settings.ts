import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const settingsPath = path.join(process.cwd(), 'settings.json');

  if (req.method === 'GET') {
    try {
      const settings = await fs.readFile(settingsPath, 'utf8');
      res.status(200).json(JSON.parse(settings));
    } catch (error) {
      res.status(500).json({ error: 'Failed to load settings' });
    }
  } else if (req.method === 'POST') {
    try {
      const settings = JSON.parse(req.body);
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
      res.status(200).json({ message: 'Settings saved' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
