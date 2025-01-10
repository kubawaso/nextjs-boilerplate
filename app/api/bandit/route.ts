import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import BanditManager from '@/lib/bandit';

// Simple in-memory state (replace with DB in production)
interface BanditState {
  [videoId: string]: {
    arms: Array<{
      title: string;
      alpha: number;
      beta: number;
    }>;
    lastSelectedArm: number;
  };
}

// ESLint disable for this variable as it needs to be mutable for the bandit algorithm
// eslint-disable-next-line prefer-const
let banditState: BanditState = {
  "VIDEO_ID_EXAMPLE": {
    arms: [
      { title: "Placeholder Title A", alpha: 1, beta: 1 },
      { title: "Placeholder Title B", alpha: 1, beta: 1 }
    ],
    lastSelectedArm: 0
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'No videoId provided' }, { status: 400 });
  }

  // Get tokens from cookies
  const cookieStore = cookies();
  const tokenStr = cookieStore.get('youtube_token')?.value;
  
  if (!tokenStr) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const tokens = JSON.parse(tokenStr);

  // Create OAuth client
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);

  // Get bandit data
  const data = banditState[videoId];
  if (!data) {
    return NextResponse.json({ error: 'Video not found in banditState' }, { status: 404 });
  }

  // Select next title
  const manager = new BanditManager(data.arms);
  const chosenIndex = manager.selectArm();
  data.lastSelectedArm = chosenIndex;
  banditState[videoId] = data;

  const chosenTitle = data.arms[chosenIndex].title;

  // Update YouTube video title
  try {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    await youtube.videos.update({
      part: ['snippet'],
      requestBody: {
        id: videoId,
        snippet: {
          title: chosenTitle,
          categoryId: '22' // Default to "People & Blogs"
        }
      }
    });
  } catch(e) {
    console.error('Failed to update YouTube title:', e);
    return NextResponse.json({ error: 'Failed to update YouTube title' }, { status: 500 });
  }

  return NextResponse.json({ chosenTitle });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { videoId, reward } = body;

  if (!videoId || typeof reward !== 'number') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const data = banditState[videoId];
  if (!data) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  const manager = new BanditManager(data.arms);
  manager.updateArm(data.lastSelectedArm, reward);
  data.arms = manager.arms;
  banditState[videoId] = data;

  return NextResponse.json({ success: true, arms: data.arms });
} 