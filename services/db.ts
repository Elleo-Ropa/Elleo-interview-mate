import { InterviewRecord } from '../types';

const STORAGE_KEY = 'elleo_interview_records_v1';

export const saveRecord = (record: InterviewRecord): void => {
  const existing = getRecords();
  const index = existing.findIndex(r => r.id === record.id);
  
  if (index >= 0) {
    existing[index] = record;
  } else {
    existing.push(record);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};

export const getRecords = (): InterviewRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteRecord = (id: string): void => {
  const existing = getRecords();
  const filtered = existing.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getRecordById = (id: string): InterviewRecord | undefined => {
  const records = getRecords();
  return records.find(r => r.id === id);
};