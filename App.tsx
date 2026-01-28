import React, { useState } from 'react';
import { ViewState, InterviewRecord } from './types';
import { InterviewForm } from './components/InterviewForm';
import { InterviewList } from './components/InterviewList';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LIST');
  const [selectedRecord, setSelectedRecord] = useState<InterviewRecord | undefined>(undefined);

  const handleNewInterview = () => {
    setSelectedRecord(undefined);
    setView('FORM');
  };

  const handleEditInterview = (record: InterviewRecord) => {
    setSelectedRecord(record);
    setView('FORM');
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
            onSave={handleSaveComplete}
            onCancel={handleCancel}
          />
        )}
      </main>
    </div>
  );
};

export default App;