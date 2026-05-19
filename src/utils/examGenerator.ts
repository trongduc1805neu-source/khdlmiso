import { Question, Chapter } from '../types';
import allTopicsData from '../data/alltopics.json';

import de1 from '../data/de1.json';
import de2 from '../data/de2.json';

export const TOPIC_NAMES: Record<string, string> = {
  T1: "Tổng quan Khoa học Dữ liệu & Vai trò nghề nghiệp",
  T2: "Thu thập & Làm sạch Dữ liệu",
  T3: "Tiền xử lý Dữ liệu (Xử lý thiếu, Outlier, Chuẩn hóa, Mã hóa)",
  T4: "Machine Learning – Tổng quan & Phân loại bài toán",
  T5: "Đánh giá mô hình (Metrics)",
  T6: "Hồi quy tuyến tính (Linear Regression) & KNN",
  T7: "Python – Cú pháp & Cấu trúc điều khiển",
  T8: "Python – Kết quả đoạn mã (Code Tracing)",
  T9: "Python – Kiểu dữ liệu (List, Set, Dict, Tuple)",
  T10: "NumPy – Mảng & Phép toán",
  T11: "Pandas – Series",
  T12: "Pandas – DataFrame: Tạo, Xem, Thống kê",
  T13: "Pandas – Indexing, loc/iloc",
  T14: "Pandas – Đọc & Ghi File (CSV, Excel, JSON)",
  T15: "Pandas – Merge & Concat",
  T16: "Pandas – Pivot, Melt, Stack/Unstack",
  T17: "Pandas – Chỉ mục phân cấp (Hierarchical Index)",
  T18: "Matplotlib – Vẽ biểu đồ cơ bản",
  T19: "Trực quan hóa Dữ liệu – Lý thuyết & Lựa chọn biểu đồ"
};

const topic_config: Record<string, { min: number; max: number; role: string; freq: number }> = {
  T1:  { min: 1, max: 3, role: "phu",  freq: 1.0 },
  T2:  { min: 0, max: 2, role: "hiem", freq: 1.0 },
  T3:  { min: 1, max: 4, role: "phu",  freq: 1.0 },
  T4:  { min: 1, max: 4, role: "phu",  freq: 1.0 },
  T5:  { min: 0, max: 2, role: "hiem", freq: 0.5 },
  T6:  { min: 0, max: 2, role: "hiem", freq: 1.0 },
  T7:  { min: 1, max: 3, role: "phu",  freq: 1.0 },
  T8:  { min: 2, max: 5, role: "core", freq: 1.0 },
  T9:  { min: 0, max: 2, role: "hiem", freq: 0.5 },
  T10: { min: 2, max: 5, role: "core", freq: 1.0 },
  T11: { min: 0, max: 2, role: "hiem", freq: 0.5 },
  T12: { min: 2, max: 4, role: "core", freq: 1.0 },
  T13: { min: 1, max: 2, role: "phu",  freq: 1.0 },
  T14: { min: 3, max: 6, role: "core", freq: 1.0 },
  T15: { min: 1, max: 2, role: "phu",  freq: 1.0 },
  T16: { min: 1, max: 4, role: "phu",  freq: 1.0 },
  T17: { min: 1, max: 3, role: "phu",  freq: 1.0 },
  T18: { min: 2, max: 4, role: "core", freq: 1.0 },
  T19: { min: 3, max: 6, role: "core", freq: 1.0 },
};

const difficulty_map = {
  easy:   ["T1", "T2", "T7", "T9", "T11", "T18"],
  medium: ["T3", "T4", "T8", "T10", "T12", "T13", "T14", "T15", "T16"],
  hard:   ["T5", "T6", "T17", "T19"]
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generatePracticeExam(): Chapter {
  const blueprint: Record<string, number> = {};
  
  // Step 2: rough blueprint
  for (const T in topic_config) {
    const config = topic_config[T];
    if (config.role === "core" || config.role === "phu") {
      blueprint[T] = randInt(config.min, config.max);
    } else if (config.role === "hiem") {
      if (Math.random() < config.freq) {
        blueprint[T] = randInt(1, config.max);
      } else {
        blueprint[T] = 0;
      }
    }
  }

  // Step 3: balance total to 40
  let total = Object.values(blueprint).reduce((a, b) => a + b, 0);
  
  if (total > 40) {
    while (total > 40) {
      const candidates = Object.keys(blueprint).filter(T => 
        blueprint[T] > topic_config[T].min && topic_config[T].role !== "core"
      );
      if (candidates.length === 0) break; // fallback
      const idx = randInt(0, candidates.length - 1);
      blueprint[candidates[idx]] -= 1;
      total -= 1;
    }
  } else if (total < 40) {
    while (total < 40) {
      const candidates = Object.keys(blueprint).filter(T => 
        blueprint[T] < topic_config[T].max
      );
      if (candidates.length === 0) break;
      const idx = randInt(0, candidates.length - 1);
      blueprint[candidates[idx]] += 1;
      total += 1;
    }
  }

  // Step 4: adjust difficulty limits
  for (let i = 0; i < 50; i++) { // Max iterations to balance diff
    const easyCount = difficulty_map.easy.reduce((s, T) => s + blueprint[T], 0);
    const mediumCount = difficulty_map.medium.reduce((s, T) => s + blueprint[T], 0);
    const hardCount = difficulty_map.hard.reduce((s, T) => s + blueprint[T], 0);

    let fromDiff: string | null = null, toDiff: string | null = null;
    if (easyCount < 9) toDiff = "easy";
    else if (easyCount > 15) fromDiff = "easy";
    
    if (mediumCount < 17) toDiff = "medium";
    else if (mediumCount > 23) fromDiff = "medium";
    
    if (hardCount < 5) toDiff = "hard";
    else if (hardCount > 11) fromDiff = "hard";

    if (!fromDiff && !toDiff) break; // Balanced
    
    let decrementCand: string[] = [];
    if (fromDiff) {
      decrementCand = difficulty_map[fromDiff as keyof typeof difficulty_map].filter(T => blueprint[T] > topic_config[T].min && topic_config[T].role !== "core");
    } else {
      const safeDiffs = ["easy", "medium", "hard"].filter(d => {
         if (d === "easy") return easyCount > 9;
         if (d === "medium") return mediumCount > 17;
         return hardCount > 5;
      });
      if (safeDiffs.length > 0) {
         decrementCand = difficulty_map[safeDiffs[0] as keyof typeof difficulty_map].filter(T => blueprint[T] > topic_config[T].min && topic_config[T].role !== "core");
      }
    }
    
    let incrementCand: string[] = [];
    if (toDiff) {
       incrementCand = difficulty_map[toDiff as keyof typeof difficulty_map].filter(T => blueprint[T] < topic_config[T].max);
    } else {
       const safeDiffs = ["easy", "medium", "hard"].filter(d => {
         if (d === "easy") return easyCount < 15;
         if (d === "medium") return mediumCount < 23;
         return hardCount < 11;
      });
      if (safeDiffs.length > 0) {
         incrementCand = difficulty_map[safeDiffs[0] as keyof typeof difficulty_map].filter(T => blueprint[T] < topic_config[T].max);
      }
    }

    if (decrementCand.length > 0 && incrementCand.length > 0) {
      const fromT = decrementCand[randInt(0, decrementCand.length - 1)];
      const toT = incrementCand[randInt(0, incrementCand.length - 1)];
      blueprint[fromT] -= 1;
      blueprint[toT] += 1;
    } else {
      break; // Can't adjust
    }
  }

  // Step 5 & 6: Select questions and prioritize unseen ones
  // Pre-process alltopics into groups
  const questionBank: Record<string, any[]> = {};
  (allTopicsData as any[]).forEach(q => {
    if (!questionBank[q.topic]) questionBank[q.topic] = [];
    questionBank[q.topic].push(q);
  });

  let seenQuestions: Record<string, number> = {};
  try {
    seenQuestions = JSON.parse(localStorage.getItem('seen_practice_questions') || '{}');
  } catch (e) {}

  let examQuestions: Question[] = [];
  const selectedIds: string[] = [];
  
  for (const T in blueprint) {
    const count = blueprint[T];
    if (count > 0) {
      const topicName = TOPIC_NAMES[T];
      const available = questionBank[topicName] || [];
      
      // Sort by seen count ascending, then random
      const shuffled = [...available].sort((a, b) => {
        const seenA = seenQuestions[a.id] || 0;
        const seenB = seenQuestions[b.id] || 0;
        if (seenA === seenB) return 0.5 - Math.random();
        return seenA - seenB;
      });
      
      const selected = shuffled.slice(0, count);
      
      // Map to standard Question interface
      const mappedSelected: Question[] = selected.map(q => {
        selectedIds.push(q.id);
        return {
          id: q.id,
          content: q.question,
          options: q.options,
          correct_answer: q.answer,
          knowledge_area: q.topic,
          chapterId: 1000 // Virtual chapter
        };
      });
      
      examQuestions.push(...mappedSelected);
    }
  }

  // Update seen context for future
  try {
    selectedIds.forEach(id => {
      seenQuestions[id] = (seenQuestions[id] || 0) + 1;
    });
    localStorage.setItem('seen_practice_questions', JSON.stringify(seenQuestions));
  } catch (e) {}

  // Shuffle final list
  examQuestions.sort(() => 0.5 - Math.random());

  return {
    chapter: 1000,
    chapter_title: `Luyện Đề Chuẩn (${new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})})`,
    timeLimit: 40 * 60, // 40 minutes
    questions: examQuestions
  };
}

export function generateSpecificExam(examId: 'de1' | 'de2'): Chapter {
  const data = examId === 'de1' ? de1 : de2;
  
  const mappedQuestions: Question[] = (data as any[]).map(q => ({
    id: q.id,
    content: q.question,
    options: q.options,
    correct_answer: q.answer,
    knowledge_area: q.topic,
    chapterId: 1000 // Virtual chapter
  }));

  return {
    chapter: 1000,
    chapter_title: `Luyện Đề Chuẩn (${examId === 'de1' ? 'Đề 1' : 'Đề 2'})`,
    timeLimit: 40 * 60, // 40 minutes
    questions: mappedQuestions
  };
}

export function generateTopicPractice(topicId: string): Chapter {
  const topicName = TOPIC_NAMES[topicId];
  if (!topicName) throw new Error("Invalid topic ID");

  const topicQuestions = (allTopicsData as any[]).filter(q => q.topic === topicName);
  
  const mappedQuestions: Question[] = topicQuestions.map(q => ({
    id: q.id,
    content: q.question,
    options: q.options,
    correct_answer: q.answer,
    knowledge_area: q.topic,
    chapterId: 2000 // Virtual chapter for topic mode
  }));

  // Shuffle the questions so it's fresh each time
  mappedQuestions.sort(() => 0.5 - Math.random());

  return {
    chapter: 2000,
    chapter_title: `Ôn tập: ${topicName}`,
    questions: mappedQuestions
  };
}
