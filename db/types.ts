export interface Crop {
  id: number;
  name: string;
  price_per_stem: number;
  created_at: string;
}

export interface Variety {
  id: number;
  crop_id: number;
  name: string;
  price_per_stem: number | null;
  created_at: string;
}

export interface HarvestRecord {
  id: number;
  crop_id: number;
  variety_id: number | null;
  harvest_date: string;
  stems_cut: number;
  stems_wasted: number;
  created_at: string;
}
