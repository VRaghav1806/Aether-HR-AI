import React, { useState, useEffect } from 'react';

function EmployeeManager() {
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/employees`);
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    const timer = setInterval(fetchEmployees, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, email, performance_score: parseFloat(score) })
      });
      if (res.ok) {
        setMessage("Employee added successfully!");
        setName("");
        setId("");
        setEmail("");
        setScore(0);
        fetchEmployees();
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.detail}`);
      }
    } catch (err) {
      setMessage("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-manager-container fade-in">
      <div className="card">
        <h3>HR Management: Employee Records</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Manually input employee performance metrics to enable AI-driven task allocation.
        </p>
        
        <form onSubmit={handleSubmit} className="employee-form">
          <div className="form-grid">
            <div className="input-group">
              <label>Employee ID</label>
              <input 
                type="text" 
                placeholder="EMP-001" 
                value={id} 
                onChange={(e) => setId(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="john@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label>Performance Score (0-10)</label>
              <input 
                type="number" 
                step="0.1" 
                min="0" 
                max="10" 
                value={score} 
                onChange={(e) => setScore(e.target.value)} 
                required 
              />
            </div>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "PROCESSING..." : "REGISTER EMPLOYEE"}
          </button>
          {message && <div className={`form-message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}
        </form>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>Registered Workforce</h3>
        <div className="employee-list">
          {employees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>No employees registered yet.</div>
          ) : (
            <table className="employee-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>STAFF STATUS</th>
                  <th>TASK STATUS</th>
                  <th>PERFORMANCE</th>
                  <th>ALLOCATION PRIORITY</th>
                </tr>
              </thead>
              <tbody>
                {employees.sort((a,b) => b.performance_score - a.performance_score).map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>
                      <div className="score-badge" style={{ 
                        background: emp.is_busy ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: emp.is_busy ? 'var(--danger)' : 'var(--success)'
                      }}>
                        {emp.is_busy ? `BUSY (${emp.current_ticket_id})` : 'AVAILABLE'}
                      </div>
                    </td>
                    <td>
                      <span className="task-badge" style={{
                         padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                         backgroundColor: (emp.task_status === 'completed') ? '#dbeafe' : (emp.task_status === 'assigned' ? '#fef3c7' : '#f3f4f6'),
                         color: (emp.task_status === 'completed') ? '#1e40af' : (emp.task_status === 'assigned' ? '#92400e' : '#374151')
                      }}>
                         {emp.task_status ? emp.task_status.toUpperCase() : "NOT ASSIGNED"}
                      </span>
                    </td>
                    <td>
                      <div className="score-badge" style={{ 
                        background: emp.performance_score > 8 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: emp.performance_score > 8 ? '#10b981' : '#f59e0b'
                      }}>
                        {emp.performance_score.toFixed(1)}
                      </div>
                    </td>
                    <td>{emp.performance_score > 8 ? "ELITE" : "STANDARD"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeManager;
