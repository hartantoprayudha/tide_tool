const originalMeasure = performance.measure;
performance.measure = function (...args: any[]) {
  try {
    return originalMeasure.apply(performance, args as any);
  } catch (err: any) {
    if (err instanceof DOMException && err.name === 'DataCloneError') {
      console.warn('Caught DataCloneError in performance.measure. Overriding React memory crash.');
      return;
    }
    throw err;
  }
};
