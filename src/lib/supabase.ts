// The one connection to Supabase that the whole app shares.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

if (!url || !key) {
  throw new Error('Missing Supabase details. Fill in VITE_SUPABASE_URL and VITE_SUPABASE_KEY in .env.local, then restart npm run dev.')
}

export const supabase = createClient(url, key)
