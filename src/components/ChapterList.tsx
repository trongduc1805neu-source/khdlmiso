import React from 'react';
import { Chapter } from '../types';

interface Props {
  chapters: Chapter[];
  onSelectChapter: (chapter: Chapter) => void;
  selectedChapter?: Chapter | null;
}

export default function ChapterList({ chapters, onSelectChapter, selectedChapter }: Props) {
  return (
    <nav className="flex flex-col w-full gap-3">
      {chapters.map((chapter, index) => {
        const isSelected = selectedChapter?.chapter === chapter.chapter;
        return (
          <div 
            key={chapter.chapter}
            onClick={() => onSelectChapter(chapter)}
            className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-all wobbly-border-md border-2 border-transparent ${isSelected ? 'bg-primary text-white border-ink shadow-hard -translate-y-1' : 'bg-canvas hover:bg-stone hover:-translate-y-0.5 hover:shadow-hard-hover border-ink/10 hover:border-ink/50 border-dashed'}`}
            style={{ transform: !isSelected && index % 2 === 0 ? 'rotate(1deg)' : !isSelected ? 'rotate(-1deg)' : 'none' }}
          >
            <span className={`text-xl font-sans line-clamp-2 pr-2 leading-tight ${isSelected ? 'text-white' : 'text-ink'}`}>
              {chapter.chapter_title?.replace(/^CHƯƠNG\s*\d+[\s:\-.]*/i, '')}
            </span>
            <div className={`flex items-center gap-2 flex-shrink-0 w-8 h-8 rounded-full border-2 justify-center bg-surface-soft ${isSelected ? 'border-none text-ink' : 'border-ink text-ink font-bold'}`}>
              <span className={`font-sans text-xl`}>
                {chapter.questions?.length || 0}
              </span>
            </div>
          </div>
        );
      })}
      {(!chapters || chapters.length === 0) && (
        <div className="p-6 text-center text-xl text-slate font-sans border-2 border-dashed border-ink/30 wobbly-border-md bg-white rotate-1">
          Chưa có dữ liệu ¯\_(ツ)_/¯
        </div>
      )}
    </nav>
  );
}
