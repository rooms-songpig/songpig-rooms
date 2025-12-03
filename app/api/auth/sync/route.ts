import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseServer } from '@/app/lib/supabase-server';
import { userStore } from '@/app/lib/users';

// POST /api/auth/sync - Sync Supabase Auth user with app users table
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supabaseUserId, email, name, avatarUrl } = body;

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: 'Supabase user ID is required' },
        { status: 400 }
      );
    }

    // Check if user already exists by auth_id
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('*')
      .eq('auth_id', supabaseUserId)
      .single();

    if (existingUser) {
      // User exists, update avatar if provided
      const updates: any = {};
      if (avatarUrl !== undefined) {
        updates.avatar_url = avatarUrl;
      }
      if (email && !existingUser.email) {
        updates.email = email;
      }

      if (Object.keys(updates).length > 0) {
        await supabaseServer
          .from('users')
          .update(updates)
          .eq('id', existingUser.id);
      }

      // Return user without password hash
      const { password_hash, ...userResponse } = existingUser;
      return NextResponse.json({ 
        user: {
          ...userResponse,
          id: existingUser.id,
          username: existingUser.username,
          role: existingUser.role,
          status: existingUser.status,
        }
      });
    }

    // User doesn't exist, create new user
    // Generate username from email or name
    let username = '';
    if (email) {
      username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    } else if (name) {
      username = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    } else {
      username = `user_${supabaseUserId.substring(0, 8)}`;
    }

    // Ensure username is unique
    let finalUsername = username;
    let counter = 1;
    while (true) {
      const { data: checkUser } = await supabaseServer
        .from('users')
        .select('id')
        .ilike('username', finalUsername)
        .single();

      if (!checkUser) {
        break;
      }
      finalUsername = `${username}${counter}`;
      counter++;
    }

    // Create user with a temporary password (they'll use OAuth)
    // Generate a random password hash since OAuth users don't need password
    const tempPassword = `oauth_${Math.random().toString(36).substring(2, 15)}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const now = new Date().toISOString();
    const { data: newUser, error: insertError } = await supabaseServer
      .from('users')
      .insert({
        username: finalUsername,
        email: email || null,
        password_hash: passwordHash,
        role: 'listener', // Default role, can be changed later
        status: 'active',
        bio: '',
        created_at: now,
        auth_id: supabaseUserId,
        avatar_url: avatarUrl || null,
        allow_managed_uploads: true,
        max_cloud_songs: 6,
        storage_used_bytes: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Return user without password hash
    const { password_hash: _, ...userResponse } = newUser;
    return NextResponse.json({ 
      user: {
        ...userResponse,
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        status: newUser.status,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}

