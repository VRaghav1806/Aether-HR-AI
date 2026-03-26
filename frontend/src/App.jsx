import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [agents, setAgents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [newTicket, setNewTicket] = useState("");
  const [loading, setLoading] = useState(false);
  const [mailConnected, setMailConnected] = useState(false);
  const [mailError, setMailError] = useState(null);
  const [stats, setStats] = useState({ total_tickets: 0, resolved: 0 });

  useEffect(() => {
    const timer = setInterval(fetchStatus, 3000);
    fetchStatus();
    return () => clearInterval(timer);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://localhost:8000/status");
      const data = await res.json();
      setAgents(data.agents);
      setMailConnected(data.mail_connected);
      setMailError(data.mail_error);
      setStats({ total_tickets: data.total_tickets, resolved: data.resolved });
      
      const tRes = await fetch("http://localhost:8000/tickets");
      const tData = await tRes.json();
      setTickets(tData.reverse());
    } catch (err) {
      console.error("Failed to fetch status:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`http://localhost:8000/tickets?content=${encodeURIComponent(newTicket)}`, {
        method: "POST"
      });
      setNewTicket("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="logo">AETHER HR-AI <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '8px' }}>ENTERPRISE</span></div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="system-status">
            <span 
              className={`agent-status-dot`} 
              style={{ background: mailError ? '#ef4444' : (mailConnected ? '#10b981' : '#64748b') }}
              title={mailError || (mailConnected ? "Connected" : "Offline")}
            ></span>
            {mailError ? 'GMAIL ERROR' : (mailConnected ? 'GMAIL LIVE' : 'GMAIL OFFLINE')}
          </div>
          <div className="system-status">CORE VERSION: 2.1.0-PRO</div>
        </div>
      </header>

      <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-label">Total HR Mails</span>
          <span className="stat-value">{stats.total_tickets}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Autonomous Decisions</span>
          <span className="stat-value">{stats.resolved}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Divisions</span>
          <span className="stat-value">3</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Success Rate</span>
          <span className="stat-value">100%</span>
        </div>
      </div>

      <main className="main-grid">
        <div className="sidebar-section">
          <div className="card" style={{ height: '100%' }}>
            <h3>Divisional Status</h3>
            <div className="agent-grid">
              {agents.map((agent, index) => (
                <div key={index} className="agent-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{agent.name}</span>
                    <span className={`agent-status-dot status-${agent.status}`}></span>
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textTransform: 'uppercase', marginTop: '4px' }}>{agent.id}</div>
                  <div style={{ marginTop: '0.8rem', fontSize: '0.8rem' }}>{agent.last_action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="history-section">
          <div className="card history-card">
            <h3>Inbound HR Mail Segregation Feed</h3>
            <div className="history-feed" style={{ marginTop: '1rem' }}>
              {tickets.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '3rem' }}>
                  Awaiting real-time Gmail signals...
                </div>
              ) : (
                tickets.map(ticket => (
                  <div key={ticket.id} className="history-item">
                    <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>#REF-{ticket.id}</span>
                      <span style={{ 
                        color: ticket.category === 'Leave Request' ? 'var(--success)' : 'var(--accent-cyan)',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem'
                      }}>
                        {ticket.category || 'ANALYZING'}
                      </span>
                    </div>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                      {ticket.content}
                    </div>
                    {ticket.history.length > 0 && (
                      <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        {ticket.history.map((h, i) => (
                          <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem', display: 'flex', gap: '8px' }}>
                            <span style={{ color: 'var(--accent-cyan)' }}>➤</span>
                            <span><strong>{h.agent}:</strong> {h.action}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
