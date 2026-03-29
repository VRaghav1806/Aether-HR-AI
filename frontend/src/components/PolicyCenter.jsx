import React, { useState, useEffect } from 'react';

const PolicyCenter = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({ id: '', title: '', category: 'General', description: '', status: 'Active', updated: new Date().toISOString().split('T')[0], coverage: '100%' });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/policies");
      const data = await response.json();
      setPolicies(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching policies:", err);
      setLoading(false);
    }
  };

  const handleOpenModal = (policy = null) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData(policy);
    } else {
      setEditingPolicy(null);
      setFormData({ id: `POL-${Math.floor(Math.random() * 9000) + 1000}`, title: '', category: 'General', description: '', status: 'Active', updated: new Date().toISOString().split('T')[0], coverage: '100%' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const method = editingPolicy ? 'PUT' : 'POST';
    const url = editingPolicy ? `http://127.0.0.1:8000/policies/${editingPolicy.id}` : 'http://127.0.0.1:8000/policies';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowModal(false);
        fetchPolicies();
      }
    } catch (err) {
      console.error("Error saving policy:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this policy?")) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/policies/${id}`, { method: 'DELETE' });
      if (response.ok) fetchPolicies();
    } catch (err) {
      console.error("Error deleting policy:", err);
    }
  };

  const categories = ['All', 'General', 'Benefits', 'Compensation', 'Safety'];

  const filteredPolicies = policies.filter(p => 
    (selectedCategory === 'All' || p.category === selectedCategory) &&
    (p.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="policy-center fade-in">
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingPolicy ? 'Edit AI Policy' : 'Create New AI Policy'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>POLICY TITLE</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Remote Work Framework"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>RULES & DESCRIPTION</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Define the binding rules for the AI..."
                  style={{ width: '100%', minHeight: '100px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>CATEGORY</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                  >
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>STATUS</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={handleSave} style={{ flex: 1 }}>SAVE POLICY</button>
                {editingPolicy && (
                  <button 
                    onClick={() => { handleDelete(editingPolicy.id); setShowModal(false); }} 
                    style={{ flex: 1, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', boxShadow: 'none' }}
                  >
                    DELETE POLICY
                  </button>
                )}
                <button onClick={() => setShowModal(false)} style={{ flex: 1, background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>CANCEL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="header-section" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>AI Policy & Knowledge Base</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Define the core logic and context the AI uses to assist your workforce.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search policy database..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem 0.75rem 2.5rem', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)',
                background: 'var(--bg-dark)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.75rem',
                  borderRadius: '999px',
                  background: selectedCategory === cat ? 'var(--accent-cyan)' : 'var(--badge-bg)',
                  color: selectedCategory === cat ? '#fff' : 'var(--text-dim)',
                  boxShadow: 'none',
                  transform: 'none'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <button onClick={() => handleOpenModal()} style={{ padding: '0.75rem 1.5rem', fontSize: '0.8rem' }}>+ NEW POLICY</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>Syncing Knowledge Base...</div>
      ) : (
        <div className="policy-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredPolicies.map(policy => (
            <div key={policy.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: 'var(--badge-bg)', color: 'var(--accent-cyan)' }}>{policy.id}</span>
                <span className="score-badge" style={{ 
                  background: policy.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: policy.status === 'Active' ? 'var(--success)' : 'var(--warning)'
                }}>
                  {policy.status}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{policy.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{policy.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <span>Category: <strong>{policy.category}</strong></span>
                <span>AI Coverage: <strong style={{ color: 'var(--accent-blue)' }}>{policy.coverage}</strong></span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Last Sync: {policy.updated}</span>
                <span 
                  onClick={() => handleOpenModal(policy)}
                  style={{ color: 'var(--accent-cyan)', fontWeight: '700', cursor: 'pointer' }}
                >EDIT KNOWLEDGE →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PolicyCenter;
