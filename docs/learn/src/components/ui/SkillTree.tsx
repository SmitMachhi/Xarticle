import { motion } from 'framer-motion';
import { Lock, CheckCircle2, PlayCircle, Star } from 'lucide-react';
import { WORLDS, LESSONS } from '../../lib/curriculum';
import { useProgressStore } from '../../hooks/useProgress';
import { COLORS } from '../../types/curriculum';

interface SkillTreeProps {
  onSelectLesson: (lessonId: string) => void;
}

export function SkillTree({ onSelectLesson }: SkillTreeProps) {
  const { completedLessons, totalXP, currentStreak } = useProgressStore();

  const getLessonStatus = (lessonId: string, prerequisites: string[]) => {
    if (completedLessons.includes(lessonId)) return 'completed';
    
    const allPrereqsMet = prerequisites.every(p => completedLessons.includes(p));
    if (allPrereqsMet) return 'available';
    
    return 'locked';
  };

  return (
    <div className="p-6 min-h-screen bg-slate-950">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center gap-6 mb-8">
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full">
          <Star className="text-yellow-400" size={24} />
          <span className="text-white font-bold">{totalXP} XP</span>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full">
          <span className="text-2xl">🔥</span>
          <span className="text-white font-bold">{currentStreak} Day Streak</span>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full">
          <span className="text-white font-bold">
            {completedLessons.length} / {LESSONS.length} Lessons
          </span>
        </div>
      </div>

      {/* Worlds */}
      <div className="space-y-8">
        {WORLDS.map((world, worldIndex) => {
          const worldLessons = LESSONS.filter(l => l.worldId === world.id);
          const worldProgress = worldLessons.filter(l => 
            completedLessons.includes(l.id)
          ).length;
          const isWorldComplete = worldProgress === worldLessons.length;
          const isWorldLocked = world.locked;

          return (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: worldIndex * 0.1 }}
              className="relative"
            >
              {/* World Header */}
              <div
                className="flex items-center justify-between p-4 rounded-xl mb-4"
                style={{ backgroundColor: `${world.color}20` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: world.color }}
                  >
                    {world.id}
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold text-white">{world.name}</h2>
                    <p className="text-slate-400 text-sm">{world.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isWorldComplete && (
                    <CheckCircle2 className="text-green-400" size={24} />
                  )}
                  <span className="text-slate-300">
                    {worldProgress} / {worldLessons.length}
                  </span>
                </div>
              </div>

              {/* Lessons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {worldLessons.map((lesson, lessonIndex) => {
                  const status = getLessonStatus(lesson.id, lesson.prerequisites);
                  const isLocked = status === 'locked' || isWorldLocked;
                  const isCompleted = status === 'completed';
                  
                  return (
                    <motion.button
                      key={lesson.id}
                      onClick={() => !isLocked && onSelectLesson(lesson.id)}
                      whileHover={!isLocked ? { scale: 1.02 } : {}}
                      whileTap={!isLocked ? { scale: 0.98 } : {}}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: lessonIndex * 0.05 }}
                      disabled={isLocked}
                      className={`p-4 rounded-xl text-left transition-all ${
                        isLocked
                          ? 'bg-slate-900 opacity-50 cursor-not-allowed'
                          : isCompleted
                          ? 'bg-slate-800 border-2 border-green-500 cursor-pointer'
                          : 'bg-slate-800 border-2 border-slate-700 hover:border-blue-500 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-slate-400 text-sm font-mono">
                          {lesson.id}
                        </span>
                        
                        {isLocked && (
                          <Lock size={16} className="text-slate-500" />
                        )}
                        {isCompleted && (
                          <CheckCircle2 size={16} className="text-green-400" />
                        )}
                        {!isLocked && !isCompleted && (
                          <PlayCircle size={16} className="text-blue-400" />
                        )}
                      </div>
                      
                      <h3 className="font-bold text-white mb-1">{lesson.title}</h3>
                      
                      <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                        {lesson.description}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{lesson.duration} min</span>
                        <span>•</span>
                        <span style={{ color: COLORS.warning }}>{lesson.xp} XP</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
