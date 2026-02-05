import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { coverId } = req.query;
  const { reason } = req.body;

  if (!coverId) {
    return res.status(400).json({ error: 'Cover ID required' });
  }

  // Create report
  const { error: reportError } = await supabase
    .from('reports')
    .insert({ 
      cover_id: coverId as string, 
      reason: reason || 'User reported',
      reporter_ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

  if (reportError) {
    return res.status(500).json({ error: reportError.message });
  }

  // Get current report count
  const { data: cover } = await supabase
    .from('covers')
    .select('report_count')
    .eq('id', coverId)
    .single();

  const newCount = (cover?.report_count || 0) + 1;
  const shouldHide = newCount >= 2;

  // Update cover
  const { error: updateError } = await supabase
    .from('covers')
    .update({
      report_count: newCount,
      is_reported: true,
      is_hidden: shouldHide
    })
    .eq('id', coverId);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  return res.status(200).json({ 
    success: true, 
    hidden: shouldHide,
    reportCount: newCount 
  });
}