// Simple session management for Chat2Chat-Web
export interface UserSession {
  displayName: string;
  uniqueId: string;
  sessionToken: string;
  expiresAt: number;
}

const SESSION_KEY = 'chat2chat_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const SessionManager = {
  // Save user session
  saveSession: (userInfo: { displayName: string; uniqueId: string }): void => {
    const session: UserSession = {
      ...userInfo,
      sessionToken: generateSessionToken(),
      expiresAt: Date.now() + SESSION_DURATION
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  // Load user session
  loadSession: (): UserSession | null => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return null;

      const session: UserSession = JSON.parse(sessionData);
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        SessionManager.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error loading session:', error);
      SessionManager.clearSession();
      return null;
    }
  },

  // Clear user session
  clearSession: (): void => {
    localStorage.removeItem(SESSION_KEY);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const session = SessionManager.loadSession();
    return session !== null;
  },

  // Get current user info
  getCurrentUser: (): { displayName: string; uniqueId: string } | null => {
    const session = SessionManager.loadSession();
    if (!session) return null;
    
    return {
      displayName: session.displayName,
      uniqueId: session.uniqueId
    };
  }
};

// Generate a simple session token
function generateSessionToken(): string {
  return btoa(Date.now() + Math.random().toString(36)).substring(0, 32);
}
