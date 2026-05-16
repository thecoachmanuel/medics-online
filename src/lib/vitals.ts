// Singleton for sharing vitals data across API routes in dev/prod
if (!global.vitalsData) {
  global.vitalsData = {
    latestRealVitals: null,
    lastUpdatedTime: Date.now(),
    MOCK_ENABLED: true
  };
}

export const vitalsData = global.vitalsData;
