# Rousseau Review - Plant Cover Generator

A web app for creating and sharing magazine-style plant care covers.

## Features

- Upload plant photos and create magazine covers
- Track growing parameters (light zone, temperature, humidity, feeding schedule)
- Browse community gallery
- Share covers
- Report inappropriate content

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (database)
- Cloudinary (image storage)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with your credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Database Schema

Run this SQL in your Supabase SQL editor:

```sql
create table covers (
  id uuid default gen_random_uuid() primary key,
  plant_name text not null,
  image_url text not null,
  light_zone text not null,
  watering_interval text not null,
  temperature integer not null,
  humidity integer not null,
  soil_mix text not null,
  foliar_feed boolean default false,
  nutrients text,
  cover_data_url text,
  hidden boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table reports (
  id uuid default gen_random_uuid() primary key,
  cover_id uuid references covers(id) on delete cascade not null,
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table covers enable row level security;
alter table reports enable row level security;

-- Allow anonymous read access to non-hidden covers
create policy "Allow anonymous read" on covers
  for select using (hidden = false);

-- Allow anonymous insert
create policy "Allow anonymous insert" on covers
  for insert with check (true);

-- Allow anonymous insert on reports
create policy "Allow anonymous insert" on reports
  for insert with check (true);
```

## Cloudinary Setup

1. Create an unsigned upload preset named `rousseau_covers`
2. Note your cloud name

## Deployment

Deploy to Vercel:
1. Connect your GitHub repo
2. Add environment variables in Vercel dashboard
3. Deploy!
