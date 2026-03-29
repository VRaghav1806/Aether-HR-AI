import React, { useState, useEffect } from 'react';

function StrategyAnalytics() {
  const [data, setData] = useState({
    categories: {},
    time_saved_hours: 0,
    efficiency_score: 0,
    agent_performance: []
  });

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/analytics`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="analytics-container fade-in">
      <div className="analytics-grid">
        <div className="card glass-card">
          <h3>Workload Distribution</h3>
          <div className="chart-area">
            {Object.keys(data.categories).length === 0 ? (
              <div className="placeholder-text">Insufficient data for distribution analysis.</div>
            ) : (
              Object.entries(data.categories).map(([cat, count]) => (
                <div key={cat} className="bar-group">
                  <div className="bar-header">
                    <span>{cat}</span>
                    <span>{count} Case(s)</span>
                  </div>
                  <div className="bar-bg">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        width: `${Math.min((count / 10) * 100, 100)}%`,
                        background: cat === 'Leave Request' ? 'var(--success)' : 'var(--accent-cyan)'
                      }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card glass-card">
          <h3>Autonomous Efficiency</h3>
          <div className="efficiency-stats">
            <div className="big-stat">
              <span className="label">ESTIMATED TIME SAVED</span>
              <span className="value">{data.time_saved_hours.toFixed(1)} <small>HOURS</small></span>
            </div>
            <div className="big-stat">
              <span className="label">STRATEGIC EFFICIENCY</span>
              <span className="value">{data.efficiency_score}%</span>
            </div>
          </div>
          <div className="ai-status-pulse">
            <span className="pulse-dot"></span>
            AI ORCHESTRATOR IS OPTIMIZING RESOURCE ALLOCATION
          </div>
        </div>
      </div>

      <div className="card glass-card" style={{ marginTop: '2rem' }}>
        <h3>Agent Performance Benchmark</h3>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>AGENT UNIT</th>
              <th>OPERATIONAL ACCURACY</th>
              <th>COMPUTATIONAL LOAD</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {data.agent_performance.map(agent => (
              <tr key={agent.name}>
                <td>{agent.name}</td>
                <td>{agent.accuracy}%</td>
                <td>{agent.load}</td>
                <td><span className="status-tag">OPTIMIZED</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StrategyAnalytics;
