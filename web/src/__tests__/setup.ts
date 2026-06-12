import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null })),
        })),
        lte: vi.fn(() => ({
          gte: vi.fn(() => Promise.resolve({ data: [] })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
      signUp: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      signInWithPassword: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
  },
}));
