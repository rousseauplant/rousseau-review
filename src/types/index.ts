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
  hidden: boolean;
  created_at: string;
}

export interface CoverInsert {
  plant_name: string;
  image_url: string;
  light_zone: string;
  watering_interval: string;
  temperature: number;
  humidity: number;
  soil_mix: string;
  foliar_feed: boolean;
  nutrients?: string | null;
  cover_data_url?: string | null;
}

export interface Report {
  id: string;
  cover_id: string;
  reason: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      covers: {
        Row: Cover;
        Insert: CoverInsert;
        Update: Partial<CoverInsert>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at'>;
        Update: Partial<Omit<Report, 'id' | 'created_at'>>;
      };
    };
  };
}
