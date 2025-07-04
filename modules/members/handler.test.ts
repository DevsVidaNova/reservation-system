import dayjs from 'dayjs';
import * as handler from './handler';
import { MemberData, SearchByFilterParams } from './handler';

// Mock do dayjs
jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  const mockDayjs: any = jest.fn().mockImplementation((...args) => {
    if (args.length === 0) {
      return originalDayjs('2024-01-15T10:00:00');
    }
    const dayjsInstance = originalDayjs(...args);
    dayjsInstance.format = jest.fn().mockReturnValue('2024-01-15');
    return dayjsInstance;
  });
  mockDayjs.extend = jest.fn();
  return {
    __esModule: true,
    default: mockDayjs
  };
});

// Mock do translateError
jest.mock('../../utils/errors', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue('Erro traduzido')
}));

// Mock do Supabase
jest.mock('../../config/supabaseClient.js', () => ({
  __esModule: true,
  default: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 1, full_name: 'Test Member' }, error: null })
        })
      }),
      select: jest.fn().mockImplementation((fields) => {
        if (fields === '*' && typeof fields === 'string') {
          return {
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 1, full_name: 'Test Member' }, error: null })
            }),
            range: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member', birth_date: '1990-01-15' }], error: null, count: 1 }),
            ilike: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null }),
            neq: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null }),
            gt: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null }),
            gte: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null }),
            lt: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null }),
            lte: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null }),
            like: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null })
          };
        }
        return {
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 1, full_name: 'Test Member' }, error: null })
          })
        };
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 1, full_name: 'Updated Member' }, error: null })
          })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
  }
}));

// Mock duplicado para compatibilidade
jest.mock('../../config/supabaseClient', () => ({
  __esModule: true,
  default: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 1, full_name: 'Test Member' }, error: null })
        })
      }),
      select: jest.fn().mockImplementation((fields) => {
        if (fields === '*' && typeof fields === 'string') {
          return {
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 1, full_name: 'Test Member' }, error: null })
            }),
            range: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member', birth_date: '1990-01-15' }], error: null, count: 1 }),
            ilike: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null }),
            neq: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null }),
            gt: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null }),
            gte: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null }),
            lt: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null }),
            lte: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null }),
            like: jest.fn().mockResolvedValue({ data: [{ id: 1, full_name: 'Test Member' }], error: null })
          };
        }
        return {
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 1, full_name: 'Test Member' }, error: null })
          })
        };
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 1, full_name: 'Updated Member' }, error: null })
          })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
  }
}));

describe('Members Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMemberHandler', () => {
    it('deve executar criação básica', async () => {
      const memberData: MemberData = {
        full_name: 'João Silva',
        birth_date: '15/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@example.com'
      };

      const result = await handler.createMemberHandler(memberData);
      expect(result).toBeDefined();
    });
  });

  describe('getMembersHandler', () => {
    it('deve executar busca básica', async () => {
      const result = await handler.getMembersHandler({});
      expect(result).toBeDefined();
    });
  });

  describe('getMemberByIdHandler', () => {
    it('deve executar busca por ID', async () => {
      const result = await handler.getMemberByIdHandler('1');
      expect(result).toBeDefined();
    });
  });

  describe('updateMemberHandler', () => {
    it('deve executar atualização', async () => {
      const updateData = { full_name: 'João Santos' };
      const result = await handler.updateMemberHandler('1', updateData);
      expect(result).toBeDefined();
    });
  });

  describe('deleteMemberHandler', () => {
    it('deve executar exclusão', async () => {
      const result = await handler.deleteMemberHandler('1');
      expect(result).toBeDefined();
    });
  });

  describe('searchMemberHandler', () => {
    it('deve executar busca básica', async () => {
      const result = await handler.searchMemberHandler('João');
      expect(result).toBeDefined();
    });
  });

  describe('searchByFilterHandler', () => {
    it('deve buscar com filtro eq', async () => {
      const params: SearchByFilterParams = {
        field: 'gender',
        value: 'Masculino',
        operator: 'eq'
      };

      const result = await handler.searchByFilterHandler(params);
      expect(result).toBeDefined();
    });

    it('deve retornar erro para parâmetros inválidos', async () => {
      const params: Partial<SearchByFilterParams> = {
        field: 'gender'
        // Faltando value e operator
      };

      const result = await handler.searchByFilterHandler(params as SearchByFilterParams);
      expect(result.error).toBe('Parâmetros inválidos.');
    });

    it('deve retornar erro para operador inválido', async () => {
      const params: SearchByFilterParams = {
        field: 'gender',
        value: 'Masculino',
        operator: 'invalid'
      };

      const result = await handler.searchByFilterHandler(params);
      expect(result.error).toBe('Operador inválido.');
    });
  });
});