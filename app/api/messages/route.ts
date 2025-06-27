import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({ url: process.env.REDIS_URL!, token: process.env.REDIS_TOKEN });
const SESSION_TOKEN = 'ig_viewer_session';
const REDIS_LIST_KEY = 'ig:julka-lukas:messages';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_TOKEN)?.value;
  if (!cookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // (In a real app, validate the token. Here, any token is accepted if present.)
  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '30', 10);
  const start = offset;
  const end = offset + limit - 1;
  const messages = await redis.lrange(REDIS_LIST_KEY, start, end);
  // Each message is a JSON string, parse them
  
  return NextResponse.json({ messages: messages });
} 