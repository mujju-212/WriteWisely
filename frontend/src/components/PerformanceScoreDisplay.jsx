/**
 * PerformanceScoreDisplay.jsx - Multi-Dimensional Score Display
 * Shows: Grammar, Clarity, Vocabulary, Style scores + Overall
 * Real-time feedback component
 */

import React from 'react';

const PerformanceScoreDisplay = ({ scores, feedback, performanceLevel }) => {
  if (!scores) return null;

  const {
    grammar = 0,
    clarity = 0,
    vocabulary = 0,
    style = 0,
    overall = 0
  } = scores;

  const ScoreGauge = ({ label, value, maxValue = 10, color }) => {
    const percentage = (value / maxValue) * 100;
    const getGaugeColor = () => {
      if (value >= 8) return '#10b981'; // Green
      if (value >= 6) return '#f59e0b'; // Amber
      return '#ef4444'; // Red
    };

    return (
      <div className="score-gauge">
        <div className="gauge-label">
          <span className="label-text">{label}</span>
          <span className="label-value">{value.toFixed(1)}/10</span>
        </div>
        <div className="gauge-bar">
          <div
            className="gauge-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: color || getGaugeColor()
            }}
          />
        </div>
      </div>
    );
  };

  const OverallScore = ({ score, level }) => (
    <div className="overall-score-container">
      <div className="score-circle">
        <div className="score-value">{score.toFixed(1)}</div>
        <div className="score-max">/10</div>
      </div>
      <div className="score-info">
        <h3 className="score-title">Overall Performance</h3>
        <p className={`score-level level-${level.toLowerCase()}`}>
          📊 {level}
        </p>
      </div>
    </div>
  );

  return (
    <div className="performance-display">
      {/* Overall Score */}
      <OverallScore score={overall} level={performanceLevel} />

      {/* Detailed Scores */}
      <div className="detailed-scores">
        <h4 className="scores-title">📈 Detailed Analysis</h4>
        <div className="scores-grid">
          <ScoreGauge label="Grammar" value={grammar} color="#3b82f6" />
          <ScoreGauge label="Clarity" value={clarity} color="#8b5cf6" />
          <ScoreGauge label="Vocabulary" value={vocabulary} color="#06b6d4" />
          <ScoreGauge label="Style" value={style} color="#ec4899" />
        </div>
      </div>

      {/* Feedback Summary */}
      {feedback && (
        <div className="feedback-summary">
          <h4>💬 Feedback Summary</h4>
          <div className="feedback-grid">
            {Object.entries(feedback).map(([key, value]) => (
              <div key={key} className="feedback-item">
                <span className="feedback-label">{formatLabel(key)}:</span>
                <span className="feedback-text">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const formatLabel = (key) => {
  return key
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export default PerformanceScoreDisplay;

// ─── CSS ───────────────────────────────────────────────────
const STYLES = `
.performance-display {
  background: #f9fafb;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
}

.overall-score-container {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.score-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  font-weight: 700;
}

.score-value {
  font-size: 36px;
  line-height: 1;
}

.score-max {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.score-info h3 {
  margin: 0;
  font-size: 18px;
  margin-bottom: 4px;
}

.score-level {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.level-excellent {
  color: #86efac;
}

.level-very-good {
  color: #a3e635;
}

.level-good {
  color: #fbbf24;
}

.level-satisfactory {
  color: #fb923c;
}

.level-needs-work {
  color: #f87171;
}

.detailed-scores {
  margin-bottom: 24px;
}

.scores-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.scores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.score-gauge {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.gauge-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
}

.label-text {
  color: #6b7280;
}

.label-value {
  color: #111827;
}

.gauge-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.feedback-summary {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.feedback-summary h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.feedback-grid {
  display: grid;
  gap: 12px;
}

.feedback-item {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.feedback-label {
  font-weight: 600;
  color: #6b7280;
  min-width: 100px;
}

.feedback-text {
  color: #374151;
  flex: 1;
}
`;
