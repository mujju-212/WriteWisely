import React, { useState } from 'react';

function LearningHome() {
  const [completedLevels, setCompletedLevels] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  const [currentLevel, setCurrentLevel] = useState(14);

  const levels = [
    // BEGINNER (1-10)
    { id: 1, title: 'Basic Spelling Rules', difficulty: 'Beginner', credits: 20, topic: 'Spelling' },
    { id: 2, title: 'Common Misspellings', difficulty: 'Beginner', credits: 20, topic: 'Spelling' },
    { id: 3, title: 'Capitalization Rules', difficulty: 'Beginner', credits: 25, topic: 'Grammar' },
    { id: 4, title: 'Basic Punctuation (Period, Comma)', difficulty: 'Beginner', credits: 25, topic: 'Punctuation' },
    { id: 5, title: 'Subject-Verb Agreement', difficulty: 'Beginner', credits: 30, topic: 'Grammar' },
    { id: 6, title: 'Singular vs Plural', difficulty: 'Beginner', credits: 25, topic: 'Grammar' },
    { id: 7, title: 'Articles (a, an, the)', difficulty: 'Beginner', credits: 20, topic: 'Grammar' },
    { id: 8, title: 'Basic Tenses (Past, Present, Future)', difficulty: 'Beginner', credits: 35, topic: 'Grammar' },
    { id: 9, title: 'Common Homophones (their/there/they\'re)', difficulty: 'Beginner', credits: 30, topic: 'Homophones' },
    { id: 10, title: '🏆 Beginner Assessment', difficulty: 'Beginner', credits: 50, topic: 'Assessment' },
    
    // INTERMEDIATE (11-20)
    { id: 11, title: 'Advanced Punctuation (Semicolons, Colons)', difficulty: 'Intermediate', credits: 40, topic: 'Punctuation' },
    { id: 12, title: 'Complex Sentences', difficulty: 'Intermediate', credits: 35, topic: 'Grammar' },
    { id: 13, title: 'Active vs Passive Voice', difficulty: 'Intermediate', credits: 40, topic: 'Grammar' },
    { id: 14, title: 'Commonly Confused Words', difficulty: 'Intermediate', credits: 45, topic: 'Vocabulary' },
    { id: 15, title: 'Paragraph Structure', difficulty: 'Intermediate', credits: 50, topic: 'Writing' },
    { id: 16, title: 'Transition Words', difficulty: 'Intermediate', credits: 35, topic: 'Writing' },
    { id: 17, title: 'Advanced Tenses', difficulty: 'Intermediate', credits: 45, topic: 'Grammar' },
    { id: 18, title: 'Prepositions', difficulty: 'Intermediate', credits: 40, topic: 'Grammar' },
    { id: 19, title: 'Formal vs Informal Writing', difficulty: 'Intermediate', credits: 50, topic: 'Writing' },
    { id: 20, title: '🏆 Intermediate Assessment', difficulty: 'Intermediate', credits: 75, topic: 'Assessment' },
    
    // ADVANCED (21-30)
    { id: 21, title: 'Style & Tone', difficulty: 'Advanced', credits: 60, topic: 'Writing' },
    { id: 22, title: 'Conciseness', difficulty: 'Advanced', credits: 55, topic: 'Writing' },
    { id: 23, title: 'Advanced Punctuation (Em dash, etc.)', difficulty: 'Advanced', credits: 50, topic: 'Punctuation' },
    { id: 24, title: 'Parallel Structure', difficulty: 'Advanced', credits: 60, topic: 'Grammar' },
    { id: 25, title: 'Conditional Sentences', difficulty: 'Advanced', credits: 55, topic: 'Grammar' },
    { id: 26, title: 'Academic Writing', difficulty: 'Advanced', credits: 70, topic: 'Writing' },
    { id: 27, title: 'Business Writing', difficulty: 'Advanced', credits: 70, topic: 'Writing' },
    { id: 28, title: 'Creative Writing Techniques', difficulty: 'Advanced', credits: 65, topic: 'Writing' },
    { id: 29, title: 'Editing & Proofreading Skills', difficulty: 'Advanced', credits: 65, topic: 'Writing' },
    { id: 30, title: '🏆 Final Master Assessment', difficulty: 'Advanced', credits: 100, topic: 'Assessment' },
  ];

  const getLevelStatus = (levelId) => {
    if (completedLevels.includes(levelId)) {
      return 'completed';
    } else if (levelId === currentLevel || levelId < currentLevel) {
      return 'available';
    } else {
      return 'locked';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-700';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'Advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return '✅';
      case 'available': return '▶️';
      case 'locked': return '🔒';
      default: return '';
    }
  };

  const handleStartLesson = (levelId) => {
    const status = getLevelStatus(levelId);
    if (status === 'locked') {
      alert('Complete previous lessons to unlock this level!');
      return;
    }
    const level = levels.find(l => l.id === levelId);
    alert(`Starting Lesson ${levelId}: ${level.title}`);
  };

  const handleCompleteLesson = (levelId) => {
    if (!completedLevels.includes(levelId)) {
      setCompletedLevels([...completedLevels, levelId]);
      const level = levels.find(l => l.id === levelId);
      alert(`🎉 Lesson completed! +${level.credits} credits earned!`);
      if (levelId === currentLevel) {
        setCurrentLevel(levelId + 1);
      }
    }
  };

  const beginnerLevels = levels.filter(l => l.difficulty === 'Beginner');
  const intermediateLevels = levels.filter(l => l.difficulty === 'Intermediate');
  const advancedLevels = levels.filter(l => l.difficulty === 'Advanced');

  const renderLevelCards = (levelsList, difficultyColor) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {levelsList.map(level => {
          const status = getLevelStatus(level.id);
          return (
            <div 
              key={level.id}
              className={`glass-card p-6 transition-all ${
                status === 'locked' ? 'opacity-60' : 'opacity-100'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getStatusIcon(status)}</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${difficultyColor}`}>
                      L{level.id}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-200">{level.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">📚 {level.topic} • ⭐ +{level.credits} Cr</p>
                </div>
              </div>

              <div className="space-y-3">
                {status === 'completed' && (
                  <div className="w-full bg-emerald-200 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                )}
                {status === 'available' && (
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                )}
                {status === 'locked' && (
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-slate-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                )}

                <div className="flex gap-2">
                  {status === 'locked' ? (
                    <button 
                      disabled
                      className="flex-1 py-2 bg-slate-300 text-slate-500 text-xs font-bold rounded-lg cursor-not-allowed"
                    >
                      🔒 Locked
                    </button>
                  ) : status === 'completed' ? (
                    <button 
                      onClick={() => handleStartLesson(level.id)}
                      className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition"
                    >
                      ✅ Review
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleStartLesson(level.id)}
                        className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
                      >
                        Start
                      </button>
                      <button 
                        onClick={() => handleCompleteLesson(level.id)}
                        className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition"
                      >
                        Complete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-view space-y-8 mb-6 overflow-y-auto px-1">
      <div>
        <h1 className="text-3xl font-black text-slate-100 tracking-tight">Learning <span className="text-indigo-600">Hub</span></h1>
        <p className="text-sm font-medium text-slate-400 mt-1">Master your writing skills with 30 curated lessons organized by difficulty.</p>
      </div>

      {/* Current Progress Summary */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-bold text-slate-200">Your Progress</h2>
            <p className="text-xs text-slate-400 mt-1">Level {currentLevel} - {currentLevel <= 10 ? 'Beginner' : currentLevel <= 20 ? 'Intermediate' : 'Advanced'}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-indigo-600">{completedLevels.length}/30</p>
            <p className="text-xs text-slate-500">Lessons Completed</p>
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div 
            className="bg-indigo-600 h-3 rounded-full transition-all" 
            style={{ width: `${(completedLevels.length / 30) * 100}%` }}
          ></div>
        </div>
        <p className="text-xs text-slate-400 font-medium mt-2">
          {Math.round((completedLevels.length / 30) * 100)}% Complete • {completedLevels.length * 5} Credits Earned
        </p>
      </div>

      {/* BEGINNER SECTION */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🟢</span>
          <div>
            <h2 className="font-bold text-lg text-slate-200">Beginner Level (1-10)</h2>
            <p className="text-xs text-slate-400">Master the fundamentals of writing</p>
          </div>
        </div>
        {renderLevelCards(beginnerLevels, 'bg-green-100 text-green-700')}
      </div>

      {/* INTERMEDIATE SECTION */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🟡</span>
          <div>
            <h2 className="font-bold text-lg text-slate-200">Intermediate Level (11-20)</h2>
            <p className="text-xs text-slate-400">Advance your writing with complex techniques</p>
          </div>
        </div>
        {renderLevelCards(intermediateLevels, 'bg-yellow-100 text-yellow-700')}
      </div>

      {/* ADVANCED SECTION */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔴</span>
          <div>
            <h2 className="font-bold text-lg text-slate-200">Advanced Level (21-30)</h2>
            <p className="text-xs text-slate-400">Perfect your craft with professional writing</p>
          </div>
        </div>
        {renderLevelCards(advancedLevels, 'bg-red-100 text-red-700')}
      </div>

      {/* MASTERY SECTION */}
      <div className="glass-card p-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">🎓</span>
          <div className="flex-1">
            <h2 className="font-bold text-xl text-slate-800">Master Status:</h2>
            {completedLevels.length === 30 ? (
              <p className="text-sm text-emerald-600 font-bold mt-1">🏆 Congratulations! You've mastered all lessons!</p>
            ) : (
              <p className="text-sm text-indigo-600 mt-1">{30 - completedLevels.length} lessons remaining to achieve Mastery</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearningHome;
