// src/__mocks__/supabaseClient.ts
import { vi, type Mock } from 'vitest';

// --- Mock Functions ---
const mockSingle = vi.fn();
const mockThen = vi.fn((callback) => Promise.resolve(callback({ error: null })));
// Definir tipos explícitos para romper referencias circulares
const mockEq: Mock<any, any> = vi.fn(() => ({
  single: mockSingle,
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
  then: mockThen,
}));
const mockOrder: Mock<any, any> = vi.fn(() => ({
  eq: mockEq,
  order: mockOrder,
  then: mockThen,
}));
const mockGte = vi.fn(() => ({ eq: mockEq }));
const mockLte = vi.fn(() => ({ gte: mockGte }));
const mockLimit = vi.fn(() => ({
  then: mockThen,
}));
const mockSelect = vi.fn(() => ({
  eq: mockEq,
  order: mockOrder,
  lte: mockLte,
  limit: mockLimit,
}));
const mockInsert = vi.fn(() => ({
  select: vi.fn(() => ({ single: mockSingle })),
}));
const mockUpdate = vi.fn(() => ({
  eq: mockEq,
}));
const mockDelete = vi.fn(() => ({
  eq: mockEq,
}));
const mockUpsert = vi.fn(() => ({
  select: vi.fn(() => ({ single: mockSingle })),
}));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  upsert: mockUpsert,
}));
const mockGetUser = vi.fn();
const mockAuth = {
  getUser: mockGetUser,
};
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockStorageFrom = vi.fn(() => ({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
}));
const mockStorage = {
  from: mockStorageFrom,
};

// --- Exportar SOLO el Mock Completo ---
export const supabase = {
  auth: mockAuth,
  from: mockFrom,
  storage: mockStorage,
};

// No exportar mocks individuales ni resetMocks
