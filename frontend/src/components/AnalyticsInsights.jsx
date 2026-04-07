/**
 * AnalyticsInsights.jsx - AI-Generated Analytics & Insights Dashboard
 * Shows: Improvement trends, weak areas heatmap, skill classification
 * Displays recommendations and performance predictions
 */

import React, { useState } from 'react';

const AnalyticsInsights = ({ analyticsData }) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!analyticsData) return <div className="analytics-loading">Loading insights...</div>;

  const {
    improvement_trend = {},
    weak_areas = {},
    skill_classification = {},
    predictions = {},
    recommendations = []
  } = analyticsData;

  // ─── Improvement Trend Component ───────────────────────────
  const ImprovementTrend = () => {
    const { trend, improvement_percent, velocity, recommendation } = improvement_trend;

    const getTrendIcon = () => {
      switch (trend) {
        case 'improving': return '📈';
        case 'declining': return '📉';
        default: return '➡️';
      }
    };

    return (
      <div className="insights-card trend-card">
        <h3 className="card-title">
          {getTrendIcon()} Your Progress
        </h3>
        <div className="trend-stats">
          <div className="stat">
            <span className="stat-label">Trend:</span>
            <span className={`stat-value trend-${trend}`}>
              {trend.charAt(0).toUpperCase() + trend.slice(1)}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Improvement:</span>
            <span className="stat-value positive">
              {improvement_percent > 0 ? '+' : ''}{improvement_percent}%
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Velocity:</span>
            <span className="stat-value">{velocity}/week</span>
          </div>
        </div>
        <p className="insight-text">{recommendation}</p>
      </div>
    );
  };

  // ─── Weak Areas Heatmap ──────────────────────────────────
  const WeakAreasHeatmap = () => {
    const { weak_areas: areas = [], critical_areas = [] } = weak_areas;

    return (
      <div className="insights-card heatmap-card">
        <h3 className="card-title">🔥 Your Weak Areas</h3>
        <div className="heatmap-container">
          {areas.map((area, idx) => (
            <div key={idx} className={`heatmap-item priority-${area.priority}`}>
              <div className="heatmap-label">
                <span className="area-name">{area.category}</span>
                <span className="area-freq">{area.frequency} errors</span>
              </div>
              <div className="heatmap-bar">
                <div
                  className="heatmap-fill"
                  style={{ width: `${area.percentage}%` }}
                />
              </div>
              <span className="area-percentage">{area.percentage}%</span>
            </div>
          ))}
        </div>
        {critical_areas.length > 0 && (
          <div className="critical-alert">
            ⚠️ Focus on <strong>{critical_areas[0].category}</strong> first
          </div>
        )}
      </div>
    );
  };

  // ─── Skill Classification ──────────────────────────────────
  const SkillClassification = () => {
    const {
      level,
      description,
      average_score,
      consistency,
      certification_ready
    } = skill_classification;

    return (
      <div className="insights-card skill-card">
        <h3 className="card-title">🎯 Your Skill Level</h3>
        <div className="skill-badge">
          <span className={`badge-level level-${level.toLowerCase()}`}>
            {level}
          </span>
        </div>
        <p className="skill-description">{description}</p>
        <div className="skill-metrics">
          <div className="metric">
            <span className="metric-label">Average Score:</span>
            <span className="metric-value">{average_score}/10</span>
          </div>
          <div className="metric">
            <span className="metric-label">Consistency:</span>
            <span className="metric-value">{consistency}/10</span>
          </div>
          {certification_ready && (
            <div className="metric certification">
              ✅ Ready for certification
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Score Prediction ───────────────────────────────────────
  const ScorePrediction = () => {
    const { predicted_score, confidence, trend: predTrend, advice } = predictions;

    return (
      <div className="insights-card prediction-card">
        <h3 className="card-title">🔮 Next Score Prediction</h3>
        <div className="prediction-container">
          <div className="predicted-score">
            <span className="score">{predicted_score}</span>
            <span className="label">/10</span>
          </div>
          <div className="prediction-details">
            <p>
              <span className="confidence-label">Confidence:</span>
              <span className="confidence-value">{(confidence * 100).toFixed(0)}%</span>
            </p>
            <p>
              <span className="trend-label">Trend:</span>
              <span className={`trend-value trend-${predTrend}`}>
                {predTrend}
              </span>
            </p>
          </div>
        </div>
        <p className="advice">{advice}</p>
      </div>
    );
  };

  // ─── Recommendations ─────────────────────────────────────
  const Recommendations = () => {
    return (
      <div className="insights-card recommendations-card">
        <h3 className="card-title">💡 Recommended Actions</h3>
        <div className="recommendations-list">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="recommendation-item">
              <span className="rec-number">{idx + 1}</span>
              <span className="rec-text">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="analytics-insights">
      {/* Tab Navigation */}
      <div className="insights-tabs">
        <button
          className={`tab-btn ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-btn ${selectedTab === 'details' ? 'active' : ''}`}
          onClick={() => setSelectedTab('details')}
        >
          📈 Details
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="insights-grid overview-grid">
          <ImprovementTrend />
          <SkillClassification />
          <ScorePrediction />
        </div>
      )}

      {/* Details Tab */}
      {selectedTab === 'details' && (
        <div className="insights-grid details-grid">
          <WeakAreasHeatmap />
          <Recommendations />
        </div>
      )}
    </div>
  );
};

export default AnalyticsInsights;

// ─── CSS ───────────────────────────────────────────────────
const STYLES = `
.analytics-insights {
  width: 100%;
}

.analytics-loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
}

.insights-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s ease;
  font-size: 14px;
}

.tab-btn.active {
  border-bottom-color: #667eea;
  color: #667eea;
}

.tab-btn:hover {
  color: #111827;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.overview-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.details-grid {
  grid-template-columns: 1fr;
}

.insights-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
}

.insights-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.trend-stats {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.stat {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.stat-label {
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  color: #111827;
  font-weight: 600;
}

.trend-improving {
  color: #10b981;
}

.trend-declining {
  color: #ef4444;
}

.positive {
  color: #10b981;
}

.insight-text {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  background: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
}

.heatmap-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.heatmap-item {
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  border-left: 4px solid;
}

.heatmap-item.priority-critical {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.heatmap-item.priority-high {
  border-left-color: #fb923c;
  background: rgba(251, 146, 60, 0.05);
}

.heatmap-item.priority-medium {
  border-left-color: #fbbf24;
  background: rgba(251, 191, 36, 0.05);
}

.heatmap-item.priority-low {
  border-left-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.heatmap-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
}

.area-name {
  color: #111827;
}

.area-freq {
  color: #6b7280;
}

.heatmap-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.heatmap-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
}

.area-percentage {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
}

.critical-alert {
  margin-top: 16px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid #ef4444;
  border-radius: 6px;
  font-size: 13px;
  color: #991b1b;
}

.skill-badge {
  margin-bottom: 16px;
}

.badge-level {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
  color: white;
}

.level-beginner {
  background: #ef4444;
}

.level-elementary {
  background: #f97316;
}

.level-intermediate {
  background: #eab308;
}

.level-advanced {
  background: #3b82f6;
}

.level-expert {
  background: #8b5cf6;
}

.skill-description {
  margin: 12px 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.skill-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.metric {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.metric-label {
  color: #6b7280;
}

.metric-value {
  color: #111827;
  font-weight: 700;
}

.metric.certification {
  color: #10b981;
  font-weight: 600;
  justify-content: center;
  margin-top: 8px;
}

.prediction-container {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.predicted-score {
  display: flex;
  align-items: baseline;
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.score {
  font-size: 48px;
}

.label {
  font-size: 16px;
  color: #6b7280;
  margin-left: 4px;
}

.prediction-details {
  flex: 1;
}

.prediction-details p {
  margin: 4px 0;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
}

.confidence-label,
.trend-label {
  color: #6b7280;
  font-weight: 500;
}

.confidence-value,
.trend-value {
  color: #111827;
  font-weight: 700;
}

.advice {
  margin: 12px 0 0;
  padding: 12px;
  background: #f0f9ff;
  border-left: 3px solid #0ea5e9;
  border-radius: 6px;
  font-size: 13px;
  color: #0c4a6e;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.rec-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 12px;
}

.rec-text {
  flex: 1;
  font-size: 13px;
  color: #111827;
  line-height: 1.5;
}
`;
