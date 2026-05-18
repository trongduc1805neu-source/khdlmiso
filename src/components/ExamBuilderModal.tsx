import React, { useState, useEffect } from 'react';
import { Chapter, Question } from '../types';
import { X, Play, Settings2, Dices } from 'lucide-react';

interface Props {
  chapters: Chapter[];
  onStartExam: (examChapter: Chapter) => void;
  onClose: () => void;
}

export default function ExamBuilderModal({ chapters, onStartExam, onClose }: Props) {
  // Default structure: roughly proportional to chapter size, totaling ~40 questions
  const totalTarget = 40;
  const totalAvailable = chapters.reduce((sum, c) => sum + (c.questions?.length || 0), 0);
  
  const [structure, setStructure] = useState<Record<number, number>>({});
  const [timeLimitOption, setTimeLimitOption] = useState<number>(0); // 0 = no limit, otherwise minutes

  useEffect(() => {
    const defaultStruct: Record<number, number> = {};
    let remaining = totalTarget;
    chapters.forEach((c, index) => {
      if (index === chapters.length - 1) {
        defaultStruct[c.chapter] = Math.min(remaining, c.questions?.length || 0);
      } else {
        const count = Math.min(
          Math.max(1, Math.round(( (c.questions?.length || 0) / totalAvailable) * totalTarget)),
          c.questions?.length || 0
        );
        defaultStruct[c.chapter] = count;
        remaining -= count;
      }
    });
    setStructure(defaultStruct);
  }, [chapters]);

  const updateCount = (chapterNumber: number, delta: number) => {
    setStructure(prev => {
      const maxAvailable = chapters.find(c => c.chapter === chapterNumber)?.questions?.length || 0;
      const current = prev[chapterNumber] || 0;
      const next = Math.max(0, Math.min(maxAvailable, current + delta));
      return { ...prev, [chapterNumber]: next };
    });
  };

  const totalSelected = Object.values(structure).reduce((sum: number, count) => sum + (count as number), 0);

  const handleStart = () => {
    let examQuestions: Question[] = [];
    
    chapters.forEach(c => {
      const count = structure[c.chapter] || 0;
      if (count > 0 && c.questions && c.questions.length > 0) {
        // Randomly shuffle and pick 'count' questions
        const shuffled = [...c.questions].sort(() => 0.5 - Math.random());
        examQuestions = [...examQuestions, ...shuffled.slice(0, count)];
      }
    });

    // Shuffle the final combined list
    examQuestions = examQuestions.sort(() => 0.5 - Math.random());

    // Create a virtual chapter for the exam
    const examChapter: Chapter = {
      chapter: 999, // Special ID for exam
      chapter_title: `Đề thi ngẫu nhiên (${examQuestions.length} câu)`,
      timeLimit: timeLimitOption > 0 ? timeLimitOption * 60 : undefined,
      questions: examQuestions
    };

    onStartExam(examChapter);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-white/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-[430px] card-hand-drawn bg-surface shadow-hard-lg flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-400 ease-out rotate-1 p-0.5">
        
        {/* Playful thumbtack top right */}
        <div className="absolute top-2 right-4 w-6 h-6 rounded-full bg-brand-navy border-2 border-ink shadow-hard z-10 hidden sm:block"></div>

        {/* iOS Drag Indicator */}
        <div className="w-full flex justify-center pt-3 pb-2 sm:hidden border-b-[3px] border-dashed border-ink/20">
          <div className="w-16 h-2 bg-ink/40 wobbly-border-sm" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 pt-4 sm:pt-8 border-b-[3px] border-ink shrink-0 bg-surface-soft">
          <div>
            <h2 className="heading-hand-drawn text-3xl text-ink tracking-tight flex items-center gap-2">
              <Dices strokeWidth={2.5} className="w-8 h-8 text-primary" />
              Tạo đề thi 
            </h2>
            <p className="font-sans text-xl text-charcoal mt-1 rotate-1">Tùy chỉnh số lượng câu hỏi</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 wobbly-border border-2 border-transparent hover:border-ink flex items-center justify-center text-ink hover:bg-white active:bg-stone transition-all shrink-0"
          >
            <X strokeWidth={3} className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 CustomScrollbar">
          <div className="flex flex-col gap-4">
            {chapters.map((chapter, index) => {
              const count = structure[chapter.chapter] || 0;
              const maxAvailable = chapter.questions?.length || 0;
              return (
                <div 
                  key={chapter.chapter}
                  className="relative p-4 flex items-center justify-between border-[3px] border-ink bg-white wobbly-border-sm shadow-[2px_2px_0px_#2d2d2d] hover:-translate-y-0.5 transition-transform"
                  style={{ transform: index % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)' }}
                >
                  <div className="flex-1 pr-4">
                    <p className="text-xl font-bold font-sans text-ink leading-tight line-clamp-1">
                      Chương {chapter.chapter}
                    </p>
                    <p className="text-lg text-slate font-sans mt-0.5">
                      Kho: {maxAvailable} câu
                    </p>
                  </div>
                  
                  {/* Stepper */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => updateCount(chapter.chapter, -1)}
                      disabled={count <= 0}
                      className="w-10 h-10 wobbly-border-sm border-2 border-ink bg-surface-soft flex items-center justify-center text-ink disabled:opacity-40 disabled:bg-stone active:shadow-none transition-all shadow-[1px_1px_0px_#2d2d2d] shrink-0 hover:bg-white"
                    >
                      <span className="text-3xl font-bold font-sans leading-none -mt-1">-</span>
                    </button>
                    <span className="w-10 text-center text-2xl font-bold font-display text-ink mx-1">
                      {count}
                    </span>
                    <button 
                      onClick={() => updateCount(chapter.chapter, 1)}
                      disabled={count >= maxAvailable}
                      className="w-10 h-10 wobbly-border-sm border-2 border-ink bg-surface-soft flex items-center justify-center text-ink disabled:opacity-40 disabled:bg-stone active:shadow-none transition-all shadow-[1px_1px_0px_#2d2d2d] shrink-0 hover:bg-white"
                    >
                      <span className="text-3xl font-bold font-sans leading-none -mt-0.5">+</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-[3px] border-ink bg-surface z-10 shrink-0 pb-[calc(env(safe-area-inset-bottom,20px)+24px)] sm:pb-8 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 border-t-2 border-ink border-dashed rounded-[50%]" />
          
          <div className="flex items-center justify-between mb-5 px-1 bg-surface-soft p-3 wobbly-border border-2 border-ink shadow-[2px_2px_0px_#2d2d2d] -rotate-1">
            <span className="text-2xl font-sans text-ink font-bold">Tổng số lượng:</span>
            <span className="text-3xl font-display font-bold text-primary mr-2">{totalSelected}</span>
          </div>

          <div className="flex items-center justify-between mb-5 px-1 bg-surface-soft p-3 wobbly-border border-2 border-ink shadow-[2px_2px_0px_#2d2d2d] rotate-1">
            <span className="text-xl font-sans text-ink font-bold">Thời gian:</span>
            <select 
              value={timeLimitOption}
              onChange={(e) => setTimeLimitOption(Number(e.target.value))}
              className="text-xl font-sans font-bold text-ink bg-transparent border-none outline-none cursor-pointer text-right"
            >
              <option value={0}>Không giới hạn</option>
              <option value={15}>15 phút</option>
              <option value={30}>30 phút</option>
              <option value={45}>45 phút</option>
              <option value={60}>60 phút</option>
              <option value={90}>90 phút</option>
              <option value={120}>120 phút</option>
            </select>
          </div>

          <button
            onClick={handleStart}
            disabled={totalSelected === 0}
            className="btn-hand-drawn w-full py-4 text-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none disabled:translate-x-[4px] disabled:translate-y-[4px]"
          >
            <Play fill="currentColor" strokeWidth={2.5} className="w-6 h-6" />
            Vào Việc Thôi!
          </button>
        </div>
      </div>
    </div>
  );
}
