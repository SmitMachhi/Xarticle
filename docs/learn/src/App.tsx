import { useState } from 'react';
import { SkillTree } from './components/ui/SkillTree';
import { LessonViewer } from './components/lessons/LessonViewer';
import './App.css';

type View = 'skill-tree' | 'lesson';

function App() {
  const [currentView, setCurrentView] = useState<View>('skill-tree');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentView('lesson');
  };

  const handleBackToSkillTree = () => {
    setCurrentView('skill-tree');
    setSelectedLessonId(null);
  };

  const handleLessonComplete = () => {
    setCurrentView('skill-tree');
    setSelectedLessonId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {currentView === 'skill-tree' && (
        <SkillTree onSelectLesson={handleSelectLesson} />
      )}
      
      {currentView === 'lesson' && selectedLessonId && (
        <LessonViewer
          lessonId={selectedLessonId}
          onBack={handleBackToSkillTree}
          onComplete={handleLessonComplete}
        />
      )}
    </div>
  );
}

export default App;
