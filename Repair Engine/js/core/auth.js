// File: /js/core/auth.js
// Authentication, Session State & Dynamic Role-Switching Engine

import { getSupabase } from './supabase.js';
import { store } from './store.js';
import { MOCK_DATABASE } from './mock-data.js';

export const auth = {
  async init() {
    // Check if user has an active authenticated session
    const savedUserId = localStorage.getItem('relief_active_user_id');
    
    if (savedUserId) {
      const user = MOCK_DATABASE.users.find(u => u.id === savedUserId);
      if (user) {
        store.setState({
          user: { id: user.id, email: user.email },
          profile: user
        });
        return user;
      }
    }

    // Default to unauthenticated (Login required)
    store.setState({ user: null, profile: null });
    return null;
  },

  isAuthenticated() {
    return !!store.getState().profile;
  },

  // Instant Interactive Role Switching
  switchUser(userId) {
    const targetUser = MOCK_DATABASE.users.find(u => u.id === userId);
    if (!targetUser) return;

    localStorage.setItem('relief_active_user_id', targetUser.id);
    store.setState({
      user: { id: targetUser.id, email: targetUser.email },
      profile: targetUser
    });

    window.dispatchEvent(new CustomEvent('role_changed', { detail: targetUser }));
  },

  getCurrentUser() {
    return store.getState().profile;
  },

  async login(identifier, password = '') {
    const clean = String(identifier || '').trim().toLowerCase();
    const user = MOCK_DATABASE.users.find(u => 
      (u.academicId && u.academicId.toLowerCase() === clean) ||
      (u.id && u.id.toLowerCase() === clean) ||
      (u.email && u.email.toLowerCase() === clean)
    );
    if (!user) {
      throw new Error(`Academic account not found for ID "${identifier}". Use quick launch or IDs: ADM-2026, HOD-CSE, FAC-101, STU-042`);
    }

    this.switchUser(user.id);
    return user;
  },

  async logout() {
    localStorage.removeItem('relief_active_user_id');
    store.setState({ user: null, profile: null });
  },

  hasRole(...roles) {
    const profile = this.getCurrentUser();
    if (!profile) return false;
    if (profile.role === 'super_admin') return true;
    return roles.includes(profile.role);
  }
};
