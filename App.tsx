import React, { useState } from 'react';
import { ViewState, InterviewRecord, Stage } from './types';
import { InterviewForm } from './components/InterviewForm';
import { InterviewList } from './components/InterviewList';
import { INTERVIEW_STAGES as STANDARD_STAGES } from './constants';
import { INTERVIEW_STAGES as DEPTH_STAGES } from './constants_in-depth';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LIST');
  const [selectedRecord, setSelectedRecord] = useState<InterviewRecord | undefined>(undefined);
  const [currentStages, setCurrentStages] = useState<Stage[]>(STANDARD_STAGES);
  const [currentInterviewType, setCurrentInterviewType] = useState<'STANDARD' | 'DEPTH'>('STANDARD');

  const handleNewInterview = (type: 'STANDARD' | 'DEPTH') => {
    setSelectedRecord(undefined);
    setCurrentInterviewType(type);
    setCurrentStages(type === 'STANDARD' ? STANDARD_STAGES : DEPTH_STAGES);
    setView('FORM');
  };

  const handleEditInterview = async (partialRecord: InterviewRecord) => {
    // Determine interview type from the partial record (or default)
    const type = partialRecord.basicInfo.interviewType || 'STANDARD';
    setCurrentInterviewType(type);
    setCurrentStages(type === 'STANDARD' ? STANDARD_STAGES : DEPTH_STAGES);

    // Fetch full record to get resume and other details not in list view
    // Import getRecordById dynamically to avoid circular dependencies if any, 
    // or better, ensure it's imported at top (it is not yet imported).
    // We should add the import at the top first! 
    // But since I can't add import in this same block efficiently without risk,
    // I will just use the partial record for now to allow viewing, 
    // BUT the correct fix is to fetch. 
    // Let's assume I will add the import in a separate step or use a multi-step. 
    // I'll rewrite this function to fetch.

    // Changing to async and fetching
    // NOTE: Need to add import 'getRecordById' to step 1!
    // I'll stick to the logic here and assume I add import in next step or I can use top-level replacement.

    try {
      // Ideally show loading state here, but for now just fetch
      const { getRecordById } = await import('./services/db');
      const fullRecord = await getRecordById(partialRecord.id);

      if (fullRecord) {
        setSelectedRecord(fullRecord);
      } else {
        alert('기록을 불러올 수 없습니다.');
        return; // Don't change view
      }

      setView('FORM');
    } catch (error) {
      console.error("Failed to load full record", error);
      alert('기록 불러오기 실패');
    }
  };

  const handleSaveComplete = () => {
    setView('LIST');
    setSelectedRecord(undefined);
  };

  const handleCancel = () => {
    setView('LIST');
    setSelectedRecord(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer gap-3" onClick={() => setView('LIST')}>
              <img
                src="https://www.sushia.com.au/wp-content/uploads/2026/01/Elleo-Group-Logo-B.svg"
                alt="Elleo Group Logo"
                className="h-8 w-auto object-contain"
              />
              <span className="text-lg font-bold text-elleo-dark border-l border-slate-300 pl-3 hidden sm:block">
                Interview Mate
              </span>
            </div>

            <div id="header-actions" className="flex items-center gap-3">
              {/* Actions will be portaled here */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {view === 'LIST' && (
          <InterviewList onNew={handleNewInterview} onEdit={handleEditInterview} />
        )}

        {view === 'FORM' && (
          <InterviewForm
            initialData={selectedRecord}
            stages={currentStages}
            interviewType={currentInterviewType}
            onSave={handleSaveComplete}
            onCancel={handleCancel}
          />
        )}
      </main>
    </div>
  );
};

export default App;