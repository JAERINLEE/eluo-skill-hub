'use client';

import { useEffect } from 'react';
import { createClient } from '@/shared/infrastructure/supabase/client';

const LOGOUT_CHANNEL = 'eluo-hub-logout';

/**
 * 다른 탭에서 로그아웃 시 현재 탭도 로그인 페이지로 이동시키는 리스너.
 * BroadcastChannel API를 사용하여 같은 브라우저 내 모든 탭에 로그아웃을 전파한다.
 */
export function broadcastLogout() {
  try {
    const channel = new BroadcastChannel(LOGOUT_CHANNEL);
    channel.postMessage({ type: 'logout' });
    channel.close();
  } catch {
    // BroadcastChannel 미지원 환경 무시
  }
}

export default function CrossTabLogoutListener() {
  useEffect(() => {
    let channel: BroadcastChannel | null = null;

    try {
      channel = new BroadcastChannel(LOGOUT_CHANNEL);
      channel.onmessage = async (event: MessageEvent) => {
        if (event.data?.type === 'logout') {
          // 현재 탭의 쿠키도 삭제한 뒤 이동 (미들웨어 리다이렉트 루프 방지)
          const supabase = createClient();
          await supabase.auth.signOut();
          window.location.href = '/signin';
        }
      };
    } catch {
      // BroadcastChannel 미지원 환경 무시
    }

    return () => {
      channel?.close();
    };
  }, []);

  return null;
}
