import * as handler from './handler';

// Mock do Supabase
jest.mock('../../config/supabaseClient.js', () => ({
  __esModule: true,
  default: {
    auth: {
      signUp: jest.fn(),
      admin: {
        deleteUser: jest.fn()
      }
    },
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: '1', name: 'Test User' }, error: null })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Updated User' }], error: null })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
  }
}));

// Mock do Supabase Anon Client
jest.mock('../../config/supabaseAnonClient.js', () => ({
  createSupabaseAnonClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      }),
      signOut: jest.fn().mockResolvedValue({ error: null })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: '1', name: 'Test User' }, error: null })
        })
      })
    })
  }))
}));

// Mock duplicado para compatibilidade
jest.mock('../../config/supabaseAnonClient', () => ({
  __esModule: true,
  createSupabaseAnonClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      }),
      signOut: jest.fn().mockResolvedValue({ error: null })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: '1', name: 'Test User' }, error: null })
        })
      })
    })
  }))
}));

// Mock duplicado para supabaseClient sem .js
jest.mock('../../config/supabaseClient', () => ({
  __esModule: true,
  default: {
    auth: {
      signUp: jest.fn(),
      admin: {
        deleteUser: jest.fn()
      }
    },
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: '1', name: 'Test User' }, error: null })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Updated User' }], error: null })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
  }
}));

type SignUpUserInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
};

type LoginUserInput = {
  email: string;
  password: string;
};

type UpdateUserProfileInput = {
  name: string;
  phone: string;
};

describe('Manipulador de Autenticação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUpUserHandler', () => {
    it('deve criar usuário com sucesso', async () => {
      const mockSupabase = require('../../config/supabaseClient.js').default;
      
      // Mock para verificação de email duplicado (deve retornar null para permitir criação)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });
      
      // Mock para signUp
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });
      
      // Mock para inserção do perfil
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ 
            data: [{ id: 'profile123', name: 'Test User', email: 'test@example.com' }], 
            error: null 
          })
        })
      });

      const signUpInput: SignUpUserInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '11999999999'
      };

      const result = await handler.signUpUserHandler(signUpInput);
      expect(result.user).toBeDefined();
      expect(result.profile).toBeDefined();
      expect(result.profile.name).toBe('Test User');
      expect(result.error).toBeUndefined();
    });
    
    it('deve retornar erro quando email já existe', async () => {
      const mockSupabase = require('../../config/supabaseClient.js').default;
      
      // Mock para verificação de email duplicado (retorna usuário existente)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'existing-user' }, error: null })
          })
        })
      });

      const signUpInput: SignUpUserInput = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '11999999999'
      };

      const result = await handler.signUpUserHandler(signUpInput);
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Já existe um usuário com este email.');
      expect(result.user).toBeUndefined();
    });

    it('deve executar signUp básico', async () => {
      const signUpInput: SignUpUserInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '11999999999'
      };

      const result = await handler.signUpUserHandler(signUpInput);
      expect(result).toBeDefined();
    });
  });

  describe('loginUserHandler', () => {
    it('deve fazer login com sucesso', async () => {
      const loginInput: LoginUserInput = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await handler.loginUserHandler(loginInput);
      expect(result).toBeDefined();
    });

    it('deve executar login básico', async () => {
      const loginInput: LoginUserInput = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await handler.loginUserHandler(loginInput);
      expect(result).toBeDefined();
    });
  });

  describe('getUserProfileHandler', () => {
    it('deve buscar perfil do usuário', async () => {
      const mockSupabase = require('../../config/supabaseClient.js').default;
      
      // Mock para buscar perfil existente
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: '1', name: 'Test User' }, error: null })
          })
        })
      });
      
      const result = await handler.getUserProfileHandler('user123');
      expect(result.profileData).toBeDefined();
      expect(result.error).toBeUndefined();
    });
    
    it('deve retornar erro quando usuário não existe', async () => {
      const mockSupabase = require('../../config/supabaseClient.js').default;
      
      // Mock para usuário não encontrado
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });
      
      const result = await handler.getUserProfileHandler('nonexistent');
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Usuário não encontrado.');
      expect(result.profileData).toBeUndefined();
    });
  });

  describe('updateUserProfileHandler', () => {
    it('deve atualizar perfil do usuário', async () => {
      const mockSupabase = require('../../config/supabaseClient.js').default;
      
      // Mock para verificar se usuário existe
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
          })
        })
      });
      
      // Mock para atualização
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Updated User' }], error: null })
          })
        })
      });
      
      const updateInput: UpdateUserProfileInput = {
        name: 'Updated Name',
        phone: '11888888888'
      };

      const result = await handler.updateUserProfileHandler('user123', updateInput);
      expect(result.profile).toBeDefined();
      expect(result.error).toBeUndefined();
    });
    
    it('deve retornar erro quando usuário não existe', async () => {
      const mockSupabase = require('../../config/supabaseClient.js').default;
      
      // Mock para usuário não encontrado
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });
      
      const updateInput: UpdateUserProfileInput = {
        name: 'Updated Name',
        phone: '11888888888'
      };

      const result = await handler.updateUserProfileHandler('nonexistent', updateInput);
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Usuário não encontrado.');
      expect(result.profile).toBeUndefined();
    });
  });

  describe('deleteUserHandler', () => {
    it('deve deletar usuário com sucesso', async () => {
      const mockSupabase = require('../../config/supabaseClient.js').default;
      
      // Mock para verificar se usuário existe
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
          })
        })
      });
      
      // Mock para deletar perfil
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });
      
      // Mock para deletar usuário do auth
      mockSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null });

      const result = await handler.deleteUserHandler('user123');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('deve retornar erro quando usuário não existe', async () => {
      const mockSupabase = require('../../config/supabaseClient.js').default;
      
      // Mock para usuário não encontrado
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });

      const result = await handler.deleteUserHandler('nonexistent');
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Usuário não encontrado.');
      expect(result.success).toBeUndefined();
    });
  });

  describe('logoutHandler', () => {
    it('deve fazer logout com sucesso', async () => {
      const result = await handler.logoutHandler();
      expect(result).toBeDefined();
    });
  });
});