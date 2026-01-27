import { NextRequest, NextResponse } from 'next/server';
import { createPayment } from '@/lib/pakasir';

export async function GET(req: NextRequest) {
  try {
    console.log('[Test] Testing Pakasir payment creation...');
    
    const payment = await createPayment(
      'all',
      'TEST-' + Date.now(),
      100000,
      'http://localhost:3000/track?order=TEST&status=success'
    );
    
    return NextResponse.json({
      success: true,
      message: 'Pakasir test successful',
      payment
    });
  } catch (error) {
    console.error('[Test] Pakasir test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
