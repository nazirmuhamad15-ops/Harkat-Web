import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, driverTasks, trackingLogs, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { orderNumber } = params;

    // Find order
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumber),
      with: {
        user: {
          columns: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order has a driver task
    const task = await db.query.driverTasks.findFirst({
      where: eq(driverTasks.orderId, order.id),
      with: {
        driver: {
          columns: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({
        driver: null,
        order: {
          orderNumber: order.orderNumber,
          customerName: order.user?.name || order.shippingName,
          customerPhone: order.user?.phone || order.shippingPhone,
          deliveryAddress: `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingProvince} ${order.shippingPostalCode}`,
          status: order.status,
          estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
          driverName: 'Belum ditugaskan',
          driverPhone: null,
        },
      });
    }

    // Get latest GPS coordinates from tracking logs
    const latestTracking = await db.query.trackingLogs.findFirst({
      where: eq(trackingLogs.taskId, task.id),
      orderBy: [desc(trackingLogs.timestamp)],
    });

    // Prepare response
    const response = {
      driver: latestTracking
        ? {
            latitude: latestTracking.latitude,
            longitude: latestTracking.longitude,
            lastUpdate: latestTracking.timestamp.toISOString(),
          }
        : task.currentLat && task.currentLng
        ? {
            latitude: task.currentLat,
            longitude: task.currentLng,
            lastUpdate: task.lastGpsPing?.toISOString() || new Date().toISOString(),
          }
        : null,
      order: {
        orderNumber: order.orderNumber,
        customerName: order.user?.name || order.shippingName,
        customerPhone: order.user?.phone || order.shippingPhone,
        deliveryAddress: `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingProvince} ${order.shippingPostalCode}`,
        status: order.status,
        estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
        driverName: task.driver?.name || 'Driver',
        driverPhone: task.driver?.phone || null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Live tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
