# Deployment Guide (Vercel)

To deploy this application to Vercel, you need to configure the following Environment Variables:

## Required Keys

1. `GEMINI_API_KEY`: Your Google AI SDK key from Google AI Studio.
2. `VITE_SUPABASE_URL`: Your Supabase Project URL.
3. `VITE_SUPABASE_ANON_KEY`: Your Supabase Project Anon Key.

## Deployment Steps

1. Push your code to a GitHub repository.
2. Connect the repository to Vercel.
3. Add the environment variables listed above in the Vercel project settings.
4. Vercel will automatically build and deploy your app.
