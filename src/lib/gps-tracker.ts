/**
 * GPS Tracker Service
 * Handles background GPS tracking for active driver tasks
 */

interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface GPSTrackingOptions {
  taskId: string;
  interval?: number; // in milliseconds, default 120000 (2 minutes)
  onError?: (error: GeolocationPositionError) => void;
  onSuccess?: (position: GeolocationPosition) => void;
}

class GPSTracker {
  private intervalId: NodeJS.Timeout | null = null;
  private watchId: number | null = null;
  private isTracking: boolean = false;

  /**
   * Start GPS tracking for a task
   * Sends location pings every 120 seconds (2 minutes)
   */
  startTracking(options: GPSTrackingOptions): void {
    if (this.isTracking) {
      console.warn('GPS tracking is already active');
      return;
    }

    const interval = options.interval || 120000; // 2 minutes default

    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    this.isTracking = true;

    // Send initial ping immediately
    this.sendGPSPing(options.taskId, options.onSuccess, options.onError);

    // Set up interval for subsequent pings
    this.intervalId = setInterval(() => {
      this.sendGPSPing(options.taskId, options.onSuccess, options.onError);
    }, interval);

    console.log(`GPS tracking started for task ${options.taskId}`);
  }

  /**
   * Stop GPS tracking
   */
  stopTracking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    console.log('GPS tracking stopped');
  }

  /**
   * Send a single GPS ping to the server
   */
  private async sendGPSPing(
    taskId: string,
    onSuccess?: (position: GeolocationPosition) => void,
    onError?: (error: GeolocationPositionError) => void
  ): Promise<void> {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates: GPSCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
        };

        try {
          const response = await fetch('/api/driver/gps-ping', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              taskId,
              ...coordinates,
            }),
          });

          if (!response.ok) {
            console.error('Failed to send GPS ping:', await response.text());
          } else {
            console.log('GPS ping sent successfully');
          }

          onSuccess?.(position);
        } catch (error) {
          console.error('Error sending GPS ping:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error.message);
        onError?.(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  /**
   * Get current GPS status
   */
  isActive(): boolean {
    return this.isTracking;
  }

  /**
   * Get a single GPS position without starting tracking
   */
  static async getCurrentPosition(): Promise<GPSCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }
}

// Export singleton instance
export const gpsTracker = new GPSTracker();

// Export types
export type { GPSCoordinates, GPSTrackingOptions };
