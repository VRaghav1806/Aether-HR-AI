import React, { useState, useEffect } from 'react';

function EmployeeAnalytics() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/employees");
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    const timer = setInterval(fetchEmployees, 3000);
    return () => clearInterval(timer);
  }, []);

  // Determine the max tasks to appropriately scale the progress bars
  const maxTasks = employees.length > 0 
    ? Math.max(...employees.map(e => e.tasks_completed_count || 0), 10) // default scale min bounds to 10
    : 10;
    
  const totalTasksCompleted = employees.reduce((acc, emp) => acc + (emp.tasks_completed_count || 0), 0);
  
  // Find top performer
  const sortedEmployees = [...employees].sort((a, b) => (b.tasks_completed_count || 0) - (a.tasks_completed_count || 0));
  const topPerformer = sortedEmployees.length > 0 && (sortedEmployees[0].tasks_completed_count > 0) 
    ? sortedEmployees[0] 
    : null;

  return (
    <div className="analytics-container fade-in">
      <div className="analytics-grid">
        <div className="card glass-card">
          <h3>Workforce Capacity Overview</h3>
          <div className="efficiency-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="big-stat" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <span className="label">AVAILABLE AGENTS</span>
              <span className="value" style={{ color: 'var(--success)' }}>
                {employees.filter(e => !e.is_busy).length}
              </span>
            </div>
            <div className="big-stat" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <span className="label">ACTIVE CASES</span>
              <span className="value" style={{ color: 'var(--danger)' }}>
                {employees.filter(e => e.is_busy).length}
              </span>
            </div>
            <div className="big-stat" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <span className="label">AVG PERFORMANCE</span>
              <span className="value" style={{ color: 'var(--accent-cyan)' }}>
                {employees.length > 0 
                  ? (employees.reduce((acc, e) => acc + (e.performance_score || 0), 0) / employees.length).toFixed(1)
                  : "0.0"}
              </span>
            </div>
            <div className="big-stat" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <span className="label">ELITE STAFF (&gt;8.0)</span>
              <span className="value" style={{ color: 'var(--accent-cyan)' }}>
                {employees.filter(e => (e.performance_score || 0) > 8).length}
              </span>
            </div>
          </div>
        </div>

        <div className="card glass-card">
          <h3>Workforce Productivity Snapshot</h3>
          <div className="efficiency-stats">
            <div className="big-stat" style={{ marginBottom: '2rem' }}>
              <span className="label">TOTAL CORPORATE TICKETS RESOLVED</span>
              <span className="value">{totalTasksCompleted} <small>TICKETS</small></span>
            </div>
            {topPerformer ? (
              <div className="big-stat">
                <span className="label">TOP CONTRIBUTOR</span>
                <span className="value" style={{ fontSize: '1.8rem' }}>{topPerformer.name}</span>
                <span className="label" style={{ marginTop: '0.4rem', color: 'var(--success)' }}>
                  {topPerformer.tasks_completed_count} COMPLETIONS
                </span>
              </div>
            ) : (
               <div className="big-stat">
                 <span className="label">TOP CONTRIBUTOR</span>
                 <span className="value" style={{ fontSize: '1.5rem', color: 'var(--text-dim)' }}>WAITING ON DATA</span>
               </div>
            )}
          </div>
        </div>
      </div>

      <div className="card glass-card" style={{ marginTop: '2rem' }}>
        <h3>Detailed Contributor Analytics</h3>
        {employees.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>No contributors found.</div>
        ) : (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>CONTRIBUTOR ID</th>
                <th>NAME</th>
                <th>PERFORMANCE SCORE</th>
                <th>TASKS RESOLVED</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.id}</td>
                  <td>{emp.name}</td>
                  <td>
                    <span style={{ 
                      color: emp.performance_score > 8 ? 'var(--success)' : 'var(--text-main)' 
                    }}>
                      {emp.performance_score.toFixed(1)} / 10
                    </span>
                  </td>
                  <td>{emp.tasks_completed_count || 0}</td>
                  <td>
                    {emp.is_busy ? (
                      <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 'bold' }}>BUSY</span>
                    ) : (
                      <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 'bold' }}>READY</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default EmployeeAnalytics;
