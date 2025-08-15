import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserPresence = (userUniqueId: string) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userUniqueId) return;

    const updateUserStatus = async (status: 'online' | 'offline') => {
      try {
        // Get user's database ID
        const { data: userData } = await supabase
          .from('chat_users')
          .select('id')
          .eq('unique_id', userUniqueId)
          .single();

        if (!userData?.id) return;

        // Update presence using upsert
        await supabase
          .from('user_presence')
          .upsert({
            user_id: userData.id,
            status,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        console.log(`User status updated to: ${status}`);
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    };

    // Set user as online when component mounts
    updateUserStatus('online');

    // Update status every 30 seconds to keep presence fresh
    intervalRef.current = setInterval(() => {
      updateUserStatus('online');
    }, 30000);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateUserStatus('offline');
      } else {
        updateUserStatus('online');
      }
    };

    // Handle window focus/blur
    const handleFocus = () => updateUserStatus('online');
    const handleBlur = () => updateUserStatus('offline');

    // Handle beforeunload to set offline status
    const handleBeforeUnload = () => {
      updateUserStatus('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Set user as offline
      updateUserStatus('offline');
    };
  }, [userUniqueId]);
};
