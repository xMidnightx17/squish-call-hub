import { useState } from "react";
import AuthFlow from "@/components/AuthFlow";
import MainDashboard from "@/components/MainDashboard";

interface UserInfo {
  displayName: string;
  uniqueId: string;
}

const Index = () => {
  const [user, setUser] = useState<UserInfo | null>(null);

  const handleAuthenticated = (userInfo: UserInfo) => {
    setUser(userInfo);
  };

  const handleLogout = () => {
    setUser(null);
  };

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
