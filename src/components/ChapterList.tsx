import React from 'react';
import { Chapter } from '../types';
import { ChevronRight } from 'lucide-react';

interface Props {
  chapters: Chapter[];
  onSelectChapter: (chapter: Chapter) => void;
  selectedChapter?: Chapter | null;
}

export default function ChapterList({ chapters, onSelectChapter, selectedChapter }: Props) {
  return (
    <nav className="flex flex-col w-full gap-4">
      {chapters.map((chapter, index) => {
        const isSelected = selectedChapter?.chapter === chapter.chapter;
        return (
          <div 
            key={chapter.chapter}
            onClick={() => onSelectChapter(chapter)}
            className={`px-4 sm:px-6 py-4 cursor-pointer flex items-center justify-between transition-all border-4 rounded-none ${isSelected ? 'bg-primary text-white border-ink shadow-[4px_4px_0px_0px_#121212] -translate-y-1' : 'bg-[#F0F0F0] border-ink shadow-none hover:bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#121212]'}`}
          >
            <div className="flex items-center gap-4">
              <span className={`text-base sm:text-lg font-bold uppercase tracking-wider line-clamp-2 leading-none ${isSelected ? 'text-white' : 'text-ink'}`}>
                {chapter.chapter_title?.replace(/^CHƯƠNG\s*\d+[\s:\-.]*/i, '')}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className={`flex items-center justify-center min-w-[40px] h-10 border-4 rounded-none ${isSelected ? 'bg-white border-ink text-ink font-black' : 'bg-primary-yellow border-ink text-ink font-black'}`}>
                <span className="text-base">
                  {chapter.questions?.length || 0}
                </span>
              </div>
              <ChevronRight className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-ink'}`} strokeWidth={3} />
            </div>
          </div>
        );
      })}
      {(!chapters || chapters.length === 0) && (
        <div className="p-8 text-center text-lg text-ink font-bold uppercase border-4 border-ink bg-white shadow-[4px_4px_0px_0px_#121212]">
          CHƯA CÓ DỮ LIỆU
        </div>
      )}
    </nav>
  );
}

