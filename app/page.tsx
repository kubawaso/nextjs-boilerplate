'use client';

import { useState } from 'react';

export default function Home() {
  const [videoId, setVideoId] = useState('VIDEO_ID_EXAMPLE');
  const [chosenTitle, setChosenTitle] = useState('');
  const [reward, setReward] = useState(0);

  async function startAuth() {
    window.location.href = '/api/oauth';
  }

  async function getNextTitle() {
    const res = await fetch(`/api/bandit?videoId=${videoId}`);
    const data = await res.json();
    if (data.chosenTitle) setChosenTitle(data.chosenTitle);
  }

  async function sendReward() {
    await fetch('/api/bandit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, reward: parseFloat(reward.toString()) })
    });
    setChosenTitle('');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">YouTube Title Optimizer - Multi-Armed Bandit</h1>

        <div className="mb-8">
          <button 
            onClick={startAuth}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Login with YouTube
          </button>
        </div>

        <div className="mb-8">
          <input
            value={videoId}
            onChange={e => setVideoId(e.target.value)}
            placeholder="Video ID"
            className="border p-2 mr-2 rounded"
          />
          <button 
            onClick={getNextTitle}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Get Next Title
          </button>
          <p className="mt-2">
            Chosen Title: <strong>{chosenTitle}</strong>
          </p>
        </div>

        <div className="mb-8">
          <input
            type="number"
            value={reward}
            onChange={e => setReward(parseFloat(e.target.value))}
            placeholder="Reward (0 or 1)"
            className="border p-2 mr-2 rounded"
            min="0"
            max="1"
            step="1"
          />
          <button 
            onClick={sendReward}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Send Reward
          </button>
        </div>
      </div>
    </main>
  );
}
