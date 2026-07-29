"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, Award, RotateCw, AlertTriangle, Settings, CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { subjectData } from "@/data/subjectData";

interface ExamQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function SubjectExamPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const subject = subjectData[subjectId];

  // Exam states
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [examFinished, setExamFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Timer states
  const [durationMinutes, setDurationMinutes] = useState(30); // Default 30 mins
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Final Exam Questions list
  const examQuestions: ExamQuestion[] = [
    {
      question: "A 54-year-old patient presents with progressive clinical indicators mapped to this course syllabus. Laboratory panels demonstrate metabolic abnormalities and tissue distress. Which of the following is the most high-yield initial cellular process involved in this presentation?",
      options: [
        "Anaerobic metabolic shift due to enzyme depletion",
        "Reversible cytoplasmic swelling and ribosome detachment",
        "Irreversible mitochondrial membrane lipid breakdown",
        "Irreversible chromatin condensation and karyorrhexis"
      ],
      correctAnswer: 1,
      explanation: "Reversible cellular injury is characterized histologically by cell swelling, hydropic change, blebbing, and ribosome detachment from the rough endoplasmic reticulum. Irreversible damage is marked by membrane rupture, lysosomal leakage, and calcium influx."
    },
    {
      question: "Which secondary pharmacological or physiological compensation is most critical to address during the clinical management of advanced organ system pathologies in this cohort?",
      options: [
        "Inhibition of target tissue synthesis pathways",
        "Restoration of homeostatic feedback balance",
        "Blockade of calcium-dependent translocase enzymes",
        "Activation of systemic parasympathetic feedback loops"
      ],
      correctAnswer: 1,
      explanation: "The primary goal of systemic therapy is the restoration of homeostatic feedback balance, minimizing tissue overload and preventing secondary cascade injury to adjacent vascular territories."
    }
  ];

  // Load duration on mount
  useEffect(() => {
    if (!subjectId) return;
    const savedDuration = localStorage.getItem(`medicinety_subject_${subjectId}_exam_duration`);
    if (savedDuration) {
      const minutes = parseInt(savedDuration);
      setDurationMinutes(minutes);
      setTimeLeft(minutes * 60);
    }
  }, [subjectId]);

  // Handle timer ticker
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      // Auto-submit when timer hits 0
      handleFinishExam();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isTimerRunning]);

  const handleStartExam = () => {
    setIsTimerRunning(true);
  };

  const handleSaveTimerSetting = (minutes: number) => {
    setDurationMinutes(minutes);
    setTimeLeft(minutes * 60);
    localStorage.setItem(`medicinety_subject_${subjectId}_exam_duration`, minutes.toString());
    setShowSettings(false);
  };

  const handleNext = () => {
    if (selectedOption !== null) {
      setAnswers(prev => ({ ...prev, [activeQuestionIdx]: selectedOption }));
    }

    if (activeQuestionIdx < examQuestions.length - 1) {
      setActiveQuestionIdx(prev => prev + 1);
      const previousAnswer = answers[activeQuestionIdx + 1];
      setSelectedOption(previousAnswer !== undefined ? previousAnswer : null);
    } else {
      handleFinishExam();
    }
  };

  const handlePrev = () => {
    if (selectedOption !== null) {
      setAnswers(prev => ({ ...prev, [activeQuestionIdx]: selectedOption }));
    }

    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(prev => prev - 1);
      setSelectedOption(answers[activeQuestionIdx - 1]);
    }
  };

  const handleFinishExam = () => {
    setIsTimerRunning(false);
    
    // Calculate Score
    let finalScore = 0;
    const finalAnswers = { ...answers };
    if (selectedOption !== null) {
      finalAnswers[activeQuestionIdx] = selectedOption;
    }

    examQuestions.forEach((q, idx) => {
      if (finalAnswers[idx] === q.correctAnswer) {
        finalScore++;
      }
    });

    setScore(finalScore);
    setExamFinished(true);
  };

  const handleResetExam = () => {
    setActiveQuestionIdx(0);
    setSelectedOption(null);
    setAnswers({});
    setExamFinished(false);
    setScore(0);
    setTimeLeft(durationMinutes * 60);
    setIsTimerRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!subject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-brand-bg text-brand-text p-6">
        <h1 className="text-xl font-bold">Subject not found</h1>
        <Link href="/" className="mt-4 text-[#0D9488] font-bold">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-brand-bg text-brand-text pb-20 transition-colors duration-300">
      <div className="w-full px-4 mt-8 space-y-8 xl:max-w-[1200px] mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href={`/subject/${subjectId}`} className="flex items-center gap-1 text-xs font-bold text-slate-450 hover:text-[#0D9488] transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Subject
          </Link>
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-teal-950/20 border border-slate-200 dark:border-teal-500/10 text-slate-450 hover:text-[#0D9488] dark:hover:text-teal-400 rounded-md transition-all shadow-sm"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Timer Config Dropdown Card */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-teal-500/30 rounded-xl p-5 shadow-lg max-w-sm ml-auto"
            >
              <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-wider mb-3">Adjust Exam Timer</h4>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min="1" 
                  max="180" 
                  value={durationMinutes} 
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                  className="w-20 bg-slate-50 dark:bg-black border border-slate-200 dark:border-teal-500/20 text-xs text-black dark:text-white px-2 py-1 rounded font-bold"
                />
                <span className="text-xs font-bold text-slate-500 self-center">minutes</span>
                <button 
                  onClick={() => handleSaveTimerSetting(durationMinutes)}
                  className="px-4 py-1.5 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white text-xs font-bold rounded shadow transition-all ml-auto"
                >
                  Save
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Header */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0D9488] bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-md border border-teal-200/20 inline-block">
            {subject.name}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-black dark:text-white tracking-tight">Electronic Board Examination</h1>
        </div>

        {/* Exam Body Container */}
        <div className="max-w-3xl mx-auto">
          {!isTimerRunning && !examFinished ? (
            /* Start Panel */
            <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-teal-500/30 rounded-xl p-10 text-center shadow-lg space-y-6">
              <div className="w-16 h-16 bg-[#0D9488]/10 text-[#0D9488] dark:text-teal-400 rounded-full flex items-center justify-center mx-auto shadow-inner border border-teal-500/10">
                <Clock className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-black dark:text-white">Ready to begin the examination?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  You have exactly <span className="font-extrabold text-black dark:text-white">{durationMinutes} minutes</span> to complete {examQuestions.length} comprehensive questions. The timer will countdown once you click start.
                </p>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleStartExam}
                  className="px-8 py-3.5 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  Start Examination
                </button>
              </div>
            </div>
          ) : examFinished ? (
            /* Result Panel */
            <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-teal-500/30 rounded-xl p-10 text-center shadow-lg space-y-6">
              <div className="w-16 h-16 bg-[#0D9488]/10 text-[#0D9488] dark:text-teal-400 rounded-full flex items-center justify-center mx-auto border border-teal-500/10">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-black dark:text-white">Examination Finished!</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Your score is: <span className="font-black text-[#0D9488] dark:text-teal-400 text-lg">{score} / {examQuestions.length}</span> ({(score / examQuestions.length * 100).toFixed(0)}%)
                </p>
              </div>

              {/* Review Cards list */}
              <div className="text-left space-y-4 pt-4 border-t border-slate-100 dark:border-teal-500/20">
                <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Incorrect Answers Review</h4>
                {examQuestions.map((q, idx) => {
                  const isCorrect = answers[idx] === q.correctAnswer;
                  return (
                    <div key={idx} className={`p-4 rounded-lg border text-xs font-medium space-y-2
                      ${isCorrect ? "bg-emerald-500/5 border-emerald-500/25" : "bg-rose-500/5 border-rose-500/25"}
                    `}>
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-black dark:text-white">Question {idx + 1}</span>
                        <span className={`font-extrabold ${isCorrect ? "text-emerald-500" : "text-rose-500"}`}>
                          {isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-bold">{q.question}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed mt-2 bg-slate-50 dark:bg-black/40 p-2.5 rounded border border-slate-100 dark:border-teal-500/5">
                        <span className="font-extrabold text-black dark:text-white block mb-0.5">Explanation:</span>
                        {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex gap-4 justify-center select-none">
                <button 
                  onClick={handleResetExam}
                  className="px-6 py-3 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-teal-950/20 border border-slate-200 dark:border-teal-500/20 text-black dark:text-white font-extrabold text-xs tracking-wider uppercase rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <RotateCw className="w-4 h-4" /> Restart Exam
                </button>
                <Link href={`/subject/${subjectId}`}>
                  <button className="px-6 py-3 bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg shadow-md hover:shadow-lg transition-all">
                    Return to Course
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            /* Active Exam */
            <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200/50 dark:border-teal-500/30 rounded-xl shadow-lg overflow-hidden flex flex-col justify-between">
              
              {/* Exam Info Bar */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-black/40 border-b border-slate-200/50 dark:border-teal-500/25 flex justify-between items-center text-white select-none">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Question {activeQuestionIdx + 1} of {examQuestions.length}
                </span>
                
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-extrabold
                  ${timeLeft < 300 
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse" 
                    : "bg-teal-500/5 text-[#0D9488] dark:text-teal-400 border-teal-500/20"}
                `}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* Question Body */}
              <div className="p-6 md:p-8 space-y-6">
                <p className="text-sm md:text-base font-bold text-black dark:text-white leading-relaxed">
                  {examQuestions[activeQuestionIdx].question}
                </p>

                <div className="space-y-3">
                  {examQuestions[activeQuestionIdx].options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    let btnStyle = "border-slate-200 hover:border-[#0D9488]/40 hover:bg-teal-50/50 text-black dark:border-teal-500/25 dark:hover:border-[#0D9488]/40 dark:hover:bg-black dark:text-white";
                    if (isSelected) {
                      btnStyle = "bg-[#0D9488]/5 border-[#0D9488] text-[#0D9488] dark:text-teal-400";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedOption(idx)}
                        className={`w-full text-left p-4 rounded-lg border text-xs font-bold flex items-center gap-3 transition-all ${btnStyle}`}
                      >
                        <span className={`w-6 h-6 rounded-md text-[10px] font-extrabold border flex items-center justify-center shrink-0 transition-all
                          ${isSelected ? "bg-[#0D9488] border-[#0D9488] text-white" : "bg-white dark:bg-black border-slate-200 dark:border-teal-500/20 text-black dark:text-white"}
                        `}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-teal-500/10 flex justify-between items-center select-none">
                <button
                  onClick={handlePrev}
                  disabled={activeQuestionIdx === 0}
                  className="px-4 py-2 border border-slate-200 dark:border-teal-500/20 text-black dark:text-white text-xs font-bold rounded-md hover:bg-slate-100 dark:hover:bg-teal-950/20 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  Previous
                </button>
                
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-[#0D9488] hover:bg-[#0D9488]/95 text-white text-xs font-bold rounded-md transition-all shadow-md hover:shadow-lg"
                >
                  {activeQuestionIdx < examQuestions.length - 1 ? "Next Question" : "Finish Exam"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}