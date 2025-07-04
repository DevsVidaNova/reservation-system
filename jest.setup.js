// Mock do Supabase
// Mock data for tests
const mockBookingsData = [
  {
    id: 1,
    description: 'Reunião de equipe',
    date: '2024-01-15',
    start_time: '09:00:00',
    end_time: '10:00:00',
    repeat: null,
    day_repeat: null,
    user_profiles: {
      id: 1,
      name: 'João Silva',
      email: 'joao@teste.com',
      phone: '11999999999'
    },
    rooms: {
      id: 1,
      name: 'Sala de Reunião A',
      size: 10
    }
  }
];

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
      signOut: jest.fn(),
      admin: {
        deleteUser: jest.fn()
      }
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockResolvedValue({ data: mockBookingsData, error: null }),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockBookingsData[0], error: null }),
      head: jest.fn()
    }))
  }))
}));

// Mock direto do supabaseClient
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockResolvedValue({ data: mockBookingsData, error: null }),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: mockBookingsData[0], error: null }),
    head: jest.fn()
  })),
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    getUser: jest.fn(),
    signOut: jest.fn(),
    admin: {
      deleteUser: jest.fn()
    }
  }
};

// Os mocks do supabaseClient serão feitos através do mock do @supabase/supabase-js acima

// Mock do dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Configuração de variáveis de ambiente para testes
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

// Configuração global para testes
global.console = {
  ...console,
  // Permitir logs de erro para debugging
  log: console.log,
  error: console.error,
  warn: console.warn,
};