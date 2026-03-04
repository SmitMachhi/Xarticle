import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { LESSONS } from '../../lib/curriculum';
import { useProgressStore } from '../../hooks/useProgress';
import { ServerLifecycle, HttpPacketAnatomy, UrlBreakdown, StatusCodeWheel, RequestLifecycle } from '../visuals';
import type { LessonSection } from '../../types/curriculum';

const VISUAL_COMPONENTS: Record<string, React.FC> = {
  ServerLifecycle,
  HttpPacketAnatomy,
  UrlBreakdown,
  StatusCodeWheel,
  RequestLifecycle,
};

interface LessonViewerProps {
  lessonId: string;
  onBack: () => void;
  onComplete: () => void;
}

export function LessonViewer({ lessonId, onBack, onComplete }: LessonViewerProps) {
  const lesson = LESSONS.find(l => l.id === lessonId);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  
  const { completeLesson } = useProgressStore();

  if (!lesson) return null;

  const currentSection = lesson.sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === lesson.sections.length - 1;

  const handleNext = () => {
    if (isLastSection) {
      const score = calculateScore();
      completeLesson(lessonId, score);
      onComplete();
    } else {
      setCurrentSectionIndex(prev => prev + 1);
      setShowResults(false);
    }
  };

  const handlePrevious = () => {
    setCurrentSectionIndex(prev => Math.max(0, prev - 1));
    setShowResults(false);
  };

  const calculateScore = () => {
    let correct = 0;
    let total = 0;
    
    lesson.sections.forEach(section => {
      if (section.type === 'quiz' && section.quiz) {
        section.quiz.questions.forEach(q => {
          total++;
          if (quizAnswers[q.id] === q.correctAnswer) {
            correct++;
          }
        });
      }
    });
    
    return total > 0 ? Math.round((correct / total) * 100) : 100;
  };

  const handleQuizAnswer = (questionId: string, answer: string) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const renderSection = (section: LessonSection) => {
    switch (section.type) {
      case 'concept':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
            <p className="text-gray-600 text-lg leading-relaxed">{section.content}</p>
            
            {section.visualComponent && VISUAL_COMPONENTS[section.visualComponent] && (
              <div className="mt-6">
                {(() => {
                  const Component = VISUAL_COMPONENTS[section.visualComponent];
                  return <Component />;
                })()}
              </div>
            )}
          </div>
        );
      
      case 'code':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
            <p className="text-gray-600">{section.content}</p>
            
            {section.codeExample && (
              <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
                <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-gray-400 text-sm font-mono">
                    {section.codeExample.file}
                  </span>
                </div>
                <pre className="p-4 overflow-x-auto">
                  <code className="text-sm font-mono">
                    {section.codeExample.code.split('\n').map((line, i) => (
                      <div
                        key={i}
                        className={`${
                          section.codeExample?.highlights?.includes(i + 1)
                            ? 'bg-blue-500/20 -mx-4 px-4'
                            : ''
                        }`}
                      >
                        <span className="text-gray-500 select-none w-8 inline-block">
                          {i + 1}
                        </span>
                        <span className="text-gray-300">{line}</span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            )}
          </div>
        );
      
      case 'quiz':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
            
            {section.quiz?.questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-900 font-bold border border-gray-200">
                    {idx + 1}
                  </span>
                  
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-4">{q.question}</p>
                    
                    <div className="space-y-2">
                      {q.options?.map((option) => {
                        const isSelected = quizAnswers[q.id] === option;
                        const isCorrect = option === q.correctAnswer;
                        const showResult = showResults && isSelected;
                        
                        return (
                          <button
                            key={option}
                            onClick={() => !showResults && handleQuizAnswer(q.id, option)}
                            disabled={showResults}
                            className={`w-full p-3 rounded-lg text-left transition-all ${
                              showResult && isCorrect
                                ? 'bg-green-100 border-2 border-green-500'
                                : showResult && !isCorrect
                                ? 'bg-red-100 border-2 border-red-500'
                                : isSelected
                                ? 'bg-blue-50 border-2 border-blue-500'
                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between"
                            >
                              <span className="text-gray-800">{option}</span>
                              
                              {showResult && isCorrect && (
                                <CheckCircle2 className="text-green-600" size={20} />
                              )}
                              {showResult && !isCorrect && isSelected && (
                                <XCircle className="text-red-600" size={20} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    {showResults && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <p className="text-gray-700">{q.explanation}</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {!showResults && (
              <button
                onClick={() => setShowResults(true)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Check Answers
              </button>
            )}
          </div>
        );
      
      case 'summary':
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg"
            >
              <CheckCircle2 size={48} className="text-white" />
            </motion.div>
            
            <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>
            <p className="text-gray-600 text-lg">{section.content}</p>
            
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-100 rounded-full border border-yellow-300">
              <span className="text-yellow-700 font-bold">+{lesson.xp} XP Earned!</span>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {currentSectionIndex + 1} / {lesson.sections.length}
              </span>
              
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{
                    width: `${((currentSectionIndex + 1) / lesson.sections.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
          
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{lesson.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSectionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderSection(currentSection)}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentSectionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={20} />
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentSection.type === 'quiz' && !showResults}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isLastSection ? 'Complete Lesson' : 'Next'}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
