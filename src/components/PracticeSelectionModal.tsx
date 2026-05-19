import React, { useState } from 'react';
import { X, BookOpen, Dumbbell, Target } from 'lucide-react';
import { TOPIC_NAMES } from '../utils/examGenerator';

interface PracticeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topicId: string) => void;
  onGenerateExam: (type: 'de1' | 'de2' | 'random') => void;
}

export default function PracticeSelectionModal({ isOpen, onClose, onSelectTopic, onGenerateExam }: PracticeSelectionModalProps) {
  const [view, setView] = useState<'selection' | 'topics' | 'standardExams'>('selection');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white border-4 border-ink shadow-[8px_8px_0px_#121212] w-full max-w-2xl max-h-[90vh] flex flex-col relative"
      >
        <div className="flex items-center justify-between p-4 border-b-4 border-ink bg-surface shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-30"></div>
          <h2 className="heading-bauhaus text-2xl tracking-tighter text-ink relative z-10">LỰA CHỌN ÔN TẬP</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 border-2 border-ink rounded flex items-center justify-center bg-white hover:bg-error hover:text-white transition-colors relative z-10 wobbly-border"
          >
            <X strokeWidth={3} />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto min-h-[300px]">
          {view === 'selection' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-8">
              <button 
                onClick={() => setView('topics')}
                className="group flex flex-col items-center gap-4 p-6 md:p-8 border-4 border-ink bg-primary-blue hover:bg-opacity-90 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#121212] transition-all wobbly-border"
              >
                <div className="w-16 h-16 bg-white border-4 border-ink flex items-center justify-center rounded-sm">
                  <Target strokeWidth={2.5} className="w-8 h-8 text-ink" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-xl text-white outline-text tracking-wide mb-2 uppercase">Ôn theo Topic</h3>
                  <p className="text-ink font-medium bg-white/80 px-2 py-1 border border-ink text-sm inline-block">Luyện tập theo từng chủ đề riêng biệt</p>
                </div>
              </button>
              
              <button 
                onClick={() => setView('standardExams')}
                className="group flex flex-col items-center gap-4 p-6 md:p-8 border-4 border-ink bg-[#20f0a0] hover:bg-opacity-90 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#121212] transition-all wobbly-border"
              >
                <div className="w-16 h-16 bg-white border-4 border-ink flex items-center justify-center rounded-sm group-hover:animate-bounce">
                  <Dumbbell strokeWidth={2.5} className="w-8 h-8 text-ink" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-xl text-white outline-text tracking-wide mb-2 uppercase">Luyện Đề Chuẩn</h3>
                  <p className="text-ink font-medium bg-white/80 px-2 py-1 border border-ink text-sm inline-block">Đề tĩnh & Đề Mix tự động</p>
                </div>
              </button>
            </div>
          ) : view === 'topics' ? (
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setView('selection')}
                className="self-start text-sm font-bold border-2 border-ink px-4 py-2 hover:bg-surface transition-colors mb-2"
              >
                Quay lại
              </button>
              
              <h3 className="font-bold text-xl text-ink tracking-tight border-b-2 border-ink pb-2 mb-2 uppercase">Chọn Topic</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-ink scrollbar-track-surface">
                {Object.entries(TOPIC_NAMES).map(([id, name]) => (
                  <button
                    key={id}
                    onClick={() => {
                      onSelectTopic(id);
                      onClose();
                    }}
                    className="text-left px-4 py-3 border-2 border-ink hover:bg-primary-yellow hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#121212] transition-all flex flex-col gap-1"
                  >
                    <span className="text-xs font-bold bg-ink text-white px-2 py-0.5 self-start">{id}</span>
                    <span className="font-semibold text-sm leading-tight text-ink">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setView('selection')}
                className="self-start text-sm font-bold border-2 border-ink px-4 py-2 hover:bg-surface transition-colors mb-2"
              >
                Quay lại
              </button>
              
              <h3 className="font-bold text-xl text-ink tracking-tight border-b-2 border-ink pb-2 mb-2 uppercase">Chọn Đề</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    onGenerateExam('de1');
                    onClose();
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-4 border-ink bg-white hover:bg-primary-blue hover:text-white transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_#121212] group"
                >
                  <span className="font-bold text-2xl group-hover:text-white text-ink">Đề 1</span>
                  <span className="text-sm font-medium border-t-2 border-ink group-hover:border-white pt-2 leading-tight">Đề thi mẫu cố định 1</span>
                </button>
                <button
                  onClick={() => {
                    onGenerateExam('de2');
                    onClose();
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-4 border-ink bg-white hover:bg-primary-yellow hover:text-ink transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_#121212] group"
                >
                  <span className="font-bold text-2xl text-ink">Đề 2</span>
                  <span className="text-sm font-medium border-t-2 border-ink pt-2 leading-tight text-ink">Đề thi mẫu cố định 2</span>
                </button>
                <button
                  onClick={() => {
                    onGenerateExam('random');
                    onClose();
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-6 border-4 border-ink bg-white hover:bg-primary transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_#121212] group"
                >
                  <span className="font-bold text-2xl text-ink group-hover:text-white text-center">Tạo Đề Mới</span>
                  <span className="text-sm font-medium border-t-2 border-ink group-hover:border-white pt-2 leading-tight text-ink group-hover:text-white text-center">Random 40 câu theo cấu trúc</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
