export type LightZone = 'high' | 'low' | 'no';
export type WateringInterval = 'every' | 'every-other' | 'every-third' | 'monthly';
export type WindowDirection = 'east' | 'west' | 'north' | 'south' | 'idk';

export interface Cover {
  id: string;
  shopify_customer_id?: string;
  user_name: string;
  plant_name: string;
  photo_url: string;
  light_zone: LightZone;
  gets_natural_light: boolean;
  window_direction?: WindowDirection;
  uses_grow_light: boolean;
  temperature: number;
  humidity: number;
  watering_interval: WateringInterval;
  uses_foliar_feed: boolean;
  nutrients?: string;
  soil_components: string[];
  is_reported: boolean;
  report_count: number;
  is_hidden: boolean;
  created_at: string;
}

export interface CoverInput {
  userName: string;
  plantName: string;
  photo: string; // base64
  lightZone: LightZone;
  getsNaturalLight: boolean;
  windowDirection: WindowDirection;
  usesGrowLight: boolean;
  temperature: number;
  humidity: number;
  wateringInterval: WateringInterval;
  usesFoliarFeed: boolean;
  nutrients: string;
  soilComponents: string[];
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}