/**
 * Performance monitoring and load time tracking
 * 
 * Tracks critical app initialization milestones to identify performance bottlenecks.
 * All timings are logged to console and can be viewed in Xcode Device Logs or TestFlight.
 */

type PerformanceMark = {
  name: string;
  timestamp: number;
  relativeTime: number; // ms since app start
};

class PerformanceTracker {
  private marks: PerformanceMark[] = [];
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
    this.mark("app_start");
  }

  /**
   * Record a performance milestone
   */
  mark(name: string): void {
    const now = performance.now();
    const relativeTime = now - this.startTime;
    this.marks.push({ name, timestamp: now, relativeTime });
    
    // Log immediately for real-time debugging
    const isDev = typeof __DEV__ !== "undefined" && __DEV__;
    if (isDev) {
      console.log(`[Performance] ${name}: ${relativeTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get all recorded marks
   */
  getMarks(): PerformanceMark[] {
    return [...this.marks];
  }

  /**
   * Get time between two marks
   */
  measure(startMark: string, endMark: string): number | null {
    const start = this.marks.find(m => m.name === startMark);
    const end = this.marks.find(m => m.name === endMark);
    if (!start || !end) return null;
    return end.relativeTime - start.relativeTime;
  }

  /**
   * Generate a performance report
   */
  getReport(): {
    totalTime: number;
    marks: PerformanceMark[];
    phases: Array<{ phase: string; duration: number }>;
  } {
    const totalTime = this.marks.length > 0 
      ? this.marks[this.marks.length - 1].relativeTime 
      : 0;

    const phases: Array<{ phase: string; duration: number }> = [];
    for (let i = 1; i < this.marks.length; i++) {
      const prev = this.marks[i - 1];
      const curr = this.marks[i];
      phases.push({
        phase: `${prev.name} → ${curr.name}`,
        duration: curr.relativeTime - prev.relativeTime,
      });
    }

    return {
      totalTime,
      marks: this.marks,
      phases,
    };
  }

  /**
   * Log a comprehensive performance report
   */
  logReport(): void {
    const report = this.getReport();
    console.log("[Performance Report] ========================================");
    console.log(`[Performance] Total time to ready: ${report.totalTime.toFixed(2)}ms`);
    console.log("[Performance] Milestones:");
    report.marks.forEach((mark) => {
      console.log(`[Performance]   ${mark.name.padEnd(30)} ${mark.relativeTime.toFixed(2).padStart(8)}ms`);
    });
    console.log("[Performance] Phases:");
    report.phases.forEach((phase) => {
      console.log(`[Performance]   ${phase.phase.padEnd(40)} ${phase.duration.toFixed(2).padStart(8)}ms`);
    });
    console.log("[Performance Report] ========================================");
  }
}

// Singleton instance
let tracker: PerformanceTracker | null = null;

/**
 * Initialize performance tracking (call as early as possible)
 */
export function initPerformanceTracking(): PerformanceTracker {
  if (!tracker) {
    tracker = new PerformanceTracker();
  }
  return tracker;
}

/**
 * Get the performance tracker instance
 */
export function getPerformanceTracker(): PerformanceTracker | null {
  return tracker;
}

/**
 * Record a performance milestone
 */
export function markPerformance(name: string): void {
  if (!tracker) {
    tracker = initPerformanceTracking();
  }
  tracker.mark(name);
}

/**
 * Get performance report
 */
export function getPerformanceReport() {
  return tracker?.getReport() ?? null;
}

/**
 * Log performance report
 */
export function logPerformanceReport(): void {
  tracker?.logReport();
}

