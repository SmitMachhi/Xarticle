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
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center gap-6 mb-8">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
          <Star className="text-yellow-500" size={24} />
          <span className="text-gray-900 font-bold">{totalXP} XP</span>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
          <span className="text-2xl">🔥</span>
          <span className="text-gray-900 font-bold">{currentStreak} Day Streak</span>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
          <span className="text-gray-900 font-bold">
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
                style={{ backgroundColor: `${world.color}15` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: world.color }}
                  >
                    {world.id}
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{world.name}</h2>
                    <p className="text-gray-600 text-sm">{world.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isWorldComplete && (
                    <CheckCircle2 className="text-green-500" size={24} />
                  )}
                  <span className="text-gray-700">
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
                          ? 'bg-gray-100 opacity-50 cursor-not-allowed border-2 border-gray-200'
                          : isCompleted
                          ? 'bg-white border-2 border-green-500 cursor-pointer shadow-sm'
                          : 'bg-white border-2 border-gray-200 hover:border-blue-500 cursor-pointer shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-gray-500 text-sm font-mono">
                          {lesson.id}
                        </span>
                        
                        {isLocked && (
                          <Lock size={16} className="text-gray-400" />
                        )}
                        {isCompleted && (
                          <CheckCircle2 size={16} className="text-green-500" />
                        )}
                        {!isLocked && !isCompleted && (
                          <PlayCircle size={16} className="text-blue-500" />
                        )}
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-1">{lesson.title}</h3>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {lesson.description}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500">
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
