import * as handler from './handler';

type CreateUserInput = {
  name: string;
  phone: string;
  role?: string;
  password: string;
  email: string;
};

type UpdateUserInput = {
  userId: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
};

// Mock do Supabase
jest.mock('../../config/supabaseClient.js', () => ({
  __esModule: true,
  default: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis()
    })),
    auth: {
      signUp: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      }),
      admin: {
        deleteUser: jest.fn().mockResolvedValue({ error: null })
      }
    }
  }
}));

// Mock duplicado para compatibilidade
jest.mock('../../config/supabaseClient', () => ({
  __esModule: true,
  default: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis()
    })),
    auth: {
      signUp: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      }),
      admin: {
        deleteUser: jest.fn().mockResolvedValue({ error: null })
      }
    }
  }
}));

const mockUser = {
  id: '1',
  name: 'João Silva',
  phone: '11999999999',
  role: 'user',
  user_id: 'user-123',
  email: 'joao@example.com'
};

const mockUsersList = {
  data: [mockUser],
  error: null,
  count: 1
};

describe('User Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('showUserHandler', () => {
    it('deve executar busca de usuário por ID', async () => {
      const result = await handler.showUserHandler('1');
      expect(result).toBeDefined();
    });
  });

  describe('listUsersHandler', () => {
    it('deve executar listagem de usuários', async () => {
      const result = await handler.listUsersHandler();
      expect(result).toBeDefined();
    });

    it('deve executar listagem com paginação customizada', async () => {
      const result = await handler.listUsersHandler(2, 5);
      expect(result).toBeDefined();
    });
  });

  describe('deleteUserHandler', () => {
    it('deve executar deleção de usuário', async () => {
      const result = await handler.deleteUserHandler('user-123');
      expect(result).toBeDefined();
    });
  });

  describe('updateUserHandler', () => {
    it('deve executar atualização de usuário', async () => {
      const updateInput = {
        userId: 'user-123',
        name: 'João Santos'
      };
      const result = await handler.updateUserHandler(updateInput);
      expect(result).toBeDefined();
    });
  });

  describe('createUserHandler', () => {
    it('deve executar criação de usuário', async () => {
      const createInput = {
        name: 'João Silva',
        phone: '11999999999',
        role: 'user',
        password: 'password123',
        email: 'joao@example.com'
      };
      const result = await handler.createUserHandler(createInput);
      expect(result).toBeDefined();
    });
  });

  describe('listUsersScaleHandler', () => {
    it('deve executar listagem de usuários para escala', async () => {
      const result = await handler.listUsersScaleHandler();
      expect(result).toBeDefined();
    });
  });
});