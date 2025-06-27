import { NextRequest, NextResponse } from 'next/server';

const SESSION_TOKEN = 'ig_viewer_session';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }
  if (password === process.env.IG_VIEWER_PASSWORD) {
    // Generate a simple session token (timestamp + random)
    const token = Buffer.from(`${Date.now()}_${Math.random()}`).toString('base64');
    // Set token as HttpOnly cookie
    return new NextResponse(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          'Set-Cookie': `${SESSION_TOKEN}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
          'Content-Type': 'application/json',
        },
      }
    );
  } else {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
} 