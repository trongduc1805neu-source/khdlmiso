/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ChapterList from './components/ChapterList';
import Quiz from './components/Quiz';
import ExamBuilderModal from './components/ExamBuilderModal';
import { Chapter } from './types';
import questionsData from './data/questions.json';
import { Info, Dices, Target } from 'lucide-react';

export default function App() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

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

  const handleReviewWrongQuestions = () => {
    const stored = localStorage.getItem('anki_wrong_questions');
    if (stored) {
      try {
        const wrongQuestions = JSON.parse(stored);
        if (wrongQuestions.length > 0) {
          setSelectedChapter({
            chapter: 998, // Virtual chapter for wrong questions
            chapter_title: 'Ôn Lại Câu Sai',
            questions: wrongQuestions,
          });
        } else {
          alert('Tuyệt vời! Bạn không có câu sai nào cần ôn lại.');
        }
      } catch(e) {
        console.error(e);
        alert('Có lỗi xảy ra khi tải danh sách câu sai.');
      }
    } else {
      alert('Tuyệt vời! Bạn không có câu sai nào cần ôn lại.');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden max-w-[430px] mx-auto md:max-w-none relative z-0">
      <header className="h-[70px] md:h-16 bg-surface border-b-[3px] border-hairline flex items-center justify-center px-4 shrink-0 pt-[env(safe-area-inset-top,16px)] pb-1 relative z-20 shadow-hard md:shadow-none">
        {/* Subtle decorative tape on header */}
        <div className="absolute top-2 left-10 w-16 h-4 bg-black/5 -rotate-2"></div>
        <div className="flex items-center gap-2">
          <span className="heading-hand-drawn text-2xl tracking-tight text-ink md:text-3xl">{selectedChapter ? (selectedChapter.chapter === 999 ? 'Đề Thi Ngẫu Nhiên' : selectedChapter.chapter === 998 ? 'Ôn Lại Câu Sai' : `Chương ${selectedChapter.chapter}`) : 'Trắc Nghiệm Data'}</span>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="w-80 border-r-[3px] border-hairline p-6 flex flex-col shrink-0 hidden md:flex overflow-hidden relative z-10 bg-canvas">
          <h2 className="heading-hand-drawn text-xl text-ink mb-6 shrink-0 rotate-1">Danh sách chương</h2>
          
          <div className="flex flex-col gap-4 mb-6 shrink-0 mt-2">
            <button 
              onClick={() => setIsExamModalOpen(true)}
              className="btn-hand-drawn w-full py-3 px-4 flex items-center justify-center gap-2"
            >
              <Dices strokeWidth={2.5} className="w-5 h-5" />
              <span className="text-xl">Đề thi ngẫu nhiên</span>
            </button>
            <button 
              onClick={handleReviewWrongQuestions}
              className="btn-hand-drawn-secondary w-full py-3 px-4 flex items-center justify-center gap-2"
            >
              <Target strokeWidth={2.5} className="w-5 h-5" />
              <span className="text-xl">Ôn lại câu sai</span>
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

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
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
              <div className="flex-1 flex flex-col w-full h-full pt-6 overflow-hidden md:hidden relative z-10">
                <div className="w-full flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom,20px)+20px)] px-5">
                  <div className="mb-8 flex justify-center w-full relative">
                    {/* Decorative hand-drawn star */}
                    <svg className="absolute -top-4 -right-2 w-10 h-10 text-primary rotate-12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                    
                    <div className="card-hand-drawn p-2 rotate-2 bg-surface">
                      <img src="/VietQr-.png?v=1" alt="Donate QR" className="w-full max-w-[280px] h-auto object-contain mix-blend-multiply opacity-90" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4 mb-8">
                    <button 
                      onClick={() => setIsExamModalOpen(true)}
                      className="btn-hand-drawn w-full py-3 flex items-center justify-center gap-2"
                    >
                      <Dices strokeWidth={2.5} className="w-[20px] h-[20px]" />
                      <span className="text-xl">Tạo cấu trúc đề thi</span>
                    </button>
                    <button 
                      onClick={handleReviewWrongQuestions}
                      className="btn-hand-drawn-secondary w-full py-3 flex items-center justify-center gap-2"
                    >
                      <Target strokeWidth={2.5} className="w-[20px] h-[20px]" />
                      <span className="text-xl">Ôn lại câu sai</span>
                    </button>
                  </div>
                  
                  <div className="heading-hand-drawn text-2xl mb-4 text-ink inline-flex items-center gap-2">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                    Chọn chương
                  </div>

                  <div className="bg-surface border-[3px] border-ink p-3 shadow-hard wobbly-border-md mb-10">
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
                <div className="flex items-center justify-center p-6 w-full max-w-md relative hover:rotate-1 transition-transform">
                  {/* Decorative curved arrow pointing to QR */}
                  <svg className="absolute -left-12 -top-10 w-24 h-24 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4 Q 4 16 16 16" />
                    <path d="M12 12 l 4 4 l -4 4" />
                  </svg>
                  
                  <div className="relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary border-[3px] border-ink z-10 shadow-hard"></div>
                    <div className="card-hand-drawn p-6 bg-surface rotate-2">
                      <h3 className="heading-hand-drawn text-2xl text-center mb-4 text-ink">Ủng hộ tác giả 💖</h3>
                      <img src="/VietQr-.png?v=1" alt="Donate QR" className="w-full max-w-[320px] h-auto object-contain mix-blend-multiply opacity-95" />
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
    </div>
  );
}
