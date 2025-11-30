import { NextRequest, NextResponse } from 'next/server';
import { analyzeFeedbackSeverity } from '@/app/lib/ai/analyze-feedback';

const validTypes = ['bug', 'feature', 'question', 'other'];
const validStatuses = ['open', 'in_progress', 'resolved', 'closed', 'wont_fix'];
const validPriorities = ['low', 'normal', 'high', 'critical'];

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, description, type, currentStatus, currentPriority } = body || {};

    if (!title || typeof title !== 'string' || !description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
    }

    if (currentStatus && !validStatuses.includes(currentStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (currentPriority && !validPriorities.includes(currentPriority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    const suggestion = await analyzeFeedbackSeverity({
      id,
      title,
      description,
      type,
      currentStatus,
      currentPriority,
    });

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('AI analysis failed:', error);
    return NextResponse.json(
      { error: 'AI analysis unavailable. Please try again later.' },
      { status: 500 }
    );
  }
}
