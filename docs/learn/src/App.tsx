import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, CheckCircle2, PlayCircle, Lock } from 'lucide-react'
import { WORLDS, LESSONS } from './lib/curriculum'
import { COLORS } from './types/curriculum'

function App() {
  const [currentLesson, setCurrentLesson] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  const completeLesson = (lessonId: string) => {
    setCompletedLessons(prev => [...prev, lessonId])
    setCurrentLesson(null)
  }

  if (currentLesson) {
    const lesson = LESSONS.find(l => l.id === currentLesson)
    if (!lesson) return null

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button 
          onClick={() => setCurrentLesson(null)}
          className="mb-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ← Back to Lessons
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
        <p className="text-gray-600 mb-6">{lesson.description}</p>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Lesson Content</h2>
          <p className="text-gray-600 mb-4">This lesson teaches: {lesson.description}</p>
          
          <button
            onClick={() => completeLesson(lesson.id)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
          >
            Complete Lesson (+{lesson.xp} XP)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-6 mb-8">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
            <Star className="text-yellow-500" size={20} />
            <span className="font-bold">{completedLessons.length * 50} XP</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-full shadow-sm">
            <span>{completedLessons.length} / {LESSONS.length} Lessons</span>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Backend Engineering Mastery
        </h1>
        <p className="text-gray-600 mb-8 text-lg">Master backend engineering through interactive lessons</p>

        <div className="space-y-8">
          {WORLDS.map((world, idx) => (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border-l-4"
              style={{ borderLeftColor: world.color }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: world.color }}
                >
                  {world.id}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{world.name}</h2>
                  <p className="text-gray-600">{world.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {LESSONS.filter(l => l.worldId === world.id).map((lesson) => {
                  const isCompleted = completedLessons.includes(lesson.id)
                  const isAvailable = lesson.prerequisites.every(p => completedLessons.includes(p))
                  
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => isAvailable && setCurrentLesson(lesson.id)}
                      disabled={!isAvailable}
                      className={`p-4 rounded-xl text-left transition-all border-2 ${
                        isCompleted
                          ? 'bg-green-50 border-green-500'
                          : isAvailable
                          ? 'bg-white border-gray-200 hover:border-blue-500 shadow-sm'
                          : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-gray-500 font-mono text-sm">{lesson.id}</span>
                        {isCompleted && <CheckCircle2 size={16} className="text-green-600" />}
                        {isAvailable && !isCompleted && <PlayCircle size={16} className="text-blue-600" />}
                        {!isAvailable && <Lock size={16} className="text-gray-400" />}
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-1">{lesson.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{lesson.description}</p>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{lesson.duration} min</span>
                        <span>•</span>
                        <span style={{ color: COLORS.warning }} className="font-semibold">{lesson.xp} XP</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
