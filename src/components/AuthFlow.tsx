import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthFlowProps {
  onAuthenticated: (userInfo: { displayName: string; uniqueId: string }) => void;
}

const AuthFlow = ({ onAuthenticated }: AuthFlowProps) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Simple password hashing (in production, use bcrypt or similar)
  const hashPassword = (password: string): string => {
    return btoa(password + "salt_chat2chat"); // Base64 encoding for simplicity
  };

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
        // Check if display name already exists
        const { data: existing } = await supabase
          .from('chat_users')
          .select('display_name')
          .eq('display_name', displayName)
          .single();

        if (existing) {
          toast({
            title: "Display name taken",
            description: "This display name is already in use. Please choose another one.",
            variant: "destructive"
          });
          return;
        }

        // Create new user
        const uniqueId = generateUniqueId(displayName);
        const passwordHash = hashPassword(password);

        const { error } = await supabase
          .from('chat_users')
          .insert([{
            display_name: displayName,
            unique_id: uniqueId,
            password_hash: passwordHash
          }]);

        if (error) {
          throw error;
        }

        toast({
          title: "Account created!",
          description: `Your unique ID is: ${uniqueId}`,
        });

        onAuthenticated({
          displayName,
          uniqueId
        });
      } else {
        // Sign in - find user by display name and verify password
        const { data: user, error } = await supabase
          .from('chat_users')
          .select('*')
          .eq('display_name', displayName)
          .single();

        if (error || !user) {
          toast({
            title: "Sign in failed",
            description: "Display name not found. Please check your credentials.",
            variant: "destructive"
          });
          return;
        }

        // Verify password
        const passwordHash = hashPassword(password);
        if (user.password_hash !== passwordHash) {
          toast({
            title: "Sign in failed", 
            description: "Incorrect password. Please try again.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Welcome back!",
          description: `Signed in as ${displayName}`,
        });

        onAuthenticated({
          displayName: user.display_name,
          uniqueId: user.unique_id
        });
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
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
              placeholder={isSignUp ? "Enter your cute username" : "Your display name"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="rounded-2xl border-2 border-border/50 bg-input/50 focus:border-primary focus:glow transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder={isSignUp ? "Create a secure password" : "Enter your password"}
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

          {isSignUp && (
            <div className="mt-4 p-3 bg-secondary/50 rounded-2xl border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">After signup, you'll get a unique ID that you can use to connect with friends!</p>
              <p className="text-xs text-primary">💡 Just remember your display name and password for future logins!</p>
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