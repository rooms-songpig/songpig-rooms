import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/comments/[commentId]/reactions - Get reactions for a comment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;

    const { data, error } = await supabaseServer
      .from('comment_reactions')
      .select('reaction_type, user_id')
      .eq('comment_id', commentId);

    if (error) {
      console.error('Error fetching reactions:', error);
      return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
    }

    // Count reactions by type
    const counts: Record<string, number> = {};
    const userReactions: Record<string, string[]> = {};
    
    for (const reaction of data || []) {
      counts[reaction.reaction_type] = (counts[reaction.reaction_type] || 0) + 1;
      if (!userReactions[reaction.user_id]) {
        userReactions[reaction.user_id] = [];
      }
      userReactions[reaction.user_id].push(reaction.reaction_type);
    }

    return NextResponse.json({ counts, userReactions, total: data?.length || 0 });
  } catch (error) {
    console.error('Error in reactions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/comments/[commentId]/reactions - Add/toggle a reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { commentId } = await params;
    const { reactionType } = await request.json();

    const validTypes = ['like', 'love', 'insightful', 'fire'];
    if (!validTypes.includes(reactionType)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    // Check if user already has this reaction
    const { data: existing } = await supabaseServer
      .from('comment_reactions')
      .select('id, reaction_type')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .limit(1);

    if (existing && existing.length > 0) {
      if (existing[0].reaction_type === reactionType) {
        // Same reaction - remove it (toggle off)
        await supabaseServer
          .from('comment_reactions')
          .delete()
          .eq('id', existing[0].id);
        
        return NextResponse.json({ action: 'removed', reactionType });
      } else {
        // Different reaction - update it
        await supabaseServer
          .from('comment_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', existing[0].id);
        
        return NextResponse.json({ action: 'changed', reactionType });
      }
    }

    // No existing reaction - add new one
    const { error } = await supabaseServer
      .from('comment_reactions')
      .insert({
        comment_id: commentId,
        user_id: userId,
        reaction_type: reactionType,
      });

    if (error) {
      console.error('Error adding reaction:', error);
      return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
    }

    return NextResponse.json({ action: 'added', reactionType }, { status: 201 });
  } catch (error) {
    console.error('Error in reactions POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


