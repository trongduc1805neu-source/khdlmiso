import React, { useState, useEffect } from 'react';
import { Chapter, Question } from '../types';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Presentation, HelpCircle, Check, X } from 'lucide-react';
import PdfViewerModal from './PdfViewerModal';

interface Props {
  chapter: Chapter;
  onBack: () => void;
}

const LOCAL_STORAGE_KEY = 'anki_wrong_questions';

const addWrongQuestion = (q: Question) => {
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    if (!current.find((item: Question) => item.chapterId === q.chapterId && item.id === q.id)) {
      current.push(q);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.error(e);
  }
};

const removeWrongQuestion = (q: Question) => {
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const filtered = current.filter((item: Question) => !(item.chapterId === q.chapterId && item.id === q.id));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error(e);
  }
};

export default function Quiz({ chapter, onBack }: Props) {
  // The queue of questions to answer
  const [queue, setQueue] = useState<Question[]>([]);
  // The question currently being displayed
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  
  // The option the user selected (if any)
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  // Whether the selected option is correct
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // PDF Viewer Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  
  const [showOtherWays, setShowOtherWays] = useState(false);

  // Parse questions
  const parseQuestionText = (text: string) => {
    if (!text) return { mainQuestion: "", otherWays: null };
    const splitStr = /(?=Cách hỏi\s*\d*:|cách hỏi\s*\d*:)/i;
    const parts = text.split(splitStr);
    if (parts.length > 1) {
      const mainQuestion = parts[0].trim();
      const otherWays = parts.slice(1).map(p => p.trim());
      return { mainQuestion, otherWays };
    }
    return { mainQuestion: text, otherWays: null };
  };

  const { mainQuestion, otherWays } = parseQuestionText(currentQuestion?.content || "");

  useEffect(() => {
    setShowOtherWays(false);
  }, [currentQuestion]);

  // Counters for progress
  const [masteredCount, setMasteredCount] = useState(0);
  const totalQuestions = chapter.questions?.length || 0;

  // Initialize the queue when the chapter changes
  useEffect(() => {
    if (chapter.questions && chapter.questions.length > 0) {
      const initialQueue = [...chapter.questions];
      setQueue(initialQueue);
      setCurrentQuestion(initialQueue[0]);
    } else {
      setQueue([]);
      setCurrentQuestion(null);
    }
    setMasteredCount(0);
    setSelectedOption(null);
    setIsCorrect(null);
  }, [chapter]);

  const handleNext = (isAnswerCorrect: boolean) => {
    setQueue((prevQueue) => {
      let newQueue = [...prevQueue];
      
      // Remove the current question from the front of the queue
      newQueue.shift();

      if (isAnswerCorrect) {
        // Increase mastered count
        setMasteredCount((prev) => prev + 1);
      } else {
        // SPACED REPETITION LOGIC:
        // If answered incorrectly, push the question back into the queue.
        // Wait 3 questions before asking again, or put at the end if fewer questions remain.
        if (currentQuestion) {
          const insertIndex = Math.min(3, newQueue.length);
          newQueue.splice(insertIndex, 0, currentQuestion);
        }
      }

      // Set next question
      if (newQueue.length > 0) {
        setCurrentQuestion(newQueue[0]);
      } else {
        setCurrentQuestion(null);
      }
      
      // Reset states for the next question
      setSelectedOption(null);
      setIsCorrect(null);
      return newQueue;
    });
  };

  const handleSelectOption = (key: string) => {
    if (selectedOption || !currentQuestion) return; // Prevent multiple submittions

    setSelectedOption(key);
    
    // Some correct_answer values might have trailing spaces
    const correctKey = currentQuestion.correct_answer?.trim().toUpperCase() || "";
    const isAnswerCorrect = key.toUpperCase() === correctKey;
    
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      removeWrongQuestion(currentQuestion);
    } else {
      addWrongQuestion(currentQuestion);
    }

    // Wait a brief moment to show feedback before proceeding
    const delay = isAnswerCorrect ? 1200 : 2500; // longer delay if wrong to see the correct answer

    // Only auto-advance if there is no explanation to read
    if (!currentQuestion.explanation) {
      setTimeout(() => {
        handleNext(isAnswerCorrect);
      }, delay);
    }
  };

  // If there are no questions in this chapter
  if (totalQuestions === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-8 w-full px-5">
        <button onClick={onBack} className="mb-6 inline-flex items-center text-primary font-sans text-xl group z-20 relative">
          <ArrowLeft strokeWidth={2.5} className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Trở lại
        </button>
        <div className="card-hand-drawn p-10 text-center relative rotate-1">
          {/* Post-it thumbtack */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary border-2 border-ink shadow-hard z-10"></div>
          <p className="text-ink font-sans text-2xl">Chương này chưa có câu hỏi nào <br/> (╯°□°）╯︵ ┻━┻</p>
        </div>
      </div>
    );
  }

  // If the user has completed all questions
  if (!currentQuestion && queue.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-8 w-full px-5">
        <div className="card-hand-drawn p-10 text-center relative -rotate-1">
           {/* Post-it thumbtack */}
          <div className="absolute top-2 right-4 w-12 h-4 bg-black/10 -rotate-6"></div>
          <div className="absolute top-4 left-4 w-12 h-4 bg-black/10 rotate-12"></div>
          
          <div className="w-20 h-20 bg-surface border-4 border-ink shadow-hard wobbly-border-sm flex items-center justify-center mx-auto mb-6 rotate-3">
            <svg className="w-12 h-12 text-semantic-success" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="heading-hand-drawn text-4xl mb-4">Tuyệt vời!</h2>
          <p className="font-sans text-xl mb-10 text-charcoal">Bạn đã xử lý gọn gàng tất cả {totalQuestions} câu hỏi của {chapter.chapter_title}. 🎉</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onBack}
              className="btn-hand-drawn w-full sm:w-auto px-6 py-4 text-xl"
            >
              Chọn chương khác
            </button>
            <button 
              onClick={() => {
                // Restart
                const initialQueue = [...chapter.questions];
                setQueue(initialQueue);
                setCurrentQuestion(initialQueue[0]);
                setMasteredCount(0);
                setSelectedOption(null);
                setIsCorrect(null);
              }}
              className="btn-hand-drawn-secondary w-full sm:w-auto px-6 py-4 text-xl flex items-center justify-center gap-2"
            >
              <RotateCcw strokeWidth={2.5} className="w-6 h-6" />
              Làm lại từ đầu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-0">
      {currentQuestion && (
        <>
          {/* Question Meta */}
          <div className="flex items-center justify-between mb-8 pt-2">
            <button onClick={onBack} className="flex items-center text-ink hover:text-primary transition-colors group z-20 relative">
              <ArrowLeft strokeWidth={2.5} className="w-6 h-6 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-sans text-xl border-b-2 border-transparent group-hover:border-primary">Quay lại</span>
            </button>
            <div className="bg-surface border-2 border-ink shadow-hard font-sans text-xl px-4 py-1 rotate-1 wobbly-border-sm">
              <span className="font-bold">{totalQuestions - queue.length + 1}</span> / {totalQuestions}
            </div>
          </div>

          <div className="card-hand-drawn bg-surface p-6 sm:p-10 mb-24 md:mb-10 relative">
            {/* Playful taped decoration */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/5 -rotate-2"></div>
            
            {/* Question Text */}
            <div className="mb-8 relative z-10">
              <h1 className="heading-hand-drawn text-2xl sm:text-3xl leading-relaxed text-ink">
                <span className="inline-block bg-surface-soft border-2 border-ink px-2 py-0.5 rounded-sm -rotate-2 mr-3 align-middle shadow-[2px_2px_0px_#2d2d2d] tabular-nums text-xl">
                  Q{currentQuestion.id}
                </span>
                {mainQuestion}
                {otherWays && (
                  <button 
                    onClick={() => setShowOtherWays(!showOtherWays)}
                    className="inline-flex items-center justify-center ml-2 text-brand-navy hover:text-primary transition-colors align-middle"
                    title="Xem các cách hỏi khác"
                  >
                    <HelpCircle strokeWidth={2.5} className="w-8 h-8" />
                  </button>
                )}
              </h1>
              
              {showOtherWays && otherWays && (
                <div className="mt-4 bg-surface-soft border-[3px] border-ink border-dashed wobbly-border-sm p-5 text-left font-sans text-lg text-ink rotate-1">
                  <p className="font-bold underline decoration-wavy decoration-ink mb-2">Các cách hỏi khác:</p>
                  <ul className="space-y-2 list-disc list-inside marker:text-primary">
                    {otherWays.map((way, idx) => (
                      <li key={idx} className="leading-snug">{way}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-4">
              {Object.entries(currentQuestion.options).map(([key, text]) => {
                if (!text) return null;
                
                const isSelected = selectedOption === key;
                const correctKey = currentQuestion.correct_answer?.trim().toUpperCase();
                const isCorrectAnswerOption = key.toUpperCase() === correctKey;
                
                let buttonClass = "w-full text-left px-5 py-4 wobbly-border-sm border-[3px] transition-all flex items-center gap-4 group ";
                let circleClass = "w-10 h-10 border-[3px] flex items-center justify-center font-display font-bold text-xl flex-shrink-0 transition-colors bg-white shadow-[2px_2px_0px_#2d2d2d] ";
                let textClass = "font-sans text-xl leading-snug flex-1 ";
                
                if (selectedOption) {
                  // After an option is selected, show results
                  if (isSelected && isCorrect) {
                     buttonClass += "border-ink bg-semantic-success/20 shadow-hard translate-x-[2px] translate-y-[2px]";
                     circleClass += "border-ink bg-semantic-success text-white";
                     textClass += "text-ink font-bold line-through decoration-semantic-success decoration-2";
                  } else if (isSelected && !isCorrect) {
                     buttonClass += "border-ink bg-semantic-error/20 shadow-hard translate-x-[2px] translate-y-[2px]";
                     circleClass += "border-ink bg-semantic-error text-white";
                     textClass += "text-ink font-bold line-through decoration-semantic-error decoration-2";
                  } else if (isCorrectAnswerOption) {
                     buttonClass += "border-ink border-dashed bg-semantic-success/10 border-semantic-success";
                     circleClass += "border-semantic-success text-semantic-success";
                     textClass += "text-ink font-bold";
                  } else {
                     buttonClass += "border-ink/20 opacity-60 pointer-events-none bg-surface/50";
                     circleClass += "border-ink/20 text-slate shadow-none";
                     textClass += "text-slate";
                  }
                } else {
                  // Interactive state before selection
                  buttonClass += "border-ink bg-surface shadow-hard hover:shadow-hard-hover hover:translate-x-[2px] hover:translate-y-[2px] hover:-rotate-1";
                  circleClass += "border-ink text-ink group-hover:bg-primary group-hover:text-white";
                  textClass += "text-ink";
                }

                return (
                  <button 
                    key={key} 
                    className={buttonClass}
                    onClick={() => handleSelectOption(key)}
                    disabled={!!selectedOption}
                  >
                    <span className={circleClass} style={{borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px'}}>{key}</span>
                    <span className={textClass}>{text}</span>
                    
                    {/* Result Icons */}
                    {selectedOption && isCorrectAnswerOption && (
                       <div className="ml-auto flex items-center justify-center shrink-0 w-10 h-10 bg-semantic-success text-white border-2 border-ink rounded-full rotate-6">
                         <Check strokeWidth={3} className="w-6 h-6" />
                       </div>
                    )}
                    {selectedOption && isSelected && !isCorrect && (
                       <div className="ml-auto flex items-center justify-center shrink-0 w-10 h-10 bg-semantic-error text-white border-2 border-ink rounded-full -rotate-6">
                         <X strokeWidth={3} className="w-6 h-6" />
                       </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedOption && currentQuestion.explanation && (
              <div className="mt-8 pt-6 border-t-[3px] border-dashed border-ink/20 animate-in fade-in slide-in-from-top-4">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <p className="heading-hand-drawn text-2xl rotate-1 mr-2 px-2 py-1 bg-surface-soft border-2 border-ink shadow-[2px_2px_0px_#2d2d2d]">Giải thích!</p>
                  {(currentQuestion.difficulty || currentQuestion.bloom_level || currentQuestion.question_type) && (
                    <div className="flex flex-wrap gap-2 text-lg font-sans text-ink">
                      {currentQuestion.difficulty && <span className="border-2 border-ink/40 border-dashed px-3 py-0.5 rounded-full rotate-1">{currentQuestion.difficulty}</span>}
                      {currentQuestion.bloom_level && <span className="border-2 border-ink/40 border-dashed px-3 py-0.5 rounded-full -rotate-1">{currentQuestion.bloom_level}</span>}
                      {currentQuestion.question_type && <span className="border-2 border-ink/40 border-dashed px-3 py-0.5 rounded-full rotate-2">{currentQuestion.question_type}</span>}
                    </div>
                  )}
                </div>
                <div className="font-sans text-xl leading-relaxed bg-surface border-[3px] border-ink p-5 wobbly-border-md shadow-hard -rotate-1">
                  <p>{currentQuestion.explanation}</p>
                  
                  {(currentQuestion.knowledge_area || currentQuestion.source_reference) && (
                    <div className="mt-4 pt-4 border-t-2 border-ink/20 text-lg flex flex-col gap-2">
                      {currentQuestion.knowledge_area && (
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="font-bold underline decoration-wavy decoration-primary">Phạm vi:</span>
                          <span>{currentQuestion.knowledge_area}</span>
                        </div>
                      )}
                      {currentQuestion.source_reference && (
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="font-bold underline decoration-wavy decoration-brand-navy">Nguồn tham khảo:</span>
                          <span className="bg-surface-soft px-2 py-0.5 border-2 border-ink shadow-[1px_1px_0px_#2d2d2d] rotate-2">Topic {currentQuestion.source_reference.topic}</span>
                          <span>👉</span>
                          <span className="bg-surface-soft px-2 py-0.5 border-2 border-ink shadow-[1px_1px_0px_#2d2d2d] -rotate-1 capitalize">{currentQuestion.source_reference.cell_type} ô {currentQuestion.source_reference.cell_index}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentQuestion.chapterId && currentQuestion.chapterId > 0 && currentQuestion.chapterId < 100 && (
              <div className="mt-8 pt-6 border-t-[3px] border-dashed border-ink/20 flex flex-col items-center">
                <p className="font-sans text-xl text-ink mb-4 rotate-1">Câu này hơi chua? 🍋 Xem lại nhé!</p>
                <button
                  onClick={() => {
                    setCurrentPdfUrl(`/slide/c${currentQuestion.chapterId}.pdf`);
                    setIsPdfModalOpen(true);
                  }}
                  className="btn-hand-drawn-secondary px-6 py-3 flex items-center justify-center gap-3 sm:w-auto w-full text-xl -rotate-1"
                >
                  <Presentation strokeWidth={2.5} className="w-6 h-6" />
                  Xem Giáo Trình (Chương {currentQuestion.chapterId})
                </button>
              </div>
            )}
          </div>

          <PdfViewerModal
            isOpen={isPdfModalOpen}
            onClose={() => setIsPdfModalOpen(false)}
            fileUrl={currentPdfUrl}
            title={`Giáo Trình Chương ${currentQuestion.chapterId}`}
          />

          {/* Feedback Bar */}
          {selectedOption && (
            <div className="fixed bottom-4 left-4 right-4 md:static md:bottom-auto md:left-auto md:right-auto card-hand-drawn p-4 flex items-center justify-between animate-in slide-in-from-bottom-8 duration-300 z-50 md:mt-2 rotate-1">
              <div className="flex flex-col ml-2 font-sans">
                {isCorrect ? (
                  <>
                    <span className="text-semantic-success font-bold text-2xl flex items-center gap-2">
                      Đỉnh của chóp! ✨
                    </span>
                    <span className="text-charcoal text-lg mt-0.5">Tiếp tục phát huy nhé!</span>
                  </>
                ) : (
                  <>
                    <span className="text-primary font-bold text-2xl flex items-center gap-2">
                      Úi, nhầm rồi! 😅
                    </span>
                    <span className="text-charcoal text-lg mt-0.5">Học từ sai lầm là tốt nhất.</span>
                  </>
                )}
              </div>
              {currentQuestion.explanation ? (
                <button
                  onClick={() => handleNext(isCorrect!)}
                  className="btn-hand-drawn px-6 py-3 ml-4 shrink-0 text-xl"
                >
                  Câu tiếp
                </button>
              ) : (
                <div className="w-10 h-10 rounded-full border-4 border-ink/20 border-t-ink animate-spin"></div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
