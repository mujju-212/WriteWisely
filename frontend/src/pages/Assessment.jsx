import React, { useState } from 'react';

function Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      id: 1,
      question: 'Which sentence is grammatically correct?',
      options: [
        'She go to the store every day',
        'She goes to the store every day',
        'She going to the store every day',
        'She goes to store every day'
      ],
      correct: 1
    },
    {
      id: 2,
      question: 'What is the correct way to write this sentence?',
      options: [
        'Their going to the party tonight',
        'Theyre going to the party tonight',
        'They\'re going to the party tonight',
        'There going to the party tonight'
      ],
      correct: 2
    },
    {
      id: 3,
      question: 'Choose the best word to complete the sentence',
      options: [
        'affect',
        'effect',
        'efect',
        'afect'
      ],
      correct: 0,
      context: 'The new policy will ___ employee productivity.'
    }
  ];

  const handleAnswer = (optionIndex) => {
    setAnswers({
      ...answers,
      [currentQuestion]: optionIndex
    });
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  return (
    <div className="animate-view w-full max-w-2xl mx-auto glass-card p-12 mt-10 overflow-y-auto pb-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-100">Writing Assessment</h1>
          <p className="text-sm text-slate-400 mt-1">Question {currentQuestion + 1} of {questions.length}</p>
        </div>

        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <div className="bg-indigo-600 h-full" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}></div>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl">
          <h2 className="text-lg font-bold text-slate-200 mb-2">{questions[currentQuestion].question}</h2>
          {questions[currentQuestion].context && (
            <p className="text-sm text-slate-400 italic mb-4">"{ questions[currentQuestion].context}"</p>
          )}
          
          <div className="space-y-3 mt-6">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full text-left p-4 rounded-xl border-2 transition ${
                  answers[currentQuestion] === index
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-700 hover:border-indigo-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                    answers[currentQuestion] === index
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-slate-300'
                  }`}>
                    {answers[currentQuestion] === index && (
                      <i className="fa-solid fa-check text-white text-xs"></i>
                    )}
                  </div>
                  <span className="font-medium text-slate-200">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-3 rounded-xl font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition disabled:opacity-50"
          >
            Previous
          </button>
          {currentQuestion === questions.length - 1 ? (
            <button className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Assessment;
