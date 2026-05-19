import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lwktorbjthgsctkctumd.supabase.co'
const supabaseKey = 'sb_publishable_FOm-X9z0yJ40aLrYjYrRJw_r0pLHGwI'

export const supabase = createClient(supabaseUrl, supabaseKey)