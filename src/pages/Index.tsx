import { useState, useEffect } from "react";
import AuthFlow from "@/components/AuthFlow";
import MainDashboard from "@/components/MainDashboard";
import { SessionManager } from "@/lib/session";

interface UserInfo {
  displayName: string;
  uniqueId: string;
}

const Index = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on component mount
  useEffect(() => {
    const savedSession = SessionManager.loadSession();
    if (savedSession) {
      setUser({
        displayName: savedSession.displayName,
        uniqueId: savedSession.uniqueId
      });
    }
    setIsLoading(false);
  }, []);

  const handleAuthenticated = (userInfo: UserInfo) => {
    setUser(userInfo);
    SessionManager.saveSession(userInfo);
  };

  const handleLogout = () => {
    setUser(null);
    SessionManager.clearSession();
  };

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <AuthFlow onAuthenticated={handleAuthenticated} />
      ) : (
        <MainDashboard userInfo={user} onLogout={handleLogout} />
      )}
    </>
  );
};

export default Index;
