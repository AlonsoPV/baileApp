# BaileApp Web - Mobile Test

## Environment Variables

Create a `.env` file in the `apps/web` directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

This project is configured to deploy to Vercel. Make sure to set the environment variables in your Vercel dashboard:

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add the following variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
