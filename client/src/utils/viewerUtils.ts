export async function initializeViewer(): Promise<void> {
  return new Promise<void>((resolve) => {
    const options = {
      env: 'DtProduction',
      api: 'dt',
      productId: 'Digital Twin',
      corsWorker: true,
      useCookie: false,
      useCredentials: true,
      shouldInitializeAuth: false,
      optOutTrackingByDefault: true,
      logLevel: 5
    };

    Autodesk.Tandem.Initializer(options, () => {
      resolve();
    });
  });
}