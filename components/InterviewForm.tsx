import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import { BasicInfo, InterviewRecord, Stage } from '../types';
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
  stages: Stage[];
  interviewType?: 'STANDARD' | 'DEPTH';
  onSave: () => void;
  onCancel: () => void;
}

export const InterviewForm: React.FC<InterviewFormProps> = ({ initialData, stages, interviewType = 'STANDARD', onSave, onCancel }) => {
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: initialData?.basicInfo?.name || '',
    position: initialData?.basicInfo?.position || '',
    store: initialData?.basicInfo?.store || '',
    date: initialData?.basicInfo?.date || new Date().toISOString().split('T')[0],
    interviewer: initialData?.basicInfo?.interviewer || '',
    hasSushiExperience: initialData?.basicInfo?.hasSushiExperience ?? false,
    visaStatus: initialData?.basicInfo?.visaStatus || '',
    visaExpiryDate: initialData?.basicInfo?.visaExpiryDate || '',
    email: initialData?.basicInfo?.email || '',
    mobile: initialData?.basicInfo?.mobile || '',
    birthDate: initialData?.basicInfo?.birthDate || '',
  });

  const [answers, setAnswers] = useState<Record<string, string>>(initialData?.answers || {});
  const [resume, setResume] = useState<{ fileName: string, fileData: string } | undefined>(initialData?.resume);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [isAnalyzeLoading, setIsAnalyzeLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>(initialData?.aiSummary || '');
  const [activeStageId, setActiveStageId] = useState<string>(stages[0].id);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist the record ID for the session. 
  // If initialData exists, use it. Otherwise, generate one new ID and keep it.
  const [recordId] = useState<string>(() => initialData?.id || uuidv4());

  useEffect(() => {
    setPortalTarget(document.getElementById('header-actions'));
  }, []);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const activeStage = stages.find(s => s.id === activeStageId) || stages[0];
  const activeStageIndex = stages.findIndex(s => s.id === activeStage.id);

  // Auto-focus next question when Tab is pressed
  useEffect(() => {
    if (pendingFocusId) {
      // Small delay to allow animation and DOM insertion
      const timeoutId = setTimeout(() => {
        const el = document.getElementById(`textarea-${pendingFocusId}`);
        if (el) {
          el.focus();
        }
        setPendingFocusId(null);
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [pendingFocusId, expandedQuestions]);

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
      section.questions?.forEach(q => {
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
        id: recordId, // Use the persistent ID
        basicInfo: {
          ...basicInfo,
          interviewType: (interviewType as 'STANDARD' | 'DEPTH') || 'STANDARD'
        },
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
  const prevStageIdRef = useRef(activeStageId);
  useEffect(() => {
    if (prevStageIdRef.current !== activeStageId) {
      prevStageIdRef.current = activeStageId;

      // Add a small delay to ensure DOM is updated and layout is stable
      const timeoutId = setTimeout(() => {
        const content = document.getElementById('active-stage-content');
        if (content) {
          const contentTop = content.getBoundingClientRect().top + window.scrollY;
          // Scroll so the content card starts exactly where the tabs sticky header is (183px offset)
          window.scrollTo({ top: contentTop - 183, behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [activeStageId]);

  const handleNextStage = () => {
    if (activeStageIndex < stages.length - 1) {
      setActiveStageId(stages[activeStageIndex + 1].id);
    } else {
      // Last stage - Save and Close
      handleSave(true);
    }
  };

  const handlePrevStage = () => {
    if (activeStageIndex > 0) {
      setActiveStageId(stages[activeStageIndex - 1].id);
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

    // Auto-save the record with the new summary
    const updatedRecord: InterviewRecord = {
      ...tempRecord,
      aiSummary: summary,
      id: recordId, // Ensure we use the persistent ID
      basicInfo: {
        ...tempRecord.basicInfo,
        interviewType: (interviewType as 'STANDARD' | 'DEPTH') || 'STANDARD'
      }
    };

    try {
      await saveRecord(updatedRecord);
      // Optional: alert or toast? "AI Analysis Saved"
    } catch (e) {
      console.error("Failed to auto-save AI summary", e);
    }

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
          />
          <Input
            label="이메일"
            type="email"
            value={basicInfo.email || ''}
            onChange={e => setBasicInfo({ ...basicInfo, email: e.target.value })}
          />
          <Input
            label="연락처 (Mobile)"
            value={basicInfo.mobile || ''}
            onChange={e => setBasicInfo({ ...basicInfo, mobile: e.target.value })}
          />
          <Input
            label="생년월일"
            type="date"
            value={basicInfo.birthDate || ''}
            onChange={e => setBasicInfo({ ...basicInfo, birthDate: e.target.value })}
          />
          <div className="flex flex-col gap-1">
            <label className="block text-sm font-bold text-slate-700">비자 상태</label>
            <select
              value={basicInfo.visaStatus || ''}
              onChange={e => setBasicInfo({ ...basicInfo, visaStatus: e.target.value })}
              className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-elleo-purple/20 focus:border-elleo-purple text-sm transition-shadow h-[42px]"
            >
              <option value="" disabled>Select status...</option>
              <option value="Australian Citizen">Australian Citizen</option>
              <option value="Permanent Resident">Permanent Resident</option>
              <option value="Partner / De facto">Partner / De facto</option>
              <option value="International Student">International Student</option>
              <option value="Working Holiday">Working Holiday</option>
              <option value="Temporary Skill Shortage (TSS)">Temporary Skill Shortage (TSS)</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <Input
            label="비자 만료일"
            type="date"
            value={basicInfo.visaExpiryDate || ''}
            onChange={e => setBasicInfo({ ...basicInfo, visaExpiryDate: e.target.value })}
            disabled={basicInfo.visaStatus === 'Australian Citizen' || basicInfo.visaStatus === 'Permanent Resident'}
          />

          {/* Divider */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 my-2 border-b border-slate-200 border-dashed" />

          <Input
            label="지원 포지션"
            value={basicInfo.position}
            onChange={e => setBasicInfo({ ...basicInfo, position: e.target.value })}
          />
          <Input
            label="지원 매장"
            value={basicInfo.store}
            onChange={e => setBasicInfo({ ...basicInfo, store: e.target.value })}
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
          {interviewType !== 'DEPTH' && (
            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer py-2 px-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors h-[42px]">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-elleo-purple border-slate-300 rounded focus:ring-elleo-purple accent-elleo-purple"
                  checked={basicInfo.hasSushiExperience}
                  onChange={e => setBasicInfo({ ...basicInfo, hasSushiExperience: e.target.checked })}
                />
                <span className="text-sm font-bold text-slate-700">스시 경력 유무</span>
              </label>
            </div>
          )}
        </div>

        {/* Resume Upload Section */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">이력서 첨부</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf,image/*"
            className="hidden"
          />
          {!resume ? (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-6 rounded-full border-0 text-sm font-semibold bg-elleo-purple-light text-elleo-dark transition-all duration-200 cursor-pointer hover:bg-slate-800 hover:text-elleo-purple hover:shadow-md hover:-translate-y-0.5"
              >
                Choose file
              </button>
              <span className="text-sm text-slate-300 select-none cursor-default pointer-events-none">
                No file chosen
              </span>
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
      <div className="space-y-8 px-[1px] mb-8 relative z-0">
        <div id="active-stage-content" className="bg-white rounded-t-xl shadow-sm border border-slate-200 animate-fadeIn min-h-[500px]">

          {/* Sticky Tabs Header (Formerly Title) */}
          {/* Offset calculation: AppHeader(64px) + CandidateHeader(approx 116px due to py-7) = ~180px */}
          <div className="sticky top-[183px] z-40 bg-slate-50 -mt-px rounded-t-xl -mx-[0px]">
            <div className="bg-slate-50 px-5 py-4 border border-slate-200 shadow-sm border-t border-x border-slate-200 -mx-[1px] -mb-[0px]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  {/* Navigation Tabs mapped here */}
                  <div className="flex overflow-x-auto gap-2 no-scrollbar w-full">
                    {stages.map((stage, index) => {
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
                    Step {activeStageIndex + 1}/{stages.length}
                  </span>
                </div>

                {activeStage.description && (
                  <div className="flex items-center justify-between gap-4 min-h-[32px]">
                    <p className="text-[13px] text-slate-500 font-medium pl-1 animate-fadeIn">
                      {activeStage.description}
                    </p>
                    {activeStage.id === 'stage2' && (
                      <button
                        onClick={() => setBasicInfo(prev => ({ ...prev, hasSushiExperience: !prev.hasSushiExperience }))}
                        className={`text-[11px] px-2 py-1 rounded-md border transition-all ${basicInfo.hasSushiExperience
                          ? 'bg-elleo-purple/10 border-elleo-purple text-elleo-purple font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}
                      >
                        {basicInfo.hasSushiExperience ? '✓ 경력 질문 활성화됨' : '+ 경력 질문 보기'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {(activeStage?.sections || [])
              .filter(section => {
                if (!section.condition) return true;
                const cond = section.condition.trim();
                if (cond === '') return true;
                if (cond === 'hasSushiExperience === true') return basicInfo.hasSushiExperience === true;
                if (cond === 'hasSushiExperience === false') return basicInfo.hasSushiExperience === false;
                return true;
              })
              .map(section => (
                <div key={section.id}>
                  {section.title && (
                    <div className="flex items-center gap-3 mb-5 border-l-[3px] border-elleo-purple pl-3 py-1 bg-slate-50/50 rounded-r-lg">
                      <h4 className="text-[15px] font-bold text-elleo-dark tracking-tight leading-none">
                        {section.title}
                      </h4>
                    </div>
                  )}
                  <div className="space-y-6">
                    {/* Render Notices as a Checklist */}
                    {section.notices && section.notices.length > 0 && (
                      <div className="bg-[#f8f7ff] border border-elleo-purple/20 rounded-lg p-5 space-y-4">
                        <div className="space-y-3">
                          {section.notices.map((notice, idx) => {
                            const noticeKey = `notice-${section.id}-${idx}`;
                            const isChecked = answers[noticeKey] === 'true';
                            return (
                              <label
                                key={idx}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isChecked ? 'bg-white border-elleo-purple shadow-sm' : 'bg-white/50 border-slate-100 hover:border-elleo-purple/20'
                                  }`}
                              >
                                <div className="mt-0.5">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 text-elleo-purple border-slate-300 rounded focus:ring-elleo-purple accent-elleo-purple"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const newValue = e.target.checked ? 'true' : 'false';
                                      setAnswers(prev => {
                                        const next = { ...prev, [noticeKey]: newValue };
                                        // If unchecking any notice, also uncheck the main consent
                                        if (!e.target.checked) {
                                          next[`consent-${section.id}`] = 'false';
                                        }
                                        return next;
                                      });
                                    }}
                                  />
                                </div>
                                <p className={`text-sm leading-relaxed ${isChecked ? 'text-elleo-dark font-bold' : 'text-slate-600'}`}>
                                  {notice}
                                </p>
                              </label>
                            );
                          })}
                        </div>

                        {section.requireConsent && (
                          <div className="pt-4 mt-2 border-t border-elleo-purple/10">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  id={`consent-${section.id}`}
                                  className="peer w-5 h-5 text-elleo-purple border-slate-300 rounded focus:ring-elleo-purple accent-elleo-purple"
                                  checked={answers[`consent-${section.id}`] === 'true'}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setAnswers(prev => {
                                      const next = { ...prev, [`consent-${section.id}`]: isChecked ? 'true' : 'false' };
                                      // If checking the main consent, check all notices
                                      if (isChecked && section.notices) {
                                        section.notices.forEach((_, idx) => {
                                          next[`notice-${section.id}-${idx}`] = 'true';
                                        });
                                      } else if (!isChecked && section.notices) {
                                        // Optional: Uncheck all if main is unchecked
                                        section.notices.forEach((_, idx) => {
                                          next[`notice-${section.id}-${idx}`] = 'false';
                                        });
                                      }
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                              <span className="text-sm font-bold text-elleo-dark group-hover:text-elleo-purple transition-colors">
                                지원자에게 위 모든 고지사항을 안내하고 최종 동의를 확인했습니다.
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Render Questions if they exist */}
                    {section.questions?.map(q => {
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
                                id={`textarea-${q.id}`}
                                name={`answer-${q.id}`}
                                className="w-full p-3 bg-white border border-slate-300 rounded-md focus:ring-0 focus:border-elleo-purple min-h-[100px] text-sm resize-y placeholder-slate-400 transition-shadow"
                                placeholder="평가 내용을 입력하세요..."
                                value={answers[q.id] || ''}
                                autoComplete="off"
                                spellCheck={false}
                                // @ts-ignore
                                autoCorrect="off"
                                onChange={e => handleAnswerChange(q.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Tab') {
                                    e.preventDefault(); // Stop browser default immediately

                                    // Detect all visible questions to find next/prev
                                    const visibleQuestions = (activeStage?.sections || [])
                                      .filter(section => {
                                        if (!section.condition) return true;
                                        const cond = section.condition.trim();
                                        if (cond === '') return true;
                                        if (cond === 'hasSushiExperience === true') return basicInfo.hasSushiExperience === true;
                                        if (cond === 'hasSushiExperience === false') return basicInfo.hasSushiExperience === false;
                                        return true;
                                      })
                                      .flatMap(s => s.questions || []);

                                    const currentIndex = visibleQuestions.findIndex(vq => vq.id === q.id);

                                    if (!e.shiftKey && currentIndex < visibleQuestions.length - 1) {
                                      const nextId = visibleQuestions[currentIndex + 1].id;
                                      setExpandedQuestions(prev => new Set(prev).add(nextId));
                                      setPendingFocusId(nextId);
                                    } else if (e.shiftKey && currentIndex > 0) {
                                      const prevId = visibleQuestions[currentIndex - 1].id;
                                      setExpandedQuestions(prev => new Set(prev).add(prevId));
                                      setPendingFocusId(prevId);
                                    }
                                  }
                                }}
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
                className={`py-3 px-4 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${activeStageIndex === stages.length - 1
                  ? 'bg-elleo-dark hover:bg-slate-800'
                  : 'bg-elleo-purple hover:bg-[#8f8ed3]'
                  }`}
              >
                {activeStageIndex === stages.length - 1 ? (
                  <>작성 완료 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></>
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
      {
        portalTarget && createPortal(
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
        )
      }
    </div >
  );
};