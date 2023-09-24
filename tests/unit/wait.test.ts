import { wait } from "../../src/wait";

describe('wait function', () => {
    it('should wait for the specified duration', async () => {
      const duration = 1000;  // 1000ms
      const startTime = Date.now();
  
      await wait(duration);
  
      const endTime = Date.now();
      const elapsed = endTime - startTime;
  
      // We expect the elapsed time to be approximately the duration.
      // However, we give some margin for error (let's say 10ms) 
      // because exact timings can be influenced by various factors.
      expect(elapsed).toBeGreaterThanOrEqual(duration);
      expect(elapsed).toBeLessThanOrEqual(duration + 10);
    });
  });