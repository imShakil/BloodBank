import { debounce } from './debounce';

describe('debounce', () => {
  jest.useFakeTimers();

  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('test');
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should only call function once for multiple rapid calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('call1');
    debouncedFn('call2');
    debouncedFn('call3');

    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call3');
  });

  it('should reset delay on new call', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('call1');
    jest.advanceTimersByTime(200);
    debouncedFn('call2');
    jest.advanceTimersByTime(200);

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('call2');
  });

  it('should support cancel method', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('test');
    debouncedFn.cancel();

    jest.advanceTimersByTime(300);

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should handle multiple arguments', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('arg1', 'arg2', { key: 'value' });

    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
});
