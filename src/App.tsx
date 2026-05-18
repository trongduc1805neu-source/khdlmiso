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
    <div className="h-screen w-full flex flex-col overflow-hidden max-w-[1440px] mx-auto md:max-w-none relative z-0">
      <header className="h-[80px] md:h-20 bg-[#F0C020] border-b-4 border-ink flex items-center px-4 md:px-8 shrink-0 pt-[env(safe-area-inset-top,16px)] pb-2 relative z-20 shadow-[0px_4px_0px_0px_#121212]">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/logo.svg" alt="Logo" className="h-10 md:h-12 w-auto mt-2 scale-125" />
          </div>
          <span className="heading-bauhaus text-xl md:text-2xl tracking-tighter text-ink mt-1">
            {selectedChapter ? (
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
        <aside className="w-80 lg:w-96 border-r-4 border-ink p-6 lg:p-8 flex flex-col shrink-0 hidden md:flex overflow-hidden relative z-10 bg-white">
          <div className="flex flex-col gap-4 mb-8 shrink-0">
            <button 
              onClick={() => setIsExamModalOpen(true)}
              className="btn-primary w-full py-4 px-4 flex items-center justify-center gap-2"
            >
              <Dices strokeWidth={3} className="w-6 h-6" />
              <span className="text-sm lg:text-base mt-1 tracking-wider uppercase font-bold">TẠO ĐỀ THI LỚN</span>
            </button>
            <button 
              onClick={handleReviewWrongQuestions}
              className="btn-secondary w-full py-4 px-4 flex items-center justify-center gap-2"
            >
              <Target strokeWidth={3} className="w-6 h-6" />
              <span className="text-sm lg:text-base mt-1 tracking-wider uppercase font-bold">ÔN LẠI CÂU SAI</span>
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
                  <div className="mb-10 w-full relative">
                    <div className="card-bauhaus p-2 bg-white flex justify-center">
                      <img src="/VietQr-.png?v=1" alt="Donate QR" className="w-[80%] max-w-[280px] h-auto object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4 mb-10 mt-6">
                    <button 
                      onClick={() => setIsExamModalOpen(true)}
                      className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                    >
                      <Dices strokeWidth={3} className="w-6 h-6" />
                      <span className="text-base mt-1 tracking-wider uppercase font-bold">TẠO ĐỀ THI LỚN</span>
                    </button>
                    <button 
                      onClick={handleReviewWrongQuestions}
                      className="btn-secondary w-full py-4 flex items-center justify-center gap-2"
                    >
                      <Target strokeWidth={3} className="w-6 h-6" />
                      <span className="text-base mt-1 tracking-wider uppercase font-bold">ÔN LẠI CÂU SAI</span>
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
                      <img src="/VietQr-.png?v=1" alt="Donate QR" className="w-full h-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
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
