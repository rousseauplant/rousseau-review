export interface Cover {
  id: string;
  plant_name: string;
  image_url: string;
  light_zone: string;
  watering_interval: string;
  temperature: number;
  humidity: number;
  soil_mix: string;
  foliar_feed: boolean;
  nutrients: string | null;
  cover_data_url: string | null;
  is_hidden: boolean;
  created_at: string;
}
