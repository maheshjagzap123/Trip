import { useEffect, useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Users.css';

interface User {
  id: string;
  display_name: string | null;
  email: string | null;
  home_city: string | null;
  phone_number: string | null;
  profile_completed: boolean;
  created_at: string;
}

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, email, home_city, phone_number, profile_completed, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    setUsers(data || []);
    setLoading(false);
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.display_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.home_city || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Users</h1>
        <p>{users.length} registered users</p>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={18} color="var(--text-tertiary)" />
        <input
          type="text"
          placeholder="Search by name, email, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* User List */}
      {loading ? (
        <div className="page-loading">Loading...</div>
      ) : (
        <div className="users-list">
          {filtered.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-avatar-lg">
                {(user.display_name || user.email || '?')[0].toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{user.display_name || 'No Name'}</span>
                <span className="user-email">{user.email || 'No email'}</span>
                {user.home_city && (
                  <span className="user-city">
                    <MapPin size={12} /> {user.home_city}
                  </span>
                )}
              </div>
              <div className="user-meta">
                <span className={`status-badge ${user.profile_completed ? 'complete' : 'incomplete'}`}>
                  {user.profile_completed ? 'Complete' : 'Incomplete'}
                </span>
                <span className="user-date">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}
