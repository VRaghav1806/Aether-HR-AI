import React, { useState, useEffect } from 'react';
import './index.css';
import EmployeeManager from './components/EmployeeManager';
import StrategyAnalytics from './components/StrategyAnalytics';
import EmployeeAnalytics from './components/EmployeeAnalytics';
import PolicyCenter from './components/PolicyCenter';
import PayrollHub from './components/PayrollHub';
import LoginPage from './components/LoginPage';

function App() {
  const [agents, setAgents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [newTicket, setNewTicket] = useState("");
  const [loading, setLoading] = useState(false);
  const [mailConnected, setMailConnected] = useState(false);
  const [mailError, setMailError] = useState(null);
  const [stats, setStats] = useState({ total_tickets: 0, resolved: 0 });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState(localStorage.getItem('aether-theme') || 'cyan');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const timer = setInterval(fetchStatus, 3000);
    fetchStatus();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aether-theme', theme);
  }, [theme]);

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/status");
      const data = await res.json();
      setAgents(data.agents);
      setMailConnected(data.mail_connected);
      setMailError(data.mail_error);
      setStats({ total_tickets: data.total_tickets, resolved: data.resolved });
      
      const tRes = await fetch("http://127.0.0.1:8000/tickets");
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
      await fetch(`http://127.0.0.1:8000/tickets?content=${encodeURIComponent(newTicket)}`, {
        method: "POST"
      });
      setNewTicket("");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="dashboard-layout">
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <aside className={`global-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo" style={{ lineHeight: '1.2' }}>AETHER HR-AI<br/><span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'var(--badge-bg)', borderRadius: '4px', verticalAlign: 'middle', marginTop: '8px', display: 'inline-block' }}>ENTERPRISE EDITION</span></div>
        
        <nav className="side-nav">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
          >
            ANALYTICS DASHBOARD
          </button>
          <button 
            className={activeTab === 'employees' ? 'active' : ''} 
            onClick={() => { setActiveTab('employees'); setSidebarOpen(false); }}
          >
            EMPLOYEE MANAGEMENT
          </button>
          <button 
            className={activeTab === 'analytics' ? 'active' : ''} 
            onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
          >
            STRATEGY & ANALYTICS
          </button>
          <button 
            className={activeTab === 'employee-analytics' ? 'active' : ''} 
            onClick={() => { setActiveTab('employee-analytics'); setSidebarOpen(false); }}
          >
            EMPLOYEE PERFORMANCE
          </button>
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 1rem' }}></div>
          <button 
            className={activeTab === 'policy' ? 'active' : ''} 
            onClick={() => { setActiveTab('policy'); setSidebarOpen(false); }}
          >
            AI POLICY CENTER
          </button>
          <button 
            className={activeTab === 'payroll' ? 'active' : ''} 
            onClick={() => { setActiveTab('payroll'); setSidebarOpen(false); }}
          >
            PAYROLL AI-HUB
          </button>
        </nav>
      </aside>

      <div className="main-content-wrapper">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
              ☰ MENU
            </button>
            <div className="logo" style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
              AETHER HR-AI <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'var(--badge-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '8px' }}>ENTERPRISE</span>
            </div>
          </div>

          <div className="header-telemetry" style={{ 
            display: 'flex', 
            gap: '2rem', 
            alignItems: 'center', 
            background: 'var(--badge-bg)', 
            padding: '0.5rem 1.5rem', 
            borderRadius: '999px',
            border: '1px solid var(--border-color)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="pulse-dot"></div>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>SYSTEM LIVE</span>
            </div>
            <div style={{ padding: '0 1rem', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: '600' }}>TOTAL RESOLVED</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>{stats.resolved} <small style={{ fontSize: '0.6rem', fontWeight: '500' }}>TICKETS</small></span>
            </div>
            <div style={{ padding: '0 1rem', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: '600' }}>SECURITY STATUS</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--success)' }}>ENCRYPTED</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="theme-switch-wrapper">
              <span className="theme-label">{theme === 'gold' ? 'DARK MODE' : 'LIGHT MODE'}</span>
              <label className="theme-switch">
                <input 
                  type="checkbox" 
                  checked={theme === 'gold'} 
                  onChange={() => setTheme(theme === 'gold' ? 'cyan' : 'gold')}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="system-status">
              <span 
                className={`agent-status-dot`} 
                style={{ background: mailError ? '#ef4444' : (mailConnected ? '#10b981' : '#64748b') }}
                title={mailError || (mailConnected ? "Connected" : "Offline")}
              ></span>
              {mailError ? 'GMAIL ERROR' : (mailConnected ? 'GMAIL LIVE' : 'GMAIL OFFLINE')}
            </div>
            <div className="system-status">CORE VERSION: 2.1.0-PRO</div>
            <button 
              className="logout-btn" 
              onClick={() => setIsLoggedIn(false)}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#ef4444';
                e.target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                e.target.style.color = '#ef4444';
              }}
            >
              LOGOUT
            </button>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'dashboard' ? (
        <>
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
                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5', opacity: 0.8 }}>
                      {ticket.content}
                    </div>
                    {ticket.history.length > 0 && (
                      <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
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
        </>
      ) : activeTab === 'employees' ? (
        <EmployeeManager />
      ) : activeTab === 'employee-analytics' ? (
        <EmployeeAnalytics />
      ) : activeTab === 'policy' ? (
        <PolicyCenter />
      ) : activeTab === 'payroll' ? (
        <PayrollHub />
      ) : (
        <StrategyAnalytics />
      )}
        </div>
      </div>
    </div>
  );
}

export default App;
