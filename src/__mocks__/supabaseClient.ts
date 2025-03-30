// src/__mocks__/supabaseClient.ts

// --- Mock Functions ---
const mockSingle = jest.fn();
const mockThen = jest.fn((callback) => Promise.resolve(callback({ error: null }))); 
// Definir tipos explícitos para romper referencias circulares
const mockEq: jest.Mock<any, any> = jest.fn(() => ({
    single: mockSingle,
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
    then: mockThen
}));
const mockOrder: jest.Mock<any, any> = jest.fn(() => ({
    eq: mockEq, 
    order: mockOrder, 
    then: mockThen 
}));
const mockGte = jest.fn(() => ({ eq: mockEq })); 
const mockLte = jest.fn(() => ({ gte: mockGte })); 
const mockLimit = jest.fn(() => ({ 
    then: mockThen 
}));
const mockSelect = jest.fn(() => ({ 
    eq: mockEq, 
    order: mockOrder, 
    lte: mockLte,
    limit: mockLimit 
}));
const mockInsert = jest.fn(() => ({ 
    select: jest.fn(() => ({ single: mockSingle })) 
}));
const mockUpdate = jest.fn(() => ({ 
    eq: mockEq 
}));
const mockDelete = jest.fn(() => ({ 
    eq: mockEq 
}));
const mockUpsert = jest.fn(() => ({ 
    select: jest.fn(() => ({ single: mockSingle })) 
}));
const mockFrom = jest.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  upsert: mockUpsert,
}));
const mockGetUser = jest.fn();
const mockAuth = {
  getUser: mockGetUser,
};
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockStorageFrom = jest.fn(() => ({
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