export const config = {
  appName: "MarketChatter",
  isDev: process.env.NODE_ENV !== "production",
  // Supabase is optional for now; used mainly for future auth/assets.
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

