import { DEFAULT_RETRIES, retry } from "../../src";

describe("retry function", () => {
  let fn: jest.Mock;
  let shouldRetry: jest.Mock;

  beforeEach(() => {
    fn = jest.fn();
    shouldRetry = jest.fn();
      // Mock console methods to track their calls
     console.warn = jest.fn();
     console.info = jest.fn();
  });
  
  it('should return immediately if the function succeeds on the first try', async () => {
    const result = 'Success';
    fn.mockResolvedValueOnce(result);

    shouldRetry = jest.fn(async (fn: Function) => {
      const result = await fn()
      return Promise.resolve({shouldRetry: false, result})
    })

    const output = await retry({ fn, shouldRetry });
    
    expect(output).toBe(result);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });

  it("should retry and eventually succeed", async () => {
    const result = 'Success';
    fn.mockResolvedValue('Failed');
    shouldRetry
      .mockResolvedValueOnce({ shouldRetry: true, result: 'Retry' })
      .mockResolvedValueOnce({ shouldRetry: false, result });
    
    const output = await retry({fn, shouldRetry})

    expect(output).toBe(result);
    expect(shouldRetry).toHaveBeenCalledTimes(2);
    expect(console.info).toHaveBeenCalledWith('retries left:', DEFAULT_RETRIES - 1);
  })

  it('should reach max retries and fail', async () => {
    const result = 'Failed';
    fn.mockResolvedValue(result);
    shouldRetry.mockResolvedValue({ shouldRetry: true, result });
    
    const output = await retry({ fn, shouldRetry, retries: 2 });
    
    expect(output).toBe(result);
    expect(shouldRetry).toHaveBeenCalledTimes(2);
  });

  it('should throw an error if error predicted', async () => {
    fn
    .mockRejectedValueOnce( new Error("Server not respoding"));
    
    shouldRetry = jest.fn(async (fn: Function) => {
      let result: string;
      try {
        result = await fn()
        return Promise.resolve({shouldRetry: false, result})
      } catch(e) {
        if (
          e instanceof Error &&
          e.message === "Server not respoding") {
          throw e
        }
        result = ''
      }

      return Promise.resolve({shouldRetry: false, result})
    })

    const output = retry({ fn, shouldRetry: shouldRetry });
    expect(output).rejects.toThrow("Server not respoding");
    expect(fn).toHaveBeenCalledTimes(1)
    expect(shouldRetry).toHaveBeenCalledTimes(1)
  })

  describe("shouldLog argument checking", () => {
    it('should log messages when shouldLog is true', async () => {
      fn.mockReturnValue('SomeResult');
      shouldRetry.mockResolvedValue({ shouldRetry: true, result: 'Retry' });
      
      await retry({ fn, shouldRetry, retries: 2, shouldLog: true });
  
      expect(console.info).toHaveBeenCalledWith('retries left:', 1);
      expect(console.warn).toHaveBeenCalledWith('Maximum retries exceeded!: ', 0);
    });

    it('should not log messages when shouldLog is false', async () => {
      fn.mockReturnValue('SomeResult');
      shouldRetry.mockResolvedValue({ shouldRetry: true, result: 'Retry' });
      
      await retry({ fn, shouldRetry, retries: 2, shouldLog: false });
  
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });
  })

  describe("interval argument checking", () => {
    it('should wait the default interval before retrying', async () => {
      fn.mockResolvedValue('Retry');
  
      shouldRetry.mockResolvedValue({ shouldRetry: true, result: 'Retry' });
  
      const startTime = Date.now();
  
      await retry({ fn, shouldRetry, retries: 1 });
  
      const elapsed = Date.now() - startTime;
  
      expect(elapsed).toBeGreaterThanOrEqual(200); // default interval is 200ms
      expect(elapsed).toBeLessThan(400); // because of only one retry, it should be less than 400ms
    });
  })
})

