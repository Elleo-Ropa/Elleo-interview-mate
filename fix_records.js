
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opkwygahtuptjptukswm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wa3d5Z2FodHVwdGpwdHVrc3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzUwNjcsImV4cCI6MjA4NTE1MTA2N30.1AxkU4vueGCLm0pHqJvag2k_whhD_MG_WUkDDPq88kI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const namesToFix = ['이재원', '오동욱', '엄지영', '유수민'];

async function fixRecords() {
    console.log('Starting fix for records:', namesToFix);

    for (const name of namesToFix) {
        console.log(`Checking record for: ${name}`);

        // Fetch current record to get the full basic_info object
        const { data: records, error: fetchError } = await supabase
            .from('interview_records')
            .select('id, basic_info')
            .filter('basic_info->>name', 'eq', name);

        if (fetchError) {
            console.error(`Error fetching ${name}:`, fetchError);
            continue;
        }

        if (records && records.length > 0) {
            for (const rec of records) {
                console.log(`Updating record ${rec.id} for ${name}`);
                const updatedBasicInfo = { ...rec.basic_info, interviewType: 'DEPTH' };

                const { error: updateError } = await supabase
                    .from('interview_records')
                    .update({ basic_info: updatedBasicInfo })
                    .eq('id', rec.id);

                if (updateError) {
                    console.error(`Error updating record ${rec.id}:`, updateError);
                } else {
                    console.log(`Successfully updated record ${rec.id}`);
                }
            }
        } else {
            console.log(`No records found for ${name}`);
        }
    }
}

fixRecords();
