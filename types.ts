export interface Question {
  id: string;
  text: string;
  checkpoints: string[];
}

export interface Section {
  id: string;
  title: string;
  questions: Question[];
}

export interface Stage {
  id: string;
  title: string;
  sections: Section[];
}

export interface BasicInfo {
  name: string;
  position: string;
  store: string;
  date: string;
  interviewer: string;
}

export interface InterviewRecord {
  id: string;
  basicInfo: BasicInfo;
  answers: Record<string, string>; // questionId -> memo/evaluation
  resume?: {
    fileName: string;
    fileData: string; // Base64 data url
  };
  aiSummary?: string;
  createdAt: number;
}

export type ViewState = 'LIST' | 'FORM' | 'DETAIL';