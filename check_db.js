
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opkwygahtuptjptukswm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wa3d5Z2FodHVwdGpwdHVrc3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzUwNjcsImV4cCI6MjA4NTE1MTA2N30.1AxkU4vueGCLm0pHqJvag2k_whhD_MG_WUkDDPq88kI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    const { data, error, count } = await supabase
        .from('interview_records')
        .select('*', { count: 'exact', head: false });

    if (error) {
        console.error('Error fetching data:', error);
    } else {
        console.log('Total records found:', data.length);
        console.log('Records:', JSON.stringify(data.map(r => r.basic_info.name)));
    }
}

checkData();
