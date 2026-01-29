import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import { BasicInfo, InterviewRecord, Stage } from '../types';
import { INTERVIEW_STAGES } from '../constants';
import { Button } from './Button';
import { Input } from './Input';
import { saveRecord } from '../services/db';
import { analyzeInterview } from '../services/geminiService';

// Helper to parse bold text (**text**)
const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

// Helper to format AI Summary markdown
const formatAISummary = (text: string) => {
  if (!text) return null;

  const lines = text.split('\n');
  return (
    <div className="space-y-3 text-slate-700 leading-relaxed">
      {lines.map((line, index) => {
        // Handle Headers (###)
        if (line.startsWith('###')) {
          const content = line.replace(/^###\s*/, '');
          return (
            <h3 key={index} className="text-lg font-bold text-elleo-dark mt-6 mb-2">
              {parseBold(content)}
            </h3>
          );
        }

        // Handle List Items (* or -)
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          const content = line.trim().replace(/^[\*\-]\s*/, '');
          return (
            <div key={index} className="flex items-start gap-2 ml-1">
              <span className="text-elleo-purple mt-1.5">•</span>
              <p className="flex-1">{parseBold(content)}</p>
            </div>
          )
        }

        // Handle Horizontal Rule (---)
        if (line.trim() === '---') {
          return <hr key={index} className="my-4 border-slate-200" />;
        }

        // Empty lines
        if (!line.trim()) {
          return <div key={index} className="h-2"></div>;
        }

        // Regular Paragraphs
        return (
          <p key={index} className="text-sm">
            {parseBold(line)}
          </p>
        );
      })}
    </div>
  );
};

interface InterviewFormProps {
  initialData?: InterviewRecord;
  onSave: () => void;
  onCancel: () => void;
}

export const InterviewForm: React.FC<InterviewFormProps> = ({ initialData, onSave, onCancel }) => {
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(initialData?.basicInfo || {
    name: '',
    position: '',
    store: '',
    date: new Date().toISOString().split('T')[0],
    interviewer: ''
  });

  const [answers, setAnswers] = useState<Record<string, string>>(initialData?.answers || {});
  const [resume, setResume] = useState<{ fileName: string, fileData: string } | undefined>(initialData?.resume);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [isAnalyzeLoading, setIsAnalyzeLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>(initialData?.aiSummary || '');
  const [activeStageId, setActiveStageId] = useState<string>(INTERVIEW_STAGES[0].id);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('header-actions'));
  }, []);

  const activeStageIndex = INTERVIEW_STAGES.findIndex(s => s.id === activeStageId);
  const activeStage = INTERVIEW_STAGES[activeStageIndex];

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const toggleQuestion = (questionId: string) => {
    const newSet = new Set(expandedQuestions);
    if (newSet.has(questionId)) {
      newSet.delete(questionId);
    } else {
      newSet.add(questionId);
    }
    setExpandedQuestions(newSet);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResume({
          fileName: file.name,
          fileData: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearResume = () => {
    setResume(undefined);
  };

  // Auto-expand questions that have answers when stage changes
  useEffect(() => {
    const newExpanded = new Set(expandedQuestions);
    activeStage.sections.forEach(section => {
      section.questions.forEach(q => {
        if (answers[q.id]) {
          newExpanded.add(q.id);
        }
      });
    });
    setExpandedQuestions(newExpanded);
  }, [activeStageId]);

  const handleSave = async (shouldClose = false) => {
    if (!basicInfo.name) {
      alert("지원자명을 입력해주세요.");
      return;
    }

    setIsSaveLoading(true);
    try {
      const record: InterviewRecord = {
        id: initialData?.id || uuidv4(),
        basicInfo,
        answers,
        resume,
        aiSummary,
        createdAt: initialData?.createdAt || Date.now()
      };

      await saveRecord(record);

      if (shouldClose) {
        onSave();
      } else {
        alert("임시 저장되었습니다.");
      }
    } catch (error) {
      // Error is already alerted in saveRecord but we catch here too just in case
      console.error(error);
    } finally {
      setIsSaveLoading(false);
    }
  };

  // Scroll to top of stage content when stage changes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Add a small delay to ensure DOM is updated and layout is stable
    const timeoutId = setTimeout(() => {
      const header = document.getElementById('candidate-info-header');
      if (header) {
        const appHeaderHeight = 64;
        // Scroll to just above the sticky header's natural position
        const targetY = Math.max(0, header.offsetTop - appHeaderHeight);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [activeStageId]);

  const handleNextStage = () => {
    if (activeStageIndex < INTERVIEW_STAGES.length - 1) {
      setActiveStageId(INTERVIEW_STAGES[activeStageIndex + 1].id);
    } else {
      // Last stage - Save and Close
      handleSave(true);
    }
  };

  const handlePrevStage = () => {
    if (activeStageIndex > 0) {
      setActiveStageId(INTERVIEW_STAGES[activeStageIndex - 1].id);
    }
  };

  const handleAnalyze = async () => {
    if (!basicInfo.name) {
      alert("분석을 위해 기본 정보를 먼저 입력해주세요.");
      return;
    }

    setIsAnalyzeLoading(true);

    // Create a temporary record for analysis
    const tempRecord: InterviewRecord = {
      id: 'temp',
      basicInfo,
      answers,
      createdAt: Date.now()
    };

    const summary = await analyzeInterview(tempRecord);
    setAiSummary(summary);
    setIsAnalyzeLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

      {/* Basic Info Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-0 mt-6">
        <h2 className="text-xl font-bold text-elleo-dark mb-4 border-b pb-2">기본 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="지원자명"
            value={basicInfo.name}
            onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
            placeholder="홍길동"
          />
          <Input
            label="지원 포지션"
            value={basicInfo.position}
            onChange={e => setBasicInfo({ ...basicInfo, position: e.target.value })}
            placeholder="예: 핫푸드"
          />
          <Input
            label="지원 매장"
            value={basicInfo.store}
            onChange={e => setBasicInfo({ ...basicInfo, store: e.target.value })}
            placeholder="예: Broadway"
          />
          <Input
            label="면접관"
            value={basicInfo.interviewer}
            onChange={e => setBasicInfo({ ...basicInfo, interviewer: e.target.value })}
          />
          <Input
            label="면접일자"
            type="date"
            value={basicInfo.date}
            onChange={e => setBasicInfo({ ...basicInfo, date: e.target.value })}
          />
        </div>

        {/* Resume Upload Section */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">이력서 첨부</label>
          {!resume ? (
            <div className="flex items-center gap-2">
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf,image/*"
                className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-elleo-purple-light file:text-elleo-dark
                      file:transition-all file:duration-200
                      file:cursor-pointer
                      hover:file:bg-slate-800 hover:file:text-elleo-purple hover:file:shadow-md hover:file:-translate-y-0.5
                      py-2 cursor-pointer"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-elleo-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <a href={resume.fileData} download={resume.fileName} className="text-sm font-medium text-elleo-dark hover:text-elleo-purple hover:underline truncate max-w-[200px]">
                  {resume.fileName}
                </a>
              </div>
              <button onClick={clearResume} className="text-slate-400 hover:text-red-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Navigation Header */}
      {/* Removed negative margins to fix alignment issues. This bar now sits precisely within the content width. */}
      {/* Sticky Navigation Header - Candidate Info */}
      <div id="candidate-info-header" className="sticky top-[65px] z-50 bg-slate-50 py-[28px] px-0">
        <div className="bg-white border rounded-xl overflow-hidden relative">
          <div className="bg-white px-6 py-4 border-1 border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="font-bold text-elleo-dark text-xl">{basicInfo.name || '지원자명'}</span>
              <span className="text-slate-300 transform scale-125">|</span>
              <span className="text-slate-600 font-bold text-lg">{basicInfo.position || '지원 포지션'}</span>
              <span className="text-slate-300 transform scale-125">|</span>
              <span className="text-slate-500 font-medium text-lg">{basicInfo.store || '지원 매장'}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono hidden sm:block">
              Interview Mate
            </div>
          </div>
        </div>
      </div>

      {/* Active Stage Form Content */}
      <div className="space-y-8 px-[1px]">
        <div className="bg-white rounded-t-xl shadow-sm border border-slate-200 animate-fadeIn">

          {/* Sticky Tabs Header (Formerly Title) */}
          {/* Offset calculation: AppHeader(64px) + CandidateHeader(approx 116px due to py-7) = ~180px */}
          <div className="sticky top-[183px] z-40 bg-slate-50 -mt-px rounded-t-xl -mx-[0px]">
            <div className="bg-slate-50 px-5 py-4 border border-slate-200 flex items-center justify-between shadow-sm border-t border-x border-slate-200 -mx-[1px] -mb-[0px]">

              {/* Navigation Tabs mapped here */}
              <div className="flex overflow-x-auto gap-2 no-scrollbar w-full">
                {INTERVIEW_STAGES.map((stage, index) => {
                  const isActive = activeStageId === stage.id;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => setActiveStageId(stage.id)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${isActive
                        ? 'bg-elleo-purple text-white border-elleo-purple shadow-sm'
                        : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      {stage.title}
                    </button>
                  );
                })}
              </div>

              {/* Optional Step Counter if space permits (hidden on small screens) */}
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:block ml-4 whitespace-nowrap">
                Step {activeStageIndex + 1}/{INTERVIEW_STAGES.length}
              </span>

            </div>
          </div>

          <div className="p-6 space-y-8">
            {activeStage.sections.map(section => (
              <div key={section.id}>
                <h4 className="text-md font-semibold text-elleo-dark mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-elleo-purple rounded-full inline-block"></span>
                  {section.title}
                </h4>
                <div className="space-y-6">
                  {section.questions.map(q => {
                    const isExpanded = expandedQuestions.has(q.id);
                    const hasAnswer = !!answers[q.id];

                    return (
                      <div key={q.id} className={`bg-slate-50 rounded-lg border transition-all duration-200 ${isExpanded ? 'border-elleo-purple ring-1 ring-elleo-purple/30 shadow-sm' : (hasAnswer ? 'border-elleo-purple' : 'border-slate-100 hover:border-elleo-purple/30')}`}>
                        <div
                          className="p-4 cursor-pointer flex justify-between items-start gap-4"
                          onClick={() => toggleQuestion(q.id)}
                        >
                          <div className="flex-1 flex items-center justify-between gap-4">
                            <p className={`font-medium ${isExpanded ? 'text-elleo-dark' : 'text-slate-700'}`}>{q.text}</p>
                            {q.checkpoints && q.checkpoints.length > 0 && (
                              <div className="flex flex-wrap gap-2 flex-shrink-0">
                                {q.checkpoints.map((cp, idx) => (
                                  <span key={idx} className="text-xs bg-[#f5f3ff] text-elleo-purple border border-elleo-purple px-2 py-0.5 rounded-[6px]">
                                    {cp}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-elleo-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 animate-fadeIn">
                            <textarea
                              className="w-full p-3 bg-white border border-slate-300 rounded-md focus:ring-0 focus:border-elleo-purple min-h-[100px] text-sm resize-y placeholder-slate-400 transition-shadow"
                              placeholder="평가 내용을 입력하세요..."
                              value={answers[q.id] || ''}
                              onChange={e => handleAnswerChange(q.id, e.target.value)}
                              autoFocus
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Big Navigation Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-100 mt-8">
              <button
                onClick={handlePrevStage}
                disabled={activeStageIndex === 0}
                className={`py-3 px-4 rounded-xl border font-bold text-slate-600 transition-all ${activeStageIndex === 0
                  ? 'opacity-0 cursor-default'
                  : 'border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                  }`}
              >
                ← 이전 단계
              </button>

              <button
                onClick={handleNextStage}
                className={`py-3 px-4 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${activeStageIndex === INTERVIEW_STAGES.length - 1
                  ? 'bg-elleo-dark hover:bg-slate-800'
                  : 'bg-elleo-purple hover:bg-[#8f8ed3]'
                  }`}
              >
                {activeStageIndex === INTERVIEW_STAGES.length - 1 ? (
                  <>작성 완료 (저장) <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></>
                ) : (
                  <>다음 단계로 이동 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-elleo-purple/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-elleo-purple-light p-2 rounded-lg">
              <svg className="w-6 h-6 text-elleo-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-elleo-dark">AI 면접 분석</h3>
          </div>
          <Button variant="secondary" onClick={handleAnalyze} isLoading={isAnalyzeLoading} className="text-elleo-dark border-elleo-purple hover:bg-elleo-purple-light">
            {aiSummary ? '다시 분석하기' : 'AI 분석 생성'}
          </Button>
        </div>

        {aiSummary ? (
          <div className="bg-slate-50 rounded-lg p-6 text-sm text-slate-700 border border-slate-200">
            {formatAISummary(aiSummary)}
          </div>
        ) : (
          <div className="text-center py-32 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
            모든 질문에 답한 후 AI 분석을 실행하여 요약을 확인하세요.
          </div>
        )}
      </div>

      {/* Global Bottom Actions (Backup) */}
      {/* Global Bottom Actions (Backup) */}
      {/* Global Header Actions via Portal */}
      {portalTarget && createPortal(
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs sm:text-sm h-9 border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-600 transition-colors"
          >
            나가기
          </Button>
          <Button
            onClick={() => handleSave(false)}
            variant="primary"
            isLoading={isSaveLoading}
            className="px-3 py-1.5 text-xs sm:text-sm bg-elleo-dark hover:bg-[#1a2639] h-9 shadow-sm transition-colors"
          >
            임시 저장
          </Button>
        </div>,
        portalTarget
      )}
    </div>
  );
};