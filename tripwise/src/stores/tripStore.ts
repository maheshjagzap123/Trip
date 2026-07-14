import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Trip {
  id: string;
  trip_name: string;
  destination: string | null;
  description: string | null;
  cover_image_url: string | null;
  start_date: string;
  end_date: string;
  budget_amount: number | null;
  budget_currency: string;
  trip_type: string | null;
  status: string;
  created_by: string;
  created_at: string;
  creator_name?: string;
}

interface TripInvitation {
  id: string;
  trip_id: string;
  trip_name: string;
  destination: string | null;
  invited_by_name: string;
  created_at: string;
}

interface TripState {
  trips: Trip[];
  invitations: TripInvitation[];
  isLoading: boolean;

  fetchTrips: () => Promise<void>;
  fetchInvitations: () => Promise<void>;
  createTrip: (tripData: CreateTripInput, memberEmails: string[]) => Promise<void>;
  acceptInvitation: (tripId: string) => Promise<void>;
  declineInvitation: (tripId: string) => Promise<void>;
  subscribeToRealtime: () => () => void;
}

interface CreateTripInput {
  trip_name: string;
  destination: string | null;
  description: string | null;
  start_date: string;
  end_date: string;
  trip_type: string;
  budget_amount: number | null;
  budget_currency: string;
  created_by: string;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  invitations: [],
  isLoading: false,

  fetchTrips: async () => {
    set({ isLoading: true });
    try {
      // Get trips where user is an active member
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberRows } = await supabase
        .from('trip_members')
        .select('trip_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!memberRows || memberRows.length === 0) {
        set({ trips: [], isLoading: false });
        return;
      }

      const tripIds = memberRows.map((r) => r.trip_id);

      const { data: trips } = await supabase
        .from('trips')
        .select('*')
        .in('id', tripIds)
        .order('start_date', { ascending: false });

      set({ trips: trips || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchInvitations: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get pending memberships for this user
      const { data: pendingRows } = await supabase
        .from('trip_members')
        .select('trip_id, invited_by, created_at')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (!pendingRows || pendingRows.length === 0) {
        set({ invitations: [] });
        return;
      }

      const tripIds = pendingRows.map((r) => r.trip_id);
      const inviterIds = pendingRows.map((r) => r.invited_by).filter(Boolean);

      // Fetch trip details
      const { data: trips } = await supabase
        .from('trips')
        .select('id, trip_name, destination, created_by')
        .in('id', tripIds);

      // Fetch inviter names
      const { data: inviters } = inviterIds.length > 0
        ? await supabase.from('profiles').select('id, display_name').in('id', inviterIds)
        : { data: [] };

      // Build invitation objects
      const invitations: TripInvitation[] = pendingRows.map((row) => {
        const trip = trips?.find((t) => t.id === row.trip_id);
        const inviter = inviters?.find((p) => p.id === row.invited_by);
        return {
          id: row.trip_id,
          trip_id: row.trip_id,
          trip_name: trip?.trip_name || 'Unknown Trip',
          destination: trip?.destination || null,
          invited_by_name: inviter?.display_name || 'A friend',
          created_at: row.created_at,
        };
      });

      set({ invitations });
    } catch {
      // silently fail
    }
  },

  createTrip: async (tripData: CreateTripInput, memberEmails: string[]) => {
    // 1. Create the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert(tripData)
      .select()
      .single();

    if (tripError || !trip) {
      throw new Error(tripError?.message || 'Failed to create trip');
    }

    // 2. Add creator as admin member
    const { error: memberError } = await supabase
      .from('trip_members')
      .insert({
        trip_id: trip.id,
        user_id: tripData.created_by,
        role: 'admin',
        status: 'active',
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      throw new Error(memberError.message);
    }

    // 3. Invite members by email
    for (const email of memberEmails) {
      // Use RPC function to find user by email (bypasses RLS)
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('find_profile_by_email', { lookup_email: email });

      console.log(`Invite lookup for ${email}:`, { rpcResult, rpcError });

      if (rpcError) {
        console.warn(`RPC error for ${email}:`, rpcError.message);
        continue;
      }

      // rpc returns an array, take first result
      const foundUser = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;

      if (foundUser && foundUser.id) {
        // User exists on TripWise — add as pending member
        const { error: inviteError } = await supabase.from('trip_members').insert({
          trip_id: trip.id,
          user_id: foundUser.id,
          role: 'member',
          status: 'pending',
          invited_by: tripData.created_by,
        });

        if (inviteError) {
          console.warn(`Failed to invite ${email}:`, inviteError.message);
        } else {
          console.log(`Successfully invited ${email} as pending member`);
        }
      } else {
        console.warn(`User ${email} not found on TripWise`, { foundUser });
      }
    }

    // 4. Refresh trips list
    await get().fetchTrips();
  },

  acceptInvitation: async (tripId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('trip_members')
      .update({ status: 'active', joined_at: new Date().toISOString() })
      .eq('trip_id', tripId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);

    // Refresh both lists
    await get().fetchTrips();
    await get().fetchInvitations();
  },

  declineInvitation: async (tripId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);

    await get().fetchInvitations();
  },

  subscribeToRealtime: () => {
    // Subscribe to trip_members changes (new invites, accepted invites)
    const channel = supabase
      .channel('trip-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_members',
        },
        (payload) => {
          console.log('Real-time trip_members update:', payload.eventType);
          // Refresh data on any change
          get().fetchTrips();
          get().fetchInvitations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('Real-time notification:', payload.new);
          get().fetchInvitations();
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
