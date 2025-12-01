import { NextResponse } from 'next/server';

export async function GET() {
  // Vercel provides these environment variables automatically
  const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || 'Local development';
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || 'local';
  const commitDate = process.env.VERCEL_GIT_COMMIT_DATE || new Date().toISOString();

  return NextResponse.json({
    message: commitMessage,
    sha: commitSha,
    date: commitDate,
  });
}


