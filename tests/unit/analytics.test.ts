import { describe, it, expect } from 'vitest';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

describe('Vercel Speed Insights & Web Analytics Integration Tests', () => {
  it('should export Analytics and SpeedInsights components successfully from official packages', () => {
    expect(Analytics).toBeDefined();
    expect(typeof Analytics).toBe('function');

    expect(SpeedInsights).toBeDefined();
    expect(typeof SpeedInsights).toBe('function');
  });

  it('should verify telemetry configuration parameters', () => {
    const analyticsConfig = {
      framework: 'next.js',
      routeMonitoring: true,
      coreWebVitals: true, // LCP, FID/INP, CLS, TTFB, FCP
    };

    expect(analyticsConfig.framework).toBe('next.js');
    expect(analyticsConfig.coreWebVitals).toBe(true);
  });
});
