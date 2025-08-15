import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface AuthFlowProps {
  onAuthenticated: (userInfo: { displayName: string; uniqueId: string }) => void;
}

const AuthFlow = ({ onAuthenticated }: AuthFlowProps) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [loading, setLoading] = useState(false);

  const generateUniqueId = (name: string): string => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const namePrefix = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 4);
    return `${namePrefix}${timestamp}${randomStr}`.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const generatedId = generateUniqueId(displayName);
        setUniqueId(generatedId);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        onAuthenticated({
          displayName,
          uniqueId: generatedId
        });
      } else {
        // Sign in logic
        await new Promise(resolve => setTimeout(resolve, 1000));
        onAuthenticated({
          displayName,
          uniqueId
        });
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="card-cute w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mt-4 mb-2">
            Chat2Chat-Web
          </h1>
          <p className="text-muted-foreground">
            {isSignUp ? "Join the cutest chat experience!" : "Welcome back, friend!"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-foreground">
              Display Name
            </label>
            <Input
              id="displayName"
              type="text"
              placeholder="Enter your cute username"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="rounded-2xl border-2 border-border/50 bg-input/50 focus:border-primary focus:glow transition-all"
            />
          </div>

          {!isSignUp && (
            <div className="space-y-2">
              <label htmlFor="uniqueId" className="text-sm font-medium text-foreground">
                Unique ID
              </label>
              <Input
                id="uniqueId"
                type="text"
                placeholder="Your generated ID"
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value)}
                required
                className="rounded-2xl border-2 border-border/50 bg-input/50 focus:border-primary focus:glow transition-all"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Create a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-2xl border-2 border-border/50 bg-input/50 focus:border-primary focus:glow transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="btn-neon w-full mt-6"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {isSignUp ? "Creating Account..." : "Signing In..."}
              </div>
            ) : (
              isSignUp ? "Create Account" : "Sign In"
            )}
          </Button>

          {isSignUp && uniqueId && (
            <div className="mt-4 p-3 bg-secondary/50 rounded-2xl border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Your unique ID:</p>
              <p className="text-sm font-mono text-primary font-bold tracking-wider">
                {uniqueId}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Save this ID - you'll need it to sign in!
              </p>
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AuthFlow;