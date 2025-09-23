import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { findOrCreateRegion } from '../../../lib/geohash';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

export const runtime = 'nodejs';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the Firebase token
    let decodedToken;
    try {
  decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in token' },
        { status: 400 }
      );
    }

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          username: email.split('@')[0], // Use email prefix as username
        }
      });
    }

    // Parse the request body
    const body = await request.json();
    const { title, description, imageUrl, latitude, longitude, address, date } = body;

    // Validate required fields
    if (!title || !imageUrl || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: title, imageUrl, latitude, longitude' },
        { status: 400 }
      );
    }

    // Find or create region for this location
    const region = await findOrCreateRegion(latitude, longitude, prisma);

    // Parse the memory date if provided
    let memoryDate = null;
    if (date) {
      memoryDate = new Date(date);
      if (isNaN(memoryDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
    }

    // Create the memory post
    const post = await prisma.post.create({
      data: {
        title,
        description,
        imageUrl,
        latitude,
        longitude,
        address,
        memoryDate,
        userId: user.id,
        regionId: region.id,
        caption: description || title, // Fallback for backward compatibility
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        },
        region: true
      }
    });

    // Update region post count
    await prisma.region.update({
      where: { id: region.id },
      data: {
        postCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      memory: post,
      message: 'Memory saved successfully'
    });

  } catch (error) {
    console.error('Error creating memory:', error);
    const message = error instanceof Error ? error.message : 'Failed to create memory';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Server auth not configured or invalid token' },
        { status: 500 }
      );
    }

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in token' },
        { status: 400 }
      );
    }

    // Find or create user (creation ensures a row exists for new users)
    let user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) {
      // Fallback to email match or create if none
      user = await prisma.user.findUnique({ where: { email } });
    }
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          username: email.split('@')[0],
        },
      });
    }

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        region: true,
      },
    });

    return NextResponse.json({ memories: posts });
  } catch (error) {
    console.error('Error fetching memories:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch memories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}