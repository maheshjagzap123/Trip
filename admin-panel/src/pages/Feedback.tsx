import { useEffect, useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Users.css';

interface FeedbackItem {
  id: string;
  user_id: string;
  type: string;
  rating: number | null;
  message: string;
  created_at: string;
  user_name?: string;
}

export function Feedback() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    // Try to fetch from a feedback table (may not exist yet)
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      // Enrich with user names
      const userIds = [...new Set(data.map((f) => f.user_id))];
      const { data: profiles } = await supabase.rpc('get_profiles_by_ids', { user_ids: userIds });
      
      const enriched = data.map((f) => {
        const profile = (profiles as any[])?.find((p: any) => p.id === f.user_id);
        return { ...f, user_name: profile?.display_name || 'Unknown' };
      });
      setItems(enriched);
    }
    setLoading(false);
  };

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

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Feedback</h1>
        <p>User reviews and bug reports</p>
      </div>

      {loading ? (
        <div className="page-loading">Loading...</div>
      ) : items.length === 0 ? (
        <div className="empty-feedback">
          <MessageSquare size={48} color="var(--text-tertiary)" />
          <h3>No feedback yet</h3>
          <p>User feedback will appear here once they submit ratings or reports from the app.</p>
          <p className="hint">
            To enable this, create a <code>feedback</code> table in Supabase with columns:<br />
            id, user_id, type, rating, message, created_at
          </p>
        </div>
      ) : (
        <div className="users-list">
          {items.map((item) => (
            <div key={item.id} className="user-card" style={{ alignItems: 'flex-start' }}>
              <div className="user-avatar-lg">
                {(item.user_name || '?')[0].toUpperCase()}
              </div>
              <div className="user-info" style={{ gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="user-name">{item.user_name}</span>
                  {renderStars(item.rating)}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {item.message}
                </p>
                <span className="user-date">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <div className="user-meta">
                <span className="status-badge complete">{item.type || 'Feedback'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
