import { useState, useCallback } from 'react';
import type { Cover, CoverInput } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useCovers() {
  const [covers, setCovers] = useState<Cover[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchCovers = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    
    const newOffset = reset ? 0 : offset;
    
    try {
      const response = await fetch(`${API_URL}/api/covers?offset=${newOffset}&limit=12`);
      if (!response.ok) throw new Error('Failed to fetch covers');
      
      const data = await response.json();
      
      if (reset) {
        setCovers(data);
        setOffset(12);
      } else {
        setCovers(prev => [...prev, ...data]);
        setOffset(newOffset + 12);
      }
      
      setHasMore(data.length === 12);
    } catch (err) {
      setError('Failed to load covers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  const saveCover = useCallback(async (input: CoverInput, shopifyCustomerId?: string): Promise<Cover | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Upload image first
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: input.photo }),
      });
      
      if (!uploadRes.ok) throw new Error('Failed to upload image');
      const { url: photoUrl } = await uploadRes.json();
      
      // Create cover
      const coverRes = await fetch(`${API_URL}/api/covers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopify_customer_id: shopifyCustomerId || null,
          user_name: input.userName,
          plant_name: input.plantName,
          photo_url: photoUrl,
          light_zone: input.lightZone,
          gets_natural_light: input.getsNaturalLight,
          window_direction: input.windowDirection,
          uses_grow_light: input.usesGrowLight,
          temperature: input.temperature,
          humidity: input.humidity,
          watering_interval: input.wateringInterval,
          uses_foliar_feed: input.usesFoliarFeed,
          nutrients: input.nutrients,
          soil_components: input.soilComponents,
        }),
      });
      
      if (!coverRes.ok) throw new Error('Failed to save cover');
      
      const cover = await coverRes.json();
      setCovers(prev => [cover, ...prev]);
      
      return cover;
    } catch (err) {
      setError('Failed to save cover');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const report = useCallback(async (coverId: string, reason?: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/covers/report?coverId=${coverId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) throw new Error('Failed to report');
      
      const result = await response.json();
      
      // Update local state
      if (result.hidden) {
        setCovers(prev => prev.filter(c => c.id !== coverId));
      }
      
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  return {
    covers,
    loading,
    error,
    hasMore,
    fetchCovers,
    saveCover,
    report,
  };
}