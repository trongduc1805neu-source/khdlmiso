import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chapter, Question } from '../types';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Presentation, HelpCircle, Check, X, Clock, Target, Volume2, VolumeX, Flame } from 'lucide-react';
import PdfViewerModal from './PdfViewerModal';
import { ContentRenderer } from './ContentRenderer';

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

const shuffleQuestionOptions = (question: Question): Question => {
  if (!question.options || Object.keys(question.options).length === 0) return question;
  
  const entries = Object.entries(question.options);
  const originalKeys = entries.map(e => e[0]).sort();
  const shuffledEntries = [...entries].sort(() => Math.random() - 0.5);
  
  const newOptions: Record<string, string> = {};
  let newCorrectAnswer = question.correct_answer;
  const oldCorrectAnswer = question.correct_answer?.trim().toUpperCase();
  
  shuffledEntries.forEach((entry, index) => {
    const originalKey = entry[0];
    const originalText = entry[1];
    const newKey = originalKeys[index];
    
    newOptions[newKey] = originalText;
    
    if (originalKey.toUpperCase() === oldCorrectAnswer) {
      newCorrectAnswer = newKey;
    }
  });
  
  return {
    ...question,
    options: newOptions,
    correct_answer: newCorrectAnswer
  };
};

export default function Quiz({ chapter, onBack }: Props) {
  const isAutoExamMode = chapter.chapter === 999;
  const isMockExamMode = chapter.chapter === 1000;
  const isExamMode = isAutoExamMode || isMockExamMode;
  const isReviewMode = chapter.chapter === 998;
  const [mockExamIndex, setMockExamIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    if (containerRef.current && containerRef.current.parentElement) {
      containerRef.current.parentElement.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentQuestion]);

  // Audio State
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const correctAudioRef = React.useRef<HTMLAudioElement>(null);
  const correct2AudioRef = React.useRef<HTMLAudioElement>(null);
  const wrongAudioRef = React.useRef<HTMLAudioElement>(null);
  const endAudioRef = React.useRef<HTMLAudioElement>(null);
  
  const streak3AudioRef = React.useRef<HTMLAudioElement>(null);
  const streak5AudioRef = React.useRef<HTMLAudioElement>(null);

  const feedbackRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to explanation when answered
  useEffect(() => {
    if (selectedOption && feedbackRef.current && !isExamMode) {
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [selectedOption, isExamMode]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Counters for progress
  const [masteredCount, setMasteredCount] = useState(0);
  const totalQuestions = chapter.questions?.length || 0;

  // Exam and Timer State
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examWrongQuestions, setExamWrongQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(chapter.timeLimit || null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState<number>(0);

  // Question Timer State
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<number, number>>({});
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number>(Date.now());
  const [currentQuestionTimer, setCurrentQuestionTimer] = useState<number>(0);

  // Streak State
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [streakBroken, setStreakBroken] = useState(false);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [streakPopupText, setStreakPopupText] = useState("");

  // Initialize the queue when the chapter changes
  useEffect(() => {
    if (chapter.questions && chapter.questions.length > 0) {
      const initialQueue = chapter.questions.map(shuffleQuestionOptions);
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
    setQuestionTimeSpent({});
    setCurrentQuestionStartTime(Date.now());
    setCurrentQuestionTimer(0);
    setMockExamIndex(0);
    setIsSubmitted(false);
  }, [chapter]);

  // Timer Effect
  useEffect(() => {
    if (isExamMode && timeLeft !== null) {
      if (timeLeft > 0 && queue.length > 0 && currentQuestion) {
        const timer = setInterval(() => setTimeLeft(prev => prev! - 1), 1000);
        return () => clearInterval(timer);
      } else if (timeLeft === 0 && currentQuestion) {
        // Time's up! End exam early.
        if (endAudioRef.current) {
          endAudioRef.current.volume = volume;
          endAudioRef.current.currentTime = 0;
          endAudioRef.current.play().catch(e => console.error("Audio play error", e));
        }
        
        if (isMockExamMode) {
          setIsSubmitted(true);
        } else {
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
    }
  }, [isExamMode, timeLeft, queue.length, currentQuestion, isMuted, volume]);

  // Current Question Timer Effect
  useEffect(() => {
    setCurrentQuestionStartTime(Date.now());
    setCurrentQuestionTimer(0);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (currentQuestion && !selectedOption) {
      const timer = setInterval(() => {
        setCurrentQuestionTimer(Math.floor((Date.now() - currentQuestionStartTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentQuestion, selectedOption, currentQuestionStartTime]);

  // Calculate Time Spent when finished
  useEffect(() => {
    if (((!currentQuestion && queue.length === 0) || (isMockExamMode && isSubmitted)) && timeSpent === 0 && totalQuestions > 0) {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }
  }, [currentQuestion, queue.length, timeSpent, startTime, totalQuestions, isMockExamMode, isSubmitted]);

  // Handle mock exam submission wrong questions
  useEffect(() => {
    if (isMockExamMode && isSubmitted) {
      const wrong = [];
      let correct = 0;
      queue.forEach(q => {
        const ans = examAnswers[q.id];
        if (!ans || ans.toUpperCase() !== q.correct_answer?.trim().toUpperCase()) {
          wrong.push(q);
        } else {
          correct++;
        }
      });
      setExamWrongQuestions(wrong);
      setMasteredCount(correct);
    }
  }, [isMockExamMode, isSubmitted, queue, examAnswers]);

  const handleNext = (isAnswerCorrect: boolean) => {
    if (isMockExamMode) {
      if (mockExamIndex < queue.length - 1) {
        setMockExamIndex(prev => prev + 1);
        setCurrentQuestion(queue[mockExamIndex + 1]);
        setSelectedOption(examAnswers[queue[mockExamIndex + 1].id] || null);
        setIsCorrect(null);
      }
      return;
    }

    setQueue((prevQueue) => {
      let newQueue = [...prevQueue];
      
      // Remove the current question from the front of the queue
      newQueue.shift();

      if (isAnswerCorrect) {
        setMasteredCount((prev) => prev + 1);
      } else {
        if (!isExamMode && currentQuestion) {
          // Lặp lại ngắt quãng: Add it multiple times to reinforce learning if wrong
          const shuffledAgain = shuffleQuestionOptions(currentQuestion);
          const insertIndex1 = Math.min(2, newQueue.length);
          newQueue.splice(insertIndex1, 0, shuffledAgain);
          
          if (newQueue.length > 3) {
            const insertIndex2 = Math.min(6, newQueue.length);
            const shuffledAgain2 = shuffleQuestionOptions(currentQuestion);
            newQueue.splice(insertIndex2, 0, shuffledAgain2);
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
    if (!currentQuestion) return;
    
    if (isMockExamMode) {
      if (selectedOption === key) {
        // Toggle off
        setSelectedOption(null);
        setExamAnswers(prev => {
          const next = { ...prev };
          delete next[currentQuestion.id];
          return next;
        });
      } else {
        setSelectedOption(key);
        setExamAnswers(prev => ({ ...prev, [currentQuestion.id]: key }));
      }
      return;
    }

    if (selectedOption) return; // Prevent multiple submittions

    setSelectedOption(key);
    
    // Some correct_answer values might have trailing spaces
    const correctKey = currentQuestion.correct_answer?.trim().toUpperCase() || "";
    const isAnswerCorrect = key.toUpperCase() === correctKey;
    
    const timeSpentOnThis = Math.floor((Date.now() - currentQuestionStartTime) / 1000);
    setQuestionTimeSpent(prev => ({
      ...prev,
      [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpentOnThis
    }));

    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(prev => Math.max(prev, newStreak));
      setStreakBroken(false);
      
      if (newStreak >= 3 && !isExamMode) {
        setShowStreakPopup(true);
        const messages = ["Đang vào guồng! 🔥", "Không thể cản bước! 🚀", "Tuyệt vời! ⭐", "Quá đỉnh! 🌟", "Cháy quá! 💥"];
        setStreakPopupText(messages[(newStreak - 3) % messages.length]);
        setTimeout(() => setShowStreakPopup(false), 2000);
      }
      
      {
        let audioEl = timeSpentOnThis < 5 ? correct2AudioRef.current : correctAudioRef.current;
        let playVolume = 0.5;
        if ((newStreak === 5 || newStreak === 7 || (newStreak >= 10 && newStreak % 5 === 0)) && streak5AudioRef.current) {
          audioEl = streak5AudioRef.current;
          playVolume = 1.0;
        }
        
        if (audioEl) {
          audioEl.volume = playVolume;
          audioEl.playbackRate = 1.0;
          audioEl.preservesPitch = true;
          audioEl.currentTime = 0;
          const playPromise = audioEl.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              // Ignore NotSupportedError which happens with empty/missing audio files
              if (e.name !== 'NotSupportedError') {
                console.error("Audio play error", e);
              }
            });
          }
        }
      }
      
      if (isReviewMode) {
        removeWrongQuestion(currentQuestion);
      }
    } else {
      if (streak >= 3) {
        setStreakBroken(true);
      }
      setStreak(0);
      
      {
        let audioEl = wrongAudioRef.current;
        
        if (audioEl) {
          audioEl.volume = 1.0;
          audioEl.playbackRate = 1.0;
          audioEl.currentTime = 0;
          const playPromise = audioEl.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              if (e.name !== 'NotSupportedError') {
                console.error("Audio play error", e);
              }
            });
          }
        }
      }
      
      addWrongQuestion(currentQuestion);
      setExamWrongQuestions(prev => {
        if (!prev.find(q => q.id === currentQuestion.id)) {
          return [...prev, currentQuestion];
        }
        return prev;
      });
    }

    if (isAutoExamMode) {
      setExamAnswers(prev => ({ ...prev, [currentQuestion.id]: key }));
      setTimeout(() => handleNext(isAnswerCorrect), 400);
      return;
    }

    // Record answer for review at the end 
    setExamAnswers(prev => {
       if (!prev[currentQuestion.id]) {
         return { ...prev, [currentQuestion.id]: key };
       }
       return prev;
    });

    // Auto advance with delay to ponder
    const delay = currentQuestion.explanation ? 6000 : (isAnswerCorrect ? 1500 : 3500); 
    setTimeout(() => {
      handleNext(isAnswerCorrect);
    }, delay);
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if a modifier is pressed (ctrl, cmd, alt, shift)
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      // Prevent handling if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (!selectedOption && currentQuestion) {
        const optionKeys = Object.keys(currentQuestion.options || {});
        let keyToSelect: string | null = null;

        if (e.key === 'a' || e.key === 'A' || e.key === '1') keyToSelect = 'A';
        if (e.key === 'b' || e.key === 'B' || e.key === '2') keyToSelect = 'B';
        if (e.key === 'c' || e.key === 'C' || e.key === '3') keyToSelect = 'C';
        if (e.key === 'd' || e.key === 'D' || e.key === '4') keyToSelect = 'D';

        if (keyToSelect && optionKeys.includes(keyToSelect)) {
          handleSelectOption(keyToSelect);
        }
      } else if (isMockExamMode) {
        if (e.key === 'ArrowRight') {
           handleNext(false);
        } else if (e.key === 'ArrowLeft') {
           if (mockExamIndex > 0) {
             setMockExamIndex(prev => prev - 1);
             setCurrentQuestion(queue[mockExamIndex - 1]);
             setSelectedOption(examAnswers[queue[mockExamIndex - 1].id] || null);
             setIsCorrect(null);
           }
        }
      } else if (selectedOption && !isExamMode && isCorrect !== null) {
        if (e.key === 'Enter' || e.key === ' ') {
          // Prevent default scrolling for space
          if (e.key === ' ') e.preventDefault();
          handleNext(isCorrect);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, selectedOption, isCorrect, isExamMode]);

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
  if ((!currentQuestion && queue.length === 0) || (isMockExamMode && isSubmitted)) {
    const isPerfect = examWrongQuestions.length === 0 && Object.keys(examAnswers).length === totalQuestions;
    
    // Calculate correct score by checking answers
    const correctScore = Object.keys(examAnswers).reduce((acc, qId) => {
      const q = chapter.questions.find(q => q.id.toString() === qId);
      if (q && examAnswers[qId]?.toUpperCase() === q.correct_answer?.trim().toUpperCase()) {
        return acc + 1;
      }
      return acc;
    }, 0);

    // Process longest time consumed questions
    const slowQuestions = chapter.questions
      ?.map(q => ({ ...q, time: questionTimeSpent[q.id] || 0 }))
      .filter(q => q.time > 0)
      .sort((a, b) => b.time - a.time)
      .slice(0, 5) || [];

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

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-bold uppercase tracking-wider text-sm sm:text-base text-ink bg-white p-4 sm:p-6 border-4 border-ink shadow-[4px_4px_0px_0px_#121212] mb-10">
            <div className="flex flex-col items-center">
              <span className="text-ink mb-1 flex items-center gap-1"><Clock className="w-4 h-4 sm:w-5 sm:h-5"/> THỜI GIAN</span>
              <span className="font-black text-lg sm:text-xl">{formatTime(timeSpent)}</span>
            </div>
            <div className="w-1 h-12 bg-ink hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <span className="text-ink mb-1">TB / CÂU</span>
              <span className="font-black text-lg sm:text-xl">{totalQuestions > 0 ? (timeSpent / totalQuestions).toFixed(1) : 0}s</span>
            </div>
            {!isExamMode && (
              <>
                <div className="w-1 h-12 bg-ink hidden sm:block"></div>
                <div className="flex flex-col items-center text-semantic-error">
                  <span className="mb-1 flex items-center gap-1 text-ink whitespace-nowrap"><Flame className="w-4 h-4 sm:w-5 sm:h-5 text-semantic-error"/> CHUỖI TỐT NHẤT</span>
                  <span className="font-black text-lg sm:text-xl">{maxStreak}</span>
                </div>
              </>
            )}
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
                const initialQueue = chapter.questions.map(shuffleQuestionOptions);
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
                setStreak(0);
                setMaxStreak(0);
                setStreakBroken(false);
                setMockExamIndex(0);
                setIsSubmitted(false);
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
                  <p className="font-bold text-base sm:text-lg mb-6 leading-relaxed">
                    <span className="bg-primary text-white border-2 border-ink px-2 py-1 mr-3 text-sm align-middle">Q{q.id}</span> 
                    <ContentRenderer content={q.content.split(/(?=Cách hỏi\s*\d*:|cách hỏi\s*\d*:)/i)[0]} className="inline" />
                  </p>
                  
                  <div className="space-y-4 mt-4 p-4 border-l-4 border-ink bg-[#F0F0F0]">
                    <div className="flex flex-col gap-2 mb-2">
                      {Object.entries(q.options).map(([key, text]) => {
                        const isSelected = examAnswers[q.id] === key;
                        const isCorrect = q.correct_answer === key;
                        
                        let optionClass = "flex items-start gap-3 p-3 border-2 border-transparent text-sm sm:text-base ";
                        if (isCorrect) optionClass += "bg-semantic-success/10 border-semantic-success ";
                        else if (isSelected && !isCorrect) optionClass += "bg-semantic-error/10 border-semantic-error line-through ";
                        else optionClass += "bg-white border-ink/20 opacity-70 ";
                        
                        return (
                          <div key={key} className={optionClass}>
                            <span className="font-bold shrink-0 w-6">{key}.</span>
                            <span className="flex-1">{String(text)}</span>
                            {isCorrect && <Check className="w-5 h-5 text-semantic-success inline shrink-0" strokeWidth={3}/>}
                            {isSelected && !isCorrect && <X className="w-5 h-5 text-semantic-error inline shrink-0" strokeWidth={3}/>}
                          </div>
                        )
                      })}
                    </div>
                    {q.explanation && (
                      <div className="mt-4 bg-white p-4 border-4 border-ink text-[15px] sm:text-base font-medium">
                        <p className="font-black uppercase tracking-wider mb-2 text-sm">GIẢI THÍCH:</p>
                        <ContentRenderer content={q.explanation} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Display slow questions for review */}
        {slowQuestions.length > 0 && (
          <div className="mb-16 mt-8">
            <h3 className="heading-bauhaus text-2xl mb-8 border-b-4 border-ink pb-2">CÁC CÂU TỐN NHIỀU THỜI GIAN NHẤT</h3>
            <div className="space-y-6">
              {slowQuestions.map((q, idx) => (
                <div key={q.id} className="card-bauhaus p-6 bg-white border-4 border-ink shadow-[8px_8px_0px_0px_#121212] rounded-none">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <p className="font-bold text-base sm:text-lg leading-relaxed pt-1">
                      <span className="bg-primary-yellow text-ink border-2 border-ink px-2 py-1 mr-3 text-sm align-middle shadow-[2px_2px_0px_0px_#121212]">
                        Q{q.id}
                      </span> 
                      <ContentRenderer content={q.content.split(/(?=Cách hỏi\s*\d*:|cách hỏi\s*\d*:)/i)[0]} className="inline" />
                    </p>
                    <div className="shrink-0 font-display font-bold text-xl bg-[#F0F0F0] border-2 border-ink px-3 py-2 text-primary shadow-[2px_2px_0px_0px_#121212]">
                      {formatTime(q.time)}
                    </div>
                  </div>
                  
                  <div className="p-4 border-l-4 border-ink bg-[#F0F0F0]">
                    <p className="font-bold text-base sm:text-lg">
                      <span className="text-[#0C9E59] mr-3 inline-flex items-center">
                        <Check className="w-5 h-5 mr-1 inline" strokeWidth={3}/>
                        ĐÁP ÁN:
                      </span>
                      <ContentRenderer content={q.correct_answer} className="inline" />
                    </p>
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
    <div ref={containerRef} className={`${isMockExamMode && !isSubmitted ? "max-w-6xl flex flex-col md:flex-row md:items-start gap-8" : "max-w-3xl flex flex-col"} mx-auto w-full px-4 sm:px-0`}>
        {currentQuestion && !isSubmitted && (
          <>
            {isMockExamMode && (
              <div className="w-full md:w-80 shrink-0 bg-white p-6 border-4 border-ink md:sticky md:top-6 order-2 md:order-1 mt-6 md:mt-0 xl:max-h-[calc(100vh-6rem)] flex flex-col xl:overflow-hidden relative shadow-[8px_8px_0_0_#121212]">
                <div className="flex justify-between items-center mb-6 border-b-4 border-ink pb-4">
                  <p className="font-bold text-ink uppercase text-xl">Danh sách<br/>câu hỏi</p>
                  <button 
                    onClick={() => setIsSubmitted(true)}
                    className="px-4 py-3 bg-primary font-bold text-white border-2 border-ink hover:bg-opacity-90 shadow-[4px_4px_0px_#121212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#121212] transition-all"
                  >
                    NỘP BÀI
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-3 pr-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent pb-4">
                  {queue.map((q, idx) => {
                    const ans = examAnswers[q.id];
                    const isCurrent = idx === mockExamIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setMockExamIndex(idx);
                          setCurrentQuestion(q);
                          setSelectedOption(examAnswers[q.id] || null);
                          setIsCorrect(null);
                        }}
                        className={`aspect-square border-2 border-ink font-bold flex items-center justify-center transition-all
                          ${isCurrent ? 'bg-primary text-white border-[3px] scale-110 shadow-[2px_2px_0px_#121212] relative z-10 wobbly-border' : 
                            ans ? 'bg-primary-yellow text-ink shadow-[2px_2px_0px_#121212]' : 'bg-surface hover:bg-surface-soft'}
                        `}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-6 pt-4 border-t-4 border-ink text-sm font-bold flex flex-col gap-2">
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 bg-primary border-2 border-ink"></div>
                     <span>Đang làm</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 bg-primary-yellow border-2 border-ink"></div>
                     <span>Đã chọn</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 bg-surface border-2 border-ink"></div>
                     <span>Chưa làm</span>
                   </div>
                </div>
              </div>
            )}
            <div className={`flex-1 w-full max-w-3xl flex flex-col min-w-0 ${isMockExamMode ? 'order-1 md:order-2' : ''}`}>
            {/* Question Meta */}
            <div className="flex items-center justify-between mb-8 pt-2">
              <button onClick={onBack} className="flex items-center text-ink hover:text-primary transition-colors group z-20 relative flex-shrink-0">
                <ArrowLeft strokeWidth={2.5} className="w-6 h-6 mr-1 sm:mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-sans text-base sm:text-lg border-b-2 border-transparent group-hover:border-primary hidden sm:inline">Quay lại</span>
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Streak Indicator */}
                {!isExamMode && (
                  <motion.div 
                    animate={
                      streak >= 3 
                        ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] } 
                        : streakBroken 
                        ? { opacity: 0.5, filter: "grayscale(100%)" } 
                        : {}
                    }
                    transition={streak >= 3 ? { repeat: Infinity, duration: 1.5 } : {}}
                    className={`flex items-center gap-1.5 border-2 shadow-[2px_2px_0px_0px_#121212] px-2 sm:px-3 py-1 font-bold ${
                      streak >= 3 
                        ? "bg-primary-yellow border-semantic-error text-semantic-error" 
                        : streak > 0 
                        ? "bg-white border-ink text-primary" 
                        : "bg-surface border-ink text-slate"
                    }`}
                  >
                    <Flame className={`w-4 h-4 sm:w-5 sm:h-5 ${streak >= 3 ? "animate-pulse" : ""}`} />
                    <span className="text-sm sm:text-base">{streak}</span>
                    
                    {/* Streak Popup Messages */}
                    <AnimatePresence>
                      {showStreakPopup && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.8 }}
                          animate={{ opacity: 1, y: -40, scale: 1.1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute -top-4 right-0 z-50 whitespace-nowrap text-semantic-warning font-black text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] pointer-events-none"
                        >
                          {streakPopupText}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
                
                <div className="flex items-center gap-2 bg-white border-2 border-ink shadow-[4px_4px_0px_0px_#121212] px-3 py-1 rounded-none hidden lg:flex">
                  <span className="text-sm font-bold">Vol</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      if (parseFloat(e.target.value) > 0) setIsMuted(false);
                    }}
                    className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary border border-ink"
                  />
                </div>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="bg-white border-2 border-ink shadow-[4px_4px_0px_0px_#121212] p-2 hover:-translate-y-1 transition-transform rounded-none flex-shrink-0"
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
            <div className="mb-6 relative z-10">
              <h1 className="font-bold text-base sm:text-[17px] leading-relaxed text-ink">
                <span className="inline-block bg-surface-soft border-2 border-ink px-2 py-0.5 rounded-sm -rotate-2 mr-3 align-middle shadow-[2px_2px_0px_#2d2d2d] tabular-nums text-sm">
                  Q{currentQuestion.id} &bull; {currentQuestionTimer}s
                </span>
                <ContentRenderer content={mainQuestion} className="inline" />
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
                <div className="mt-4 bg-[#F0F0F0] border-2 border-ink p-4 text-left font-sans text-sm sm:text-[15px] text-ink rounded-none">
                  <p className="font-bold underline decoration-wavy decoration-ink mb-2">Các cách hỏi khác:</p>
                  <ul className="space-y-2 list-disc list-inside marker:text-primary">
                    {otherWays.map((way, idx) => (
                       <li key={idx} className="leading-snug font-medium"><ContentRenderer content={way} className="inline" /></li>
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
                
                let buttonClass = "w-full text-left px-4 sm:px-5 py-3 sm:py-4 rounded-none border-[2px] sm:border-[4px] transition-all flex items-center gap-3 sm:gap-4 group ";
                let circleClass = "w-8 h-8 sm:w-10 sm:h-10 border-[3px] flex items-center justify-center font-display font-bold text-base sm:text-lg flex-shrink-0 transition-colors bg-white shadow-[2px_2px_0px_#2d2d2d] ";
                let textClass = "font-sans text-[15px] sm:text-base leading-snug flex-1 font-medium ";
                
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
                    disabled={isMockExamMode ? false : !!selectedOption}
                  >
                    <span className={circleClass}>{key}</span>
                    <span className={textClass}>{String(text)}</span>
                    
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
                  <p className="font-black uppercase tracking-tighter text-lg mr-2 px-2 py-1 bg-[#F0F0F0] border-2 border-ink shadow-[2px_2px_0px_#121212]">GIẢI THÍCH:</p>
                  {(currentQuestion.difficulty || currentQuestion.bloom_level || currentQuestion.question_type) && (
                    <div className="flex flex-wrap gap-2 text-sm font-sans text-ink font-medium">
                      {currentQuestion.difficulty && <span className="border-2 border-ink/40 border-dashed px-3 py-0.5 rounded-full rotate-1">{currentQuestion.difficulty}</span>}
                      {currentQuestion.bloom_level && <span className="border-2 border-ink/40 border-dashed px-3 py-0.5 rounded-full -rotate-1">{currentQuestion.bloom_level}</span>}
                      {currentQuestion.question_type && <span className="border-2 border-ink/40 border-dashed px-3 py-0.5 rounded-full rotate-2">{currentQuestion.question_type}</span>}
                    </div>
                  )}
                </div>
                <div className="font-sans text-sm sm:text-[15px] leading-relaxed font-medium bg-[#F0F0F0] border-[2px] sm:border-[4px] border-ink p-4 sm:p-5 shadow-[4px_4px_0px_0px_#121212] rounded-none">
                  <ContentRenderer content={currentQuestion.explanation} />
                  
                  {(currentQuestion.knowledge_area || currentQuestion.source_reference) && (
                    <div className="mt-4 pt-4 border-t-2 border-ink/20 text-sm flex flex-col gap-2">
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
                  Xem Giáo Trình
                </button>
              </div>
            )}
            <div ref={feedbackRef} className="pb-28 md:pb-0 min-h-4" />
          </div>

          <PdfViewerModal
            isOpen={isPdfModalOpen}
            onClose={() => setIsPdfModalOpen(false)}
            fileUrl={currentPdfUrl}
            title="Giáo Trình"
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
              <button
                onClick={() => handleNext(isCorrect!)}
                className="btn-primary px-8 py-4 ml-4 shrink-0 text-base"
              >
                Câu tiếp
              </button>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
};

  const [currentSong, setCurrentSong] = useState(() => Math.random() > 0.5 ? '/song.mp3' : '/song2.mp3');

  useEffect(() => {
    setCurrentSong(Math.random() > 0.5 ? '/song.mp3' : '/song2.mp3');
  }, [chapter.chapter]);

  return (
    <>
      <audio ref={audioRef} src={currentSong} autoPlay loop muted={isMuted} className="hidden" />
      <audio ref={correctAudioRef} src="/true.mp3" preload="auto" className="hidden" />
      <audio ref={correct2AudioRef} src="/true2.mp3" preload="auto" className="hidden" />
      <audio ref={wrongAudioRef} src="/false.mp3" preload="auto" className="hidden" />
      <audio ref={endAudioRef} src="/end.mp3" preload="auto" className="hidden" />
      <audio ref={streak3AudioRef} src="/sreak3.mp3" preload="auto" className="hidden" />
      <audio ref={streak5AudioRef} src="/streak5.mp3" preload="auto" className="hidden" />
      {renderQuizContent()}
    </>
  );
}
