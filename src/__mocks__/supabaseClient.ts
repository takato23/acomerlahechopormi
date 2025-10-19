// src/__mocks__/supabaseClient.ts
import { vi, type Mock } from 'vitest';

// --- Mock Functions ---
const mockSingle = vi.fn();
const mockThen = vi.fn((callback) => Promise.resolve(callback({ error: null })));

const mockLimit = vi.fn(() => ({
  then: mockThen,
}));

// Definir tipos explícitos para romper referencias circulares
let mockEq: Mock<any, any>;
let mockOrder: Mock<any, any>;

mockOrder = vi.fn(() => ({
  eq: mockEq,
  order: mockOrder,
  then: mockThen,
}));

mockEq = vi.fn(() => ({
  single: mockSingle,
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
  then: mockThen,
}));

const mockGte = vi.fn(() => ({ eq: mockEq }));
const mockLte = vi.fn(() => ({ gte: mockGte }));

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

const mockRpc = vi.fn();
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
  rpc: mockRpc,
};

// No exportar mocks individuales ni resetMocks
