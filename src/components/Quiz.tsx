import React, { useState, useEffect } from 'react';
import { Chapter, Question } from '../types';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Presentation, HelpCircle, Check, X, Clock, Target, Volume2, VolumeX } from 'lucide-react';
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
  const isExamMode = chapter.chapter === 999;
  const isReviewMode = chapter.chapter === 998;

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

  // Audio State
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Counters for progress
  const [masteredCount, setMasteredCount] = useState(0);
  const totalQuestions = chapter.questions?.length || 0;

  // Exam and Timer State
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examWrongQuestions, setExamWrongQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(chapter.timeLimit || null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState<number>(0);

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
    
    // Reset Exam/Timer states
    setExamAnswers({});
    setExamWrongQuestions([]);
    setTimeLeft(chapter.timeLimit || null);
    setStartTime(Date.now());
    setTimeSpent(0);
  }, [chapter]);

  // Timer Effect
  useEffect(() => {
    if (isExamMode && timeLeft !== null) {
      if (timeLeft > 0 && queue.length > 0 && currentQuestion) {
        const timer = setInterval(() => setTimeLeft(prev => prev! - 1), 1000);
        return () => clearInterval(timer);
      } else if (timeLeft === 0 && currentQuestion) {
        // Time's up! End exam early.
        setExamWrongQuestions(prev => {
          const newWrongs = [...prev];
          queue.forEach(q => {
            if (!newWrongs.find(existing => existing.id === q.id)) {
              newWrongs.push(q);
            }
          });
          return newWrongs;
        });
        setQueue([]);
        setCurrentQuestion(null);
      }
    }
  }, [isExamMode, timeLeft, queue.length, currentQuestion]);

  // Calculate Time Spent when finished
  useEffect(() => {
    if (!currentQuestion && queue.length === 0 && timeSpent === 0 && totalQuestions > 0) {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }
  }, [currentQuestion, queue.length, timeSpent, startTime, totalQuestions]);

  const handleNext = (isAnswerCorrect: boolean) => {
    setQueue((prevQueue) => {
      let newQueue = [...prevQueue];
      
      // Remove the current question from the front of the queue
      newQueue.shift();

      if (isAnswerCorrect) {
        setMasteredCount((prev) => prev + 1);
      } else {
        if (!isExamMode && currentQuestion) {
          // Lặp lại ngắt quãng: Add it multiple times to reinforce learning if wrong
          const insertIndex1 = Math.min(2, newQueue.length);
          newQueue.splice(insertIndex1, 0, currentQuestion);
          
          if (newQueue.length > 3) {
            const insertIndex2 = Math.min(6, newQueue.length);
            newQueue.splice(insertIndex2, 0, currentQuestion);
          }
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

    if (isExamMode) {
      setExamAnswers(prev => ({ ...prev, [currentQuestion.id]: key }));
      if (!isAnswerCorrect) {
        setExamWrongQuestions(prev => {
          if (!prev.find(q => q.id === currentQuestion.id)) {
            return [...prev, currentQuestion];
          }
          return prev;
        });
      }
      
      // Auto advance quickly in exam mode
      setTimeout(() => {
        handleNext(isAnswerCorrect);
      }, 400);
      return;
    }

    if (isAnswerCorrect) {
      if (isReviewMode) {
        // Only remove from wrong questions if answering correctly in Review mode
        removeWrongQuestion(currentQuestion);
      }
    } else {
      addWrongQuestion(currentQuestion);
      setExamWrongQuestions(prev => {
        if (!prev.find(q => q.id === currentQuestion.id)) {
          return [...prev, currentQuestion];
        }
        return prev;
      });
    }

    // Record answer for review at the end 
    setExamAnswers(prev => {
       if (!prev[currentQuestion.id]) {
         return { ...prev, [currentQuestion.id]: key };
       }
       return prev;
    });

    // Wait a brief moment to show feedback before proceeding
    const delay = isAnswerCorrect ? 1000 : 2500; // longer delay if wrong to see the correct answer

    // Only auto-advance if there is no explanation to read
    if (!currentQuestion.explanation) {
      setTimeout(() => {
        handleNext(isAnswerCorrect);
      }, delay);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If there are no questions in this chapter
  const renderQuizContent = () => {
    if (totalQuestions === 0) {
      return (
        <div className="max-w-2xl mx-auto mt-8 w-full px-5">
          <button onClick={onBack} className="mb-6 inline-flex items-center text-primary font-bold uppercase tracking-wider text-base group z-20 relative">
            <ArrowLeft strokeWidth={3} className="w-6 h-6 mr-2 group-hover:-translate-x-1 transition-transform" /> TRỞ LẠI
          </button>
          <div className="card-bauhaus bg-white w-full p-12 shadow-[12px_12px_0px_0px_#121212] flex flex-col items-center justify-center relative">
            <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-primary border-4 border-ink z-10"></div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-primary-yellow border-4 border-ink z-10 rotate-45"></div>
            <p className="text-ink font-black uppercase text-2xl tracking-tight text-center">CHƯƠNG NÀY CHƯA CÓ CÂU HỎI NÀO <br/> <span className="text-primary mt-2 flex justify-center">¯\_(ツ)_/¯</span></p>
          </div>
        </div>
      );
    }

  // If the user has completed all questions
  if (!currentQuestion && queue.length === 0) {
    const isPerfect = examWrongQuestions.length === 0 && Object.keys(examAnswers).length === totalQuestions;
    
    // Calculate correct score by checking answers
    const correctScore = Object.keys(examAnswers).reduce((acc, qId) => {
      const q = chapter.questions.find(q => q.id.toString() === qId);
      if (q && examAnswers[qId]?.toUpperCase() === q.correct_answer?.trim().toUpperCase()) {
        return acc + 1;
      }
      return acc;
    }, 0);

    return (
      <div className="max-w-2xl mx-auto mt-8 w-full px-5">
        <div className="card-bauhaus bg-white p-10 text-center relative mb-8">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#1040C0] border-l-4 border-b-4 border-ink rounded-bl-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 bg-[#D02020] border-r-4 border-b-4 border-ink rounded-br-full"></div>
          
          <div className="w-24 h-24 bg-primary-yellow border-4 border-ink shadow-[4px_4px_0px_0px_#121212] rounded-none flex items-center justify-center mx-auto mb-8 mt-4">
            <Check strokeWidth={5} className="w-14 h-14 text-ink" />
          </div>
          <h2 className="heading-bauhaus text-3xl sm:text-4xl mb-6">HOÀN THÀNH!</h2>
          
          {isExamMode && (
            <div className="mb-8 p-6 border-4 border-ink bg-[#F0F0F0] shadow-[8px_8px_0px_0px_#121212]">
              <p className="font-black text-4xl text-primary mb-2">
                {correctScore} <span className="text-2xl text-ink">/ {totalQuestions}</span>
              </p>
              <p className="font-bold uppercase tracking-wider text-base text-ink">
                {isPerfect ? "ĐIỂM TUYỆT ĐỐI" : "HÃY XEM LẠI CÁC CÂU SAI"}
              </p>
            </div>
          )}

          {!isExamMode && (
             <p className="font-bold uppercase tracking-wider text-base mb-8 text-ink">BẠN ĐÃ HOÀN THÀNH TẤT CẢ CÂU HỎI.</p>
          )}

          <div className="flex items-center justify-center gap-6 font-bold uppercase tracking-wider text-base text-ink bg-white p-6 border-4 border-ink shadow-[4px_4px_0px_0px_#121212] mb-10">
            <div className="flex flex-col items-center">
              <span className="text-ink mb-1 flex items-center gap-1"><Clock className="w-5 h-5"/> THỜI GIAN</span>
              <span className="font-black text-xl">{formatTime(timeSpent)}</span>
            </div>
            <div className="w-1 h-12 bg-ink"></div>
            <div className="flex flex-col items-center">
              <span className="text-ink mb-1">TB / CÂU</span>
              <span className="font-black text-xl">{totalQuestions > 0 ? (timeSpent / totalQuestions).toFixed(1) : 0}s</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={onBack}
              className="btn-secondary w-full sm:w-auto px-8 py-4 text-base"
            >
              CHỌN CHƯƠNG LẠI
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
                setExamAnswers({});
                setExamWrongQuestions([]);
                setTimeLeft(chapter.timeLimit || null);
                setStartTime(Date.now());
                setTimeSpent(0);
              }}
              className="btn-primary w-full sm:w-auto px-8 py-4 text-base flex items-center justify-center gap-3"
            >
              <RotateCcw strokeWidth={3} className="w-6 h-6" />
              LÀM LẠI TỪ ĐẦU
            </button>
          </div>
        </div>

        {/* Display wrong questions for review */}
        {examWrongQuestions.length > 0 && (
          <div className="mb-16 mt-16">
            <h3 className="heading-bauhaus text-2xl mb-8 border-b-4 border-ink pb-2">CÂU CẦN XEM LẠI ({examWrongQuestions.length})</h3>
            <div className="space-y-6">
              {examWrongQuestions.map((q, idx) => (
                <div key={q.id} className="card-bauhaus p-6 bg-white border-4 border-ink shadow-[8px_8px_0px_0px_#121212] rounded-none">
                  <p className="font-bold text-lg mb-6">
                    <span className="bg-primary text-white border-2 border-ink px-2 py-1 mr-3">Q{q.id}</span> 
                    {q.content.split(/(?=Cách hỏi\s*\d*:|cách hỏi\s*\d*:)/i)[0]}
                  </p>
                  
                  <div className="space-y-4 mt-4 p-4 border-l-4 border-ink bg-[#F0F0F0]">
                    <p className="font-bold text-lg">
                      <span className="text-primary mr-3 inline-flex items-center">
                        <X className="w-5 h-5 mr-1 inline" strokeWidth={3}/>
                        BẠN CHỌN:
                      </span>
                      <span className="line-through">{examAnswers[q.id] || "BỎ TRỐNG"}</span>
                    </p>
                    <p className="font-bold text-lg">
                      <span className="text-[#0C9E59] mr-3 inline-flex items-center">
                        <Check className="w-5 h-5 mr-1 inline" strokeWidth={3}/>
                        ĐÁP ÁN:
                      </span>
                      {q.correct_answer}
                    </p>
                    {q.explanation && (
                      <div className="mt-6 bg-white p-4 border-4 border-ink text-base font-medium">
                        <p className="font-black uppercase tracking-wider mb-2">GIẢI THÍCH:</p>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-0">
        {currentQuestion && (
          <>
            {/* Question Meta */}
            <div className="flex items-center justify-between mb-8 pt-2">
              <button onClick={onBack} className="flex items-center text-ink hover:text-primary transition-colors group z-20 relative flex-shrink-0">
                <ArrowLeft strokeWidth={2.5} className="w-6 h-6 mr-1 sm:mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-sans text-base sm:text-lg border-b-2 border-transparent group-hover:border-primary hidden sm:inline">Quay lại</span>
              </button>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="bg-white border-2 border-ink shadow-[4px_4px_0px_0px_#121212] p-2 hover:-translate-y-1 transition-transform rounded-none"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-slate" /> : <Volume2 className="w-5 h-5 text-primary" />}
                </button>
                {isExamMode && timeLeft !== null && (
                <div className="bg-[#F0F0F0] border-2 border-ink shadow-[4px_4px_0px_0px_#121212] font-display font-bold text-lg px-3 py-1 text-semantic-error min-w-[80px] text-center rounded-none">
                  {formatTime(timeLeft)}
                </div>
              )}
              <div className="bg-white border-2 border-ink shadow-[4px_4px_0px_0px_#121212] font-sans text-lg px-4 py-1 shrink-0 rounded-none">
                <span className="font-bold">{totalQuestions - queue.length + 1}</span> / {totalQuestions}
              </div>
            </div>
          </div>

          <div className="card-bauhaus bg-white p-6 sm:p-10 mb-24 md:mb-10 relative">
            {/* Playful taped decoration */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/5 -rotate-2"></div>
            
            {/* Question Text */}
            <div className="mb-8 relative z-10">
              <h1 className="heading-bauhaus text-xl sm:text-2xl leading-relaxed text-ink">
                <span className="inline-block bg-surface-soft border-2 border-ink px-2 py-0.5 rounded-sm -rotate-2 mr-3 align-middle shadow-[2px_2px_0px_#2d2d2d] tabular-nums text-lg">
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
                <div className="mt-4 bg-[#F0F0F0] border-2 border-ink p-5 text-left font-sans text-base text-ink rounded-none">
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
                
                let buttonClass = "w-full text-left px-5 py-4 rounded-none border-[2px] sm:border-[4px] transition-all flex items-center gap-4 group ";
                let circleClass = "w-10 h-10 border-[3px] flex items-center justify-center font-display font-bold text-lg flex-shrink-0 transition-colors bg-white shadow-[2px_2px_0px_#2d2d2d] ";
                let textClass = "font-sans text-base sm:text-lg leading-snug flex-1 ";
                
                if (selectedOption) {
                  if (isExamMode) {
                    // Exam mode styling (no reveal)
                    if (isSelected) {
                      buttonClass += "border-ink bg-primary/10 shadow-hard translate-x-[2px] translate-y-[2px]";
                      circleClass += "border-ink bg-primary text-white";
                      textClass += "text-ink font-bold";
                    } else {
                      buttonClass += "border-ink/20 opacity-60 pointer-events-none bg-surface/50";
                      circleClass += "border-ink/20 text-slate shadow-none";
                      textClass += "text-slate";
                    }
                  } else {
                    // Normal mode styling (reveal answers immediately)
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
                    <span className={circleClass}>{key}</span>
                    <span className={textClass}>{text}</span>
                    
                    {/* Result Icons - Only in Normal Mode */}
                    {!isExamMode && selectedOption && isCorrectAnswerOption && (
                       <div className="ml-auto flex items-center justify-center shrink-0 w-10 h-10 bg-semantic-success text-white border-2 border-ink rounded-full rotate-6">
                         <Check strokeWidth={3} className="w-6 h-6" />
                       </div>
                    )}
                    {!isExamMode && selectedOption && isSelected && !isCorrect && (
                       <div className="ml-auto flex items-center justify-center shrink-0 w-10 h-10 bg-semantic-error text-white border-2 border-ink rounded-full -rotate-6">
                         <X strokeWidth={3} className="w-6 h-6" />
                       </div>
                    )}
                  </button>
                );
              })}
            </div>

            {!isExamMode && selectedOption && currentQuestion.explanation && (
              <div className="mt-8 pt-6 border-t-[3px] border-dashed border-ink/20 animate-in fade-in slide-in-from-top-4">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <p className="heading-bauhaus text-xl mr-2 px-2 py-1 bg-[#F0F0F0] border-2 border-ink shadow-[2px_2px_0px_#121212]">GIẢI THÍCH:</p>
                  {(currentQuestion.difficulty || currentQuestion.bloom_level || currentQuestion.question_type) && (
                    <div className="flex flex-wrap gap-2 text-base font-sans text-ink">
                      {currentQuestion.difficulty && <span className="border-2 border-ink/40 border-dashed px-3 py-0.5 rounded-full rotate-1">{currentQuestion.difficulty}</span>}
                      {currentQuestion.bloom_level && <span className="border-2 border-ink/40 border-dashed px-3 py-0.5 rounded-full -rotate-1">{currentQuestion.bloom_level}</span>}
                      {currentQuestion.question_type && <span className="border-2 border-ink/40 border-dashed px-3 py-0.5 rounded-full rotate-2">{currentQuestion.question_type}</span>}
                    </div>
                  )}
                </div>
                <div className="font-sans text-base leading-relaxed bg-[#F0F0F0] border-[2px] sm:border-[4px] border-ink p-5 shadow-[4px_4px_0px_0px_#121212] rounded-none">
                  <p>{currentQuestion.explanation}</p>
                  
                  {(currentQuestion.knowledge_area || currentQuestion.source_reference) && (
                    <div className="mt-4 pt-4 border-t-2 border-ink/20 text-base flex flex-col gap-2">
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

            {!isExamMode && currentQuestion.chapterId && currentQuestion.chapterId > 0 && currentQuestion.chapterId < 100 && (
              <div className="mt-8 pt-6 border-t-[3px] border-dashed border-ink/20 flex flex-col items-center">
                <p className="font-sans text-base text-ink mb-4 rotate-1">Câu này hơi chua? 🍋 Xem lại nhé!</p>
                <button
                  onClick={() => {
                    setCurrentPdfUrl(`/slide/c${currentQuestion.chapterId}.pdf`);
                    setIsPdfModalOpen(true);
                  }}
                  className="btn-secondary px-6 py-4 flex items-center justify-center gap-3 sm:w-auto w-full text-base"
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

          {/* Feedback Bar (Normal Mode) */}
          {!isExamMode && selectedOption && (
            <div className="fixed bottom-4 left-4 right-4 md:static md:bottom-auto md:left-auto md:right-auto card-bauhaus bg-surface-soft p-4 flex items-center justify-between animate-in slide-in-from-bottom-8 duration-300 z-50 md:mt-2">
              <div className="flex flex-col ml-2 font-sans">
                {isCorrect ? (
                  <>
                    <span className="text-semantic-success font-bold text-xl flex items-center gap-2">
                      Đỉnh của chóp! ✨
                    </span>
                    <span className="text-charcoal text-base mt-0.5">Tiếp tục phát huy nhé!</span>
                  </>
                ) : (
                  <>
                    <span className="text-primary font-bold text-xl flex items-center gap-2">
                      Úi, nhầm rồi! 😅
                    </span>
                    <span className="text-charcoal text-base mt-0.5">Học từ sai lầm là tốt nhất. Câu hỏi sẽ được nhắc lại!</span>
                  </>
                )}
              </div>
              {currentQuestion.explanation ? (
                <button
                  onClick={() => handleNext(isCorrect!)}
                  className="btn-primary px-8 py-4 ml-4 shrink-0 text-base"
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
};

  return (
    <>
      <audio ref={audioRef} src="/song.mp3" autoPlay loop muted={isMuted} className="hidden" />
      {renderQuizContent()}
    </>
  );
}
