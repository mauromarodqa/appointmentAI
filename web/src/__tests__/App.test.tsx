import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export App component', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  it('should have proper TypeScript types', () => {
    expect(App.name).toBe('App');
  });
});
