import { createClient } from '@supabase/supabase-js';
import type { Cover } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function createCover(cover: Omit<Cover, 'id' | 'created_at' | 'is_reported' | 'report_count' | 'is_hidden'>): Promise<Cover | null> {
  const { data, error } = await supabase
    .from('covers')
    .insert(cover)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating cover:', error);
    return null;
  }
  
  return data;
}

export async function getCovers(limit = 12, offset = 0): Promise<Cover[]> {
  const { data, error } = await supabase
    .from('covers')
    .select('*')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('Error fetching covers:', error);
    return [];
  }
  
  return data || [];
}

export async function getCoverById(id: string): Promise<Cover | null> {
  const { data, error } = await supabase
    .from('covers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching cover:', error);
    return null;
  }
  
  return data;
}

export async function reportCover(coverId: string, reason?: string): Promise<boolean> {
  // First, create the report record
  const { error: reportError } = await supabase
    .from('reports')
    .insert({ cover_id: coverId, reason: reason || 'User reported' });
  
  if (reportError) {
    console.error('Error creating report:', reportError);
    return false;
  }
  
  // Then, increment report count and check if we should hide
  const { data: cover } = await supabase
    .from('covers')
    .select('report_count')
    .eq('id', coverId)
    .single();
  
  const newCount = (cover?.report_count || 0) + 1;
  const shouldHide = newCount >= 2;
  
  const { error: updateError } = await supabase
    .from('covers')
    .update({
      report_count: newCount,
      is_reported: true,
      is_hidden: shouldHide
    })
    .eq('id', coverId);
  
  if (updateError) {
    console.error('Error updating cover:', updateError);
    return false;
  }
  
  return true;
}

export async function deleteCover(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('covers')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting cover:', error);
    return false;
  }
  
  return true;
}