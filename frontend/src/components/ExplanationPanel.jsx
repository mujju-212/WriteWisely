/**
 * ExplanationPanel.jsx - Enhanced Explanation Display Component
 * Shows: WHAT is wrong, WHY it's wrong, HOW to fix it
 * Drop-in enhancement for existing TextEditor component
 */

import React, { useState } from 'react';

const ExplanationPanel = ({ error, onDismiss }) => {
  if (!error) return null;

  const { correction, teaching, examples, severity, tip } = error;

  return (
    <div className="explanation-panel">
      {/* Error Badge */}
      <div className={`error-badge severity-${severity}`}>
        <span className="error-icon">⚠️</span>
        <span className="error-type">{correction.errorType}</span>
      </div>

      {/* What is Wrong */}
      <div className="explanation-section">
        <h4 className="section-title">❌ What's Wrong?</h4>
        <p className="explanation-text">{teaching.what}</p>
        <div className="code-example">
          <span className="wrong">Wrong: {correction.wrong}</span>
          <span className="right">Right: {correction.right}</span>
        </div>
      </div>

      {/* Why it Matters */}
      <div className="explanation-section">
        <h4 className="section-title">💡 Why It Matters</h4>
        <p className="explanation-text">{teaching.why}</p>
      </div>

      {/* How to Fix */}
      <div className="explanation-section">
        <h4 className="section-title">🔧 How to Fix It</h4>
        <p className="explanation-text">{teaching.how}</p>
      </div>

      {/* Tip */}
      {tip && (
        <div className="tip-box">
          <span className="tip-icon">💭</span>
          <span>{tip}</span>
        </div>
      )}

      {/* Practice Examples */}
      {examples && examples.length > 0 && (
        <div className="examples-section">
          <h4>📚 More Examples</h4>
          {examples.map((ex, idx) => (
            <div key={idx} className="example">
              <div className="example-wrong">❌ {ex.wrong}</div>
              <div className="example-right">✅ {ex.right}</div>
            </div>
          ))}
        </div>
      )}

      <button className="dismiss-btn" onClick={onDismiss}>
        Got it! →
      </button>
    </div>
  );
};

export default ExplanationPanel;

// ─── CSS Styles ───────────────────────────────────────────
const STYLES = `
.explanation-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin: 15px 0;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  border-left: 5px solid #4c51bf;
}

.error-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 12px;
  border-radius: 20px;
  margin-bottom: 15px;
  font-weight: 600;
  font-size: 14px;
}

.error-badge.severity-critical {
  background: rgba(239, 68, 68, 0.3);
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.explanation-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.95;
}

.explanation-text {
  font-size: 14px;
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: 10px;
}

.code-example {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 8px;
  font-family: 'Monaco', monospace;
  font-size: 13px;
}

.code-example .wrong {
  color: #fca5a5;
  text-decoration: line-through;
}

.code-example .right {
  color: #86efac;
  font-weight: 600;
}

.tip-box {
  background: rgba(255, 255, 255, 0.15);
  border-left: 3px solid #fbbf24;
  padding: 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 13px;
}

.dismiss-btn {
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.dismiss-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(2px);
}
`;
