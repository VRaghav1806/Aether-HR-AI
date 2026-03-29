import React, { useState } from 'react';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Validate credentials
    setTimeout(() => {
      if (email === 'raghavv1806@gmail.com' && password === '123456') {
        onLogin();
      } else {
        setError('Invalid Access ID or Password. Please try again.');
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="login-screen">
      {/* Premium Background Layers */}
      <div className="mesh-gradient-bg"></div>
      <div className="data-grid-overlay"></div>
      
      {/* Branding Meta */}
      <div className="login-brand-meta">
        <span className="meta-token">AETHER CORE v2.1</span>
        <span className="meta-token" style={{ opacity: 0.6 }}>NETWORK: ENCRYPTED</span>
      </div>

      <div className="login-card">
        <div className="login-header">
          <h1>Aether Portal</h1>
          <p>Secure Enterprise HR Orchestration</p>
        </div>

        {error && (
          <div className="error-message" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            padding: '0.75rem', 
            borderRadius: '12px', 
            fontSize: '0.85rem',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <div className="login-input-wrapper">
              <label htmlFor="email">Access ID</label>
              <input 
                type="email" 
                id="email"
                className="login-input" 
                placeholder="name@aether.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            <div className="login-input-wrapper">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password"
                className="login-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button className="login-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'ESTABLISHING LINK...' : 'AUTHORIZE LOGIN'}
          </button>
        </form>

        <div className="login-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <div className="pulse-dot" style={{ width: '6px', height: '6px' }}></div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', opacity: 0.8 }}>BIOMETRIC TUNNEL ACTIVE</span>
          </div>
          <p style={{ opacity: 0.5 }}>© 2026 Aether Agentic Systems. All paths encrypted.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
