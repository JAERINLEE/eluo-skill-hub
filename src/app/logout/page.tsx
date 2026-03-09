'use client';

import { createClient } from '@/shared/infrastructure/supabase/client';
import { broadcastLogout } from '@/shared/ui/CrossTabLogoutListener';

export default function LogoutPage() {
  const handleLogout = async () => {
    broadcastLogout();
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/signin';
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        type="button"
        onClick={handleLogout}
        className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
      >
        로그아웃
      </button>
    </div>
  );
}
