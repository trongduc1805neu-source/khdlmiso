/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ChapterList from './components/ChapterList';
import Quiz from './components/Quiz';
import ExamBuilderModal from './components/ExamBuilderModal';
import PracticeSelectionModal from './components/PracticeSelectionModal';
import { Chapter } from './types';
import questionsData from './data/questions.json';
import { Info, Dices, Target, FileText, X } from 'lucide-react';
import { generatePracticeExam, generateTopicPractice, generateSpecificExam } from './utils/examGenerator';

export default function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);

  useEffect(() => {
    // Assert the typing of imported JSON
    const typedData = questionsData as Chapter[];
    const processedData = typedData.map(ch => ({
      ...ch,
      questions: ch.questions.map(q => ({
        ...q,
        chapterId: ch.chapter
      }))
    }));
    setChapters(processedData);
  }, []);

  const handleStartExam = (examChapter: Chapter) => {
    setIsExamModalOpen(false);
    setSelectedChapter(examChapter);
  };

  const handleStartPracticeExam = () => {
    setIsAuthModalOpen(true);
  };

  const handleGenerateExamAction = (type: 'de1' | 'de2' | 'random') => {
    let practiceExam;
    if (type === 'random') {
      practiceExam = generatePracticeExam();
    } else {
      practiceExam = generateSpecificExam(type);
    }
    setSelectedChapter(practiceExam);
  };

  const handleSelectTopicAction = (topicId: string) => {
    const topicExam = generateTopicPractice(topicId);
    setSelectedChapter(topicExam);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden max-w-[1440px] mx-auto md:max-w-none relative z-0">
      <header className="h-[80px] md:h-20 bg-[#F0C020] border-b-4 border-ink flex items-center px-4 md:px-8 shrink-0 pt-[env(safe-area-inset-top,16px)] pb-2 relative z-20 shadow-[0px_4px_0px_0px_#121212]">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/logo.svg" alt="Logo" className="h-10 md:h-12 w-auto mt-2 scale-125" />
          </div>
          <span className="heading-bauhaus text-xl md:text-2xl tracking-tighter text-ink mt-1">
            {selectedChapter ? (
              selectedChapter.chapter === 1000 ? 'LUYỆN ĐỀ CHUẨN' : 
              selectedChapter.chapter === 2000 ? selectedChapter.chapter_title?.toUpperCase() :
              selectedChapter.chapter === 999 ? 'ĐỀ THI NGẪU NHIÊN' : 
              selectedChapter.chapter === 998 ? 'ÔN LẠI CÂU SAI' : 
              <>
                <span className="truncate">{selectedChapter.chapter_title ? selectedChapter.chapter_title.replace(/^CHƯƠNG\s*\d+[\s:\-.]*/i, '') : ''}</span>
              </>
            ) : 'KHOA HỌC DỮ LIỆU'}
          </span>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        {(!selectedChapter || (selectedChapter.chapter !== 1000 && selectedChapter.chapter !== 2000)) && (
          <aside className="w-80 lg:w-96 border-r-4 border-ink p-6 lg:p-8 flex flex-col shrink-0 hidden md:flex overflow-hidden relative z-10 bg-white">
            <div className="flex flex-col gap-4 mb-8 shrink-0">
              <button 
                onClick={handleStartPracticeExam}
                className="btn-primary w-full py-4 px-4 flex items-center justify-center gap-2 !bg-[#3B82F6] !border-4 !border-ink shadow-[4px_4px_0px_#121212] hover:shadow-[2px_2px_0px_#121212] hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <Target strokeWidth={3} className="w-6 h-6 text-white" />
                <span className="text-sm lg:text-base mt-1 tracking-wider uppercase font-bold text-white">LUYỆN ĐỀ TỔNG HỢP</span>
              </button>
              <button 
                onClick={() => setIsExamModalOpen(true)}
                className="btn-primary w-full py-4 px-4 flex items-center justify-center gap-2"
              >
                <Dices strokeWidth={3} className="w-6 h-6" />
                <span className="text-sm lg:text-base mt-1 tracking-wider uppercase font-bold">TẠO ĐỀ THI TÙY CHỈNH</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-hide">
              <ChapterList 
                chapters={chapters} 
                onSelectChapter={setSelectedChapter} 
                selectedChapter={selectedChapter}
              />
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-canvas">
          {selectedChapter ? (
             <div className="flex-1 overflow-y-auto p-0 sm:p-10 relative">
               <Quiz 
                 chapter={selectedChapter} 
                 onBack={() => setSelectedChapter(null)} 
               />
             </div>
          ) : (
            <>
              {/* Mobile Chapter List View */}
              <div className="flex-1 flex flex-col w-full h-full pt-6 overflow-hidden md:hidden relative z-10 px-4">
                <div className="w-full flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom,20px)+20px)]">
                  <div className="mb-10 w-full flex flex-col items-center justify-center relative group px-2">
                    <div className="card-bauhaus bg-white w-full max-w-sm p-6 shadow-[8px_8px_0px_0px_#121212]">
                      <h3 className="heading-bauhaus text-xl text-center mb-6 text-ink tracking-tight">ỦNG HỘ TÁC GIẢ</h3>
                      <div className="border-4 border-ink p-2 mb-2 bg-[#F0F0F0]">
                        <img src="/VietQr-.png?v=1" alt="Donate QR" className="w-full h-auto object-contain transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4 mb-10 mt-6">
                    <button 
                      onClick={handleStartPracticeExam}
                      className="btn-primary w-full py-4 flex items-center justify-center gap-2 !bg-[#3B82F6] !border-4 !border-ink shadow-[4px_4px_0px_#121212] hover:shadow-[2px_2px_0px_#121212] hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                      <Target strokeWidth={3} className="w-6 h-6 text-white" />
                      <span className="text-base mt-1 tracking-wider uppercase font-bold text-white">LUYỆN ĐỀ TỔNG HỢP</span>
                    </button>
                    <button 
                      onClick={() => setIsExamModalOpen(true)}
                      className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                    >
                      <Dices strokeWidth={3} className="w-6 h-6" />
                      <span className="text-base mt-1 tracking-wider uppercase font-bold">TẠO ĐỀ TÙY CHỈNH</span>
                    </button>
                  </div>
                  
                  <div className="mb-10 space-y-4">
                    <ChapterList 
                      chapters={chapters} 
                      onSelectChapter={setSelectedChapter} 
                      selectedChapter={selectedChapter}
                    />
                  </div>
                </div>
              </div>
              
              {/* Desktop Empty State */}
              <div className="hidden md:flex flex-1 flex-col items-center justify-center relative z-10 px-10">
                {/* Decorative background shapes */}
                <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/20 -z-10"></div>
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary-blue/20 rotate-45 -z-10"></div>

                <div className="flex flex-col items-center justify-center p-6 w-full max-w-lg relative group">
                  <div className="card-bauhaus bg-white w-full p-8 shadow-[12px_12px_0px_0px_#121212]">
                    <div className="w-12 h-12 rounded-full bg-primary absolute -top-6 -right-6 border-4 border-ink z-10 hidden lg:block"></div>
                    <div className="w-12 h-12 bg-primary-blue absolute -bottom-6 -left-6 border-4 border-ink z-10 hidden lg:block rotate-45"></div>
                    <h3 className="heading-bauhaus text-2xl text-center mb-8 text-ink tracking-tight">ỦNG HỘ TÁC GIẢ</h3>
                    <div className="border-4 border-ink p-2 mb-2 bg-[#F0F0F0]">
                      <img src="/VietQr-.png?v=1" alt="Donate QR" className="w-full h-auto object-contain transition-all duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {isExamModalOpen && (
        <ExamBuilderModal 
          chapters={chapters}
          onStartExam={handleStartExam}
          onClose={() => setIsExamModalOpen(false)}
        />
      )}

      <PracticeSelectionModal 
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        onSelectTopic={handleSelectTopicAction}
        onGenerateExam={handleGenerateExamAction}
      />

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
          <div className="bg-white p-8 border-4 border-ink shadow-[8px_8px_0px_0px_#121212] max-w-md w-full relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-ink hover:text-primary transition-colors"
            >
              <X strokeWidth={3} className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-ink mb-6 text-center uppercase tracking-tight">Xác thực hệ thống</h1>
            <p className="text-sm text-charcoal mb-6 text-center">Chức năng Luyện Đề Chuẩn chỉ dành cho thành viên có mã truy cập.</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (password === '18052006') {
                setIsAuthModalOpen(false);
                setIsPracticeModalOpen(true);
                setPassword('');
                setError('');
              } else {
                setError('Mã truy cập không đúng!');
              }
            }} className="flex flex-col gap-4">
              <div>
                <label className="block font-bold text-sm mb-2 text-ink">MÃ TRUY CẬP</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-ink p-3 outline-none focus:bg-surface-soft font-mono"
                  autoFocus
                />
              </div>
              {error && <p className="text-primary font-bold text-sm bg-surface-soft p-2 border-2 border-ink">{error}</p>}
              <button type="submit" className="btn-primary w-full py-3 mt-2 font-bold uppercase tracking-wider">
                Xác Nhận
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
