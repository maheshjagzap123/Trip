import { useEffect, useState } from 'react';
import { MessageSquare, Star, CheckCircle, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Users.css';
import './Dashboard.css';

interface FeedbackItem {
  id: string;
  user_id: string;
  type: string;
  rating: number | null;
  subject: string | null;
  message: string;
  user_email: string | null;
  user_name: string | null;
  status: string;
  admin_reply: string | null;
  platform: string | null;
  created_at: string;
}

export function Feedback() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'resolved' | 'archived'>('all');

  useEffect(() => {
    fetchFeedback();

    // Realtime subscription for live updates
    const channel = supabase
      .channel('feedback-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems((prev) => [payload.new as FeedbackItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) => prev.map((item) => item.id === (payload.new as FeedbackItem).id ? payload.new as FeedbackItem : item));
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((item) => item.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) setItems(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('feedback').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
  };

  const filtered = items.filter((item) => {
    if (filter === 'all') return item.status !== 'archived';
    if (filter === 'new') return item.status === 'new';
    if (filter === 'resolved') return item.status === 'resolved';
    if (filter === 'archived') return item.status === 'archived';
    return true;
  });

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={14} fill={n <= rating ? '#FFB648' : 'transparent'} color={n <= rating ? '#FFB648' : 'var(--text-tertiary)'} />
        ))}
      </div>
    );
  };

  const newCount = items.filter((i) => i.status === 'new').length;
  const archivedCount = items.filter((i) => i.status === 'archived').length;

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Feedback & Reports</h1>
        <p>{items.length} total • {newCount} new</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {(['all', 'new', 'resolved', 'archived'] as const).map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'new' && newCount > 0 && <span className="tab-badge">{newCount}</span>}
            {f === 'archived' && archivedCount > 0 && <span className="tab-badge" style={{ background: 'var(--text-tertiary)' }}>{archivedCount}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loading">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-feedback">
          <MessageSquare size={48} color="var(--text-tertiary)" />
          <h3>No feedback yet</h3>
          <p>User feedback will appear here once they submit from the app.</p>
        </div>
      ) : (
        <div className="users-list">
          {filtered.map((item) => (
            <div key={item.id} className="user-card" style={{ alignItems: 'flex-start' }}>
              <div className="user-avatar-lg" style={{ background: item.type === 'feedback' ? 'rgba(255, 182, 72, 0.12)' : 'rgba(91, 140, 255, 0.12)', fontSize: '18px' }}>
                {item.type === 'feedback' ? '⭐' : '✉️'}
              </div>
              <div className="user-info" style={{ gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="user-name">
                    {item.user_name || item.user_email || 'Anonymous'}
                  </span>
                  {renderStars(item.rating)}
                  {item.platform && (
                    <span style={{ fontSize: '10px', background: 'var(--surface-elevated)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-tertiary)' }}>
                      {item.platform}
                    </span>
                  )}
                </div>
                {item.subject && (
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {item.subject}
                  </span>
                )}
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  {item.message}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {item.user_email && (
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {item.user_email}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div className="user-meta" style={{ gap: '8px' }}>
                <span className={`status-badge ${item.status === 'new' ? 'incomplete' : 'complete'}`}>
                  {item.status}
                </span>
                {item.status === 'new' && (
                  <button
                    className="action-btn"
                    onClick={() => updateStatus(item.id, 'resolved')}
                    title="Mark resolved"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                {item.status === 'resolved' && (
                  <button
                    className="action-btn"
                    onClick={() => updateStatus(item.id, 'archived')}
                    title="Archive"
                  >
                    <Archive size={16} />
                  </button>
                )}
                {item.status === 'archived' && (
                  <button
                    className="action-btn"
                    onClick={() => updateStatus(item.id, 'new')}
                    title="Unarchive (move back to New)"
                  >
                    <MessageSquare size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
