import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { trackingLogs, driverTasks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Verify driver authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'DRIVER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { taskId, latitude, longitude, accuracy, speed, heading } = body;

    // Validate required fields
    if (!taskId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: taskId, latitude, longitude' },
        { status: 400 }
      );
    }

    // Verify task belongs to this driver
    const task = await db.query.driverTasks.findFirst({
      where: eq(driverTasks.id, taskId),
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (task.driverId !== session.user.id) {
      return NextResponse.json(
        { error: 'Task does not belong to this driver' },
        { status: 403 }
      );
    }

    // Insert tracking log
    await db.insert(trackingLogs).values({
      taskId,
      latitude,
      longitude,
      accuracy: accuracy || null,
      speed: speed || null,
      heading: heading || null,
    });

    // Update driver task with latest position
    await db
      .update(driverTasks)
      .set({
        currentLat: latitude,
        currentLng: longitude,
        lastGpsPing: new Date(),
      })
      .where(eq(driverTasks.id, taskId));

    return NextResponse.json({
      success: true,
      message: 'GPS ping recorded',
    });
  } catch (error) {
    console.error('GPS ping error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
