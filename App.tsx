import React, { useState, useEffect } from 'react';
import { ViewState, InterviewRecord, Stage } from './types';
import { InterviewForm } from './components/InterviewForm';
import { InterviewList } from './components/InterviewList';
import { Login } from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { INTERVIEW_STAGES as STANDARD_STAGES } from './constants';
import { INTERVIEW_STAGES as DEPTH_STAGES } from './constants_in-depth';
import { supabase } from './services/supabase';

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [view, setView] = useState<ViewState>('LIST');
  const [selectedRecord, setSelectedRecord] = useState<InterviewRecord | undefined>(undefined);
  const [currentStages, setCurrentStages] = useState<Stage[]>(STANDARD_STAGES);
  const [currentInterviewType, setCurrentInterviewType] = useState<'STANDARD' | 'DEPTH'>('STANDARD');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchRole = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (data) setUserRole(data.role);
      };
      fetchRole();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Loading Elleo Interview Mate...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleNewInterview = (type: 'STANDARD' | 'DEPTH') => {
    setSelectedRecord(undefined);
    setCurrentInterviewType(type);
    setCurrentStages(type === 'STANDARD' ? STANDARD_STAGES : DEPTH_STAGES);
    setView('FORM');
  };

  const handleEditInterview = async (partialRecord: InterviewRecord) => {
    const type = partialRecord.basicInfo.interviewType || 'STANDARD';
    setCurrentInterviewType(type);
    setCurrentStages(type === 'STANDARD' ? STANDARD_STAGES : DEPTH_STAGES);

    try {
      const { getRecordById } = await import('./services/db');
      const fullRecord = await getRecordById(partialRecord.id);

      if (fullRecord) {
        setSelectedRecord(fullRecord);
      } else {
        alert('기록을 불러올 수 없습니다.');
        return;
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer gap-3" onClick={() => setView('LIST')}>
              <img
                src="https://www.sushia.com.au/wp-content/uploads/2026/01/Elleo-Group-Logo-B.svg"
                alt="Elleo Group Logo"
                className="h-8 w-auto object-contain transition-transform hover:scale-105"
              />
              <span className="text-lg font-bold text-slate-800 border-l border-slate-300 pl-3 hidden sm:block">
                Interview Mate
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Profile Badge - Toggles Logout Dropdown */}
              <div className="relative z-50">
                <button
                  onClick={() => setShowLogout(!showLogout)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${showLogout
                      ? 'bg-white border-indigo-200 shadow-md ring-2 ring-indigo-50'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${showLogout ? 'bg-indigo-600 shadow-inner' : 'bg-indigo-100'
                    }`}>
                    <span className={`text-[10px] font-bold ${showLogout ? 'text-white' : 'text-indigo-700'
                      }`}>
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-700 leading-tight">
                      {user.email?.split('@')[0]}
                    </span>
                    {userRole && (
                      <span className={`text-[9px] uppercase tracking-wider font-bold ${userRole === 'admin' ? 'text-rose-600' : 'text-indigo-600'
                        }`}>
                        {userRole}
                      </span>
                    )}
                  </div>
                  <svg className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${showLogout ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showLogout && (
                  <div className="absolute left-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
                    <div className="p-1">
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors group"
                      >
                        <div className="w-7 h-7 bg-rose-100 rounded-md flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons (New Interview) */}
              <div id="header-actions" className="flex items-center gap-3">
                {/* Portals will render here */}
              </div>
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;