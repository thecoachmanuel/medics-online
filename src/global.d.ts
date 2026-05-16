export {};

declare global {
  var dhSessions: Map<string, any>;
  var vitalsData: {
    latestRealVitals: any;
    lastUpdatedTime: number;
    MOCK_ENABLED: boolean;
  };
}
