/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please check your .env file.');
} else {
    // Hide key in logs for safety but confirm presence
    console.log('Supabase client initialized with URL:', supabaseUrl);

    if (!supabaseAnonKey?.startsWith('eyJ')) {
        console.warn('⚠️ WARNING: Supabase key does not look like a valid JWT (should start with "eyJ"). Check your .env.local file.');
    }
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
