const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(),
  ilike: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  execute: jest.fn(),
};

const mockSupabaseClient = {
  from: jest.fn(() => mockQueryBuilder),
  auth: {
    signUp: jest.fn(),
    signIn: jest.fn(),
    admin: {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
};

jest.mock('../../config/supabaseClient.js', () => ({
    __esModule: true,
    default: mockSupabaseClient
}));

export const supabaseMock = mockSupabaseClient;

// Teste básico para evitar erro de suite vazia
describe('Supabase Mock', () => {
  it('deve exportar o mock do supabase', () => {
    expect(supabaseMock).toBeDefined();
    expect(supabaseMock.from).toBeDefined();
    expect(supabaseMock.auth).toBeDefined();
  });
});