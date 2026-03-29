import React, { useState, useEffect } from 'react';

const PayrollHub = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('${import.meta.env.VITE_API_URL}/expenses')
      .then(res => res.json())
      .then(data => {
        setExpenses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching expenses:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="payroll-hub fade-in">
      <div className="header-section" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>Payroll & Expense AI-Hub</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Comprehensive financial oversight powered by AI risk-assessment.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{ padding: '0.75rem 1.5rem', background: 'var(--badge-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>CALENDAR VIEW</button>
          <button style={{ padding: '0.75rem 1.5rem' }}>GENERATE PAYROLL</button>
        </div>
      </div>

      <div className="stats-bar" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-label">Total Monthly Payout</span>
          <span className="stat-value">$142,500.00</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Expenses</span>
          <span className="stat-value">3 <small style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Queue</small></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">AI Efficiency gain</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>+12.4%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Tax Compliance</span>
          <span className="stat-value">100%</span>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>AI Expense Review Queue</h3>
          <div className="expense-list">
            {expenses.map(exp => (
              <div key={exp.id} style={{ 
                padding: '1.25rem', 
                marginBottom: '1rem', 
                background: 'var(--bg-dark)', 
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-cyan)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{exp.employee[0]}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{exp.employee}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{exp.category} • {exp.id}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: '800', fontSize: '1rem', display: 'block' }}>{exp.amount}</span>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: '800', 
                      color: exp.risk === 'Low' ? 'var(--success)' : 'var(--warning)',
                      padding: '2px 6px',
                      background: 'var(--card-bg)',
                      borderRadius: '4px'
                    }}>RISK: {exp.risk.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--card-bg)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-main)', borderLeft: '3px solid var(--accent-cyan)' }}>
                  🤖 <span style={{ fontWeight: '700', marginRight: '0.5rem' }}>AI ADVICE:</span> {exp.aiAdvice}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Bonus Distribution Logic</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Based on verified task completion metrics from current period.</p>
            <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '1rem', padding: '1rem 0' }}>
              <div style={{ flex: 1, height: '60%', background: 'var(--accent-blue)', borderRadius: '8px' }}></div>
              <div style={{ flex: 1, height: '90%', background: 'var(--accent-cyan)', borderRadius: '8px' }}></div>
              <div style={{ flex: 1, height: '40%', background: 'var(--accent-purple)', borderRadius: '8px' }}></div>
              <div style={{ flex: 1, height: '75%', background: 'var(--accent-blue)', borderRadius: '8px' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
              <span>PROD</span><span>MARK</span><span>TECH</span><span>SALES</span>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', background: 'var(--accent-blue)', color: '#fff' }}>
            <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Fiscal Year 2026</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>94.2%</div>
            <p style={{ fontSize: '0.8rem', opacity: '0.9' }}>Budget utilization across all HR operational accounts. On target.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollHub;
