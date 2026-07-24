import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Users.css';

interface Group {
  id: string;
  trip_name: string;
  group_type: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  member_count?: number;
}

const TYPE_EMOJI: Record<string, string> = {
  Trip: '✈️', Flatmates: '🏠', Family: '👨‍👩‍👧', Friends: '👫',
  Couple: '💑', Office: '💼', Business: '🏢', College: '🎓',
  Event: '🎉', Wedding: '💒', 'Sports Team': '⚽', 'Monthly Household': '🏡', Custom: '📌',
};

export function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();

    const channel = supabase
      .channel('groups-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => fetchGroups())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members' }, () => fetchGroups())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('trips')
      .select('id, trip_name, group_type, destination, start_date, end_date, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      // Get member counts
      const { data: members } = await supabase
        .from('trip_members')
        .select('trip_id')
        .eq('status', 'active');

      const counts: Record<string, number> = {};
      members?.forEach((m) => {
        counts[m.trip_id] = (counts[m.trip_id] || 0) + 1;
      });

      setGroups(data.map((g) => ({ ...g, member_count: counts[g.id] || 0 })));
    }
    setLoading(false);
  };

  const filtered = groups.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.trip_name.toLowerCase().includes(q) ||
      (g.group_type || '').toLowerCase().includes(q) ||
      (g.destination || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Groups</h1>
        <p>{groups.length} total groups</p>
      </div>

      <div className="search-bar">
        <Search size={18} color="var(--text-tertiary)" />
        <input
          type="text"
          placeholder="Search by name, type, or destination..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="page-loading">Loading...</div>
      ) : (
        <div className="users-list">
          {filtered.map((group) => (
            <div key={group.id} className="user-card">
              <div className="user-avatar-lg" style={{ background: 'var(--surface-elevated)', fontSize: '20px' }}>
                {TYPE_EMOJI[group.group_type || ''] || '📌'}
              </div>
              <div className="user-info">
                <span className="user-name">{group.trip_name}</span>
                <span className="user-email">{group.group_type || 'Unknown'} {group.destination ? `• ${group.destination}` : ''}</span>
                <span className="user-city">
                  <Users size={12} /> {group.member_count} members
                </span>
              </div>
              <div className="user-meta">
                <span className="status-badge complete">{group.group_type || 'Group'}</span>
                <span className="user-date">{new Date(group.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">No groups found</div>
          )}
        </div>
      )}
    </div>
  );
}
