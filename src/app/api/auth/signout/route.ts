import { NextResponse } from 'next/server';
import { createClient } from '@/shared/infrastructure/supabase/server';

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
