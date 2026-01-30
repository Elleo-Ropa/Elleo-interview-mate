import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { InterviewRecord } from '../types';
import { getRecords, deleteRecord } from '../services/db';
import { Button } from './Button';
import { Input } from './Input';

const getInitial = (name: string): string => {
  if (!name) return '';
  const char = name.charAt(0);
  const code = char.charCodeAt(0);

  // Korean Hangul Syllables
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const initialOffset = Math.floor((code - 0xAC00) / 588);
    const initials = [
      'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ];
    const initial = initials[initialOffset];
    const map: Record<string, string> = {
      'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ'
    };
    return map[initial] || initial;
  }

  // English
  if (/[a-zA-Z]/.test(char)) {
    return char.toUpperCase();
  }

  return 'Other';
};

interface InterviewListProps {
  onNew: (type: 'STANDARD' | 'DEPTH') => void;
  onEdit: (record: InterviewRecord) => void;
}

export const InterviewList: React.FC<InterviewListProps> = ({ onNew, onEdit }) => {
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('header-actions'));
  }, []);

  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);
      const data = await getRecords();
      setRecords(data);
      setLoading(false);
    };
    loadRecords();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('정말로 이 기록을 삭제하시겠습니까?')) {
      try {
        await deleteRecord(id);
        setRecords(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const filteredRecords = records.filter(r => {
    const term = searchTerm.toLowerCase();
    // Smart Search: Split by space and check if EVERY keyword matches
    const keywords = term.split(/\s+/).filter(Boolean);
    if (keywords.length === 0) return true;

    // Helper check function for a single keyword
    const checkKeyword = (keyword: string) => {
      // Check if keyword matches the initial (for single char search)
      const initial = getInitial(r.basicInfo.name).toLowerCase();
      const matchesInitial = keyword.length === 1 && initial === keyword;

      return matchesInitial ||
        r.basicInfo.name.toLowerCase().includes(keyword) ||
        r.basicInfo.position.toLowerCase().includes(keyword) ||
        (r.basicInfo.store && r.basicInfo.store.toLowerCase().includes(keyword)) ||
        (r.basicInfo.date && r.basicInfo.date.includes(keyword)) || // Support date search
        Object.values(r.answers).some((answer: string) => answer.toLowerCase().includes(keyword));
    };

    return keywords.every(checkKeyword);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-center gap-3 mb-12">
        <h1 className="text-2xl font-bold text-elleo-dark">면접 기록 DB</h1>
        <p className="text-slate-500 pb-0.5">저장된 인터뷰 평가서를 검색하고 관리하세요.</p>
      </div>

      {portalTarget && createPortal(
        <div className="flex gap-2">
          <Button onClick={() => onNew('STANDARD')} variant="purple" className="shadow-sm hover:bg-elleo-dark hover:text-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ease-out">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            새 인터뷰 작성
          </Button>
          <Button onClick={() => onNew('DEPTH')} className="shadow-sm bg-elleo-dark hover:bg-elleo-purple text-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ease-out">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            심층 인터뷰 작성
          </Button>
        </div>,
        portalTarget
      )}

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 bg-white border-[3px] border-elleo-purple rounded-xl leading-5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-elleo-purple/20 sm:text-sm shadow-sm transition-shadow"
          placeholder="지원자명, 포지션, 매장, 내용 검색... (초성 검색 가능: ㄱ, ㄴ, A...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 border-4 border-elleo-purple/30 border-t-elleo-purple rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">기록을 불러오는 중입니다...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-slate-500 text-lg">기록된 인터뷰가 없습니다.</p>
          <p className="text-slate-400 text-sm">새 인터뷰 작성을 눌러 시작하세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {filteredRecords.map(record => {
            const isDeep = record.basicInfo.interviewType === 'DEPTH';
            return (
              <div
                key={record.id}
                onClick={() => onEdit(record)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-elleo-purple transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-elleo-dark transition-colors mb-1">{record.basicInfo.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium border border-elleo-purple text-elleo-purple">
                        {record.basicInfo.position || '지원 포지션'}
                      </span>
                      {isDeep && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-elleo-purple text-white">
                          심층
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(record.id, e)}
                    className="text-slate-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {record.basicInfo.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {record.basicInfo.store}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    답변 {Object.keys(record.answers).filter(k =>
                      record.answers[k] &&
                      !k.startsWith('notice-') &&
                      !k.startsWith('consent-')
                    ).length}개
                  </span>
                  {record.aiSummary && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-elleo-dark bg-elleo-purple-light px-2 py-1 rounded">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      AI 분석됨
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )
      }
    </div >
  );
};