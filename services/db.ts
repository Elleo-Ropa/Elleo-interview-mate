import { InterviewRecord } from '../types';
import { supabase } from './supabase';

const TABLE_NAME = 'interview_records';

// Helper to map snake_case from DB to camelCase for App
const mapFromDb = (record: any): InterviewRecord => ({
  id: record.id,
  basicInfo: record.basic_info,
  answers: record.answers,
  resume: record.resume,
  aiSummary: record.ai_summary,
  createdAt: new Date(record.created_at).getTime()
});

// Helper to map camelCase from App to snake_case for DB
const mapToDb = (record: InterviewRecord) => ({
  id: record.id,
  basic_info: record.basicInfo,
  answers: record.answers,
  resume: record.resume,
  ai_summary: record.aiSummary,
  created_at: new Date(record.createdAt).toISOString()
});

export const saveRecord = async (record: InterviewRecord): Promise<void> => {
  console.log('Attempting to save record to Supabase:', record.id);
  const dbRecord = mapToDb(record);
  console.log('Mapped record for DB:', dbRecord);

  // Check for Supabase environment variables before making the call
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = '❌ Supabase 환경 변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 설정되지 않았습니다. .env.local 파일을 확인하고 서버를 재시작해주세요.';
    console.error(errorMsg);
    alert(errorMsg);
    throw new Error(errorMsg);
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert('로그인이 필요합니다.');
    return;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert({ ...dbRecord, user_id: user.id }, { onConflict: 'id' });

  if (error) {
    console.error('❌ Supabase Upsert Error:', error);
    alert(`❌ 저장 실패: ${error.message} (Code: ${error.code})`);
    throw error;
  }
  console.log('✅ Supabase Upsert Success:', data);
};

export const getRecords = async (): Promise<InterviewRecord[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, basic_info, answers, ai_summary, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching records from Supabase:', error);
    return [];
  }

  return (data || []).map(mapFromDb);
};

export const deleteRecord = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting record from Supabase:', error);
    throw error;
  }
};

export const getRecordById = async (id: string): Promise<InterviewRecord | undefined> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching record by ID from Supabase:', error);
    return undefined;
  }

  return data ? mapFromDb(data) : undefined;
};