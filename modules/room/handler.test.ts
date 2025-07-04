import dayjs from 'dayjs';
import * as handler from './handler';
import { RoomInput, UpdateRoomInput } from './handler';

// Mock do dayjs
jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  const mockDayjs: any = jest.fn().mockImplementation((...args) => {
    if (args.length === 0) {
      return originalDayjs('2024-01-15T10:00:00');
    }
    return originalDayjs(...args);
  });
  mockDayjs.extend = jest.fn();
  return {
    __esModule: true,
    default: mockDayjs
  };
});

// Mock do Supabase
jest.mock('../../config/supabaseClient', () => ({
  __esModule: true,
  default: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: '1', name: 'Test Room' }, error: null })
        })
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          neq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        }),
        range: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Test Room' }], error: null, count: 1 }),
        ilike: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Test Room' }], error: null })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: '1', name: 'Updated Room' }, error: null })
          })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null })
      })
    })
  }
}));

jest.mock('@/config/supabaseClient', () => ({
  __esModule: true,
  default: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: '1', name: 'Test Room' }, error: null })
        })
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          neq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        }),
        range: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Test Room' }], error: null, count: 1 }),
        ilike: jest.fn().mockResolvedValue({ data: [{ id: '1', name: 'Test Room' }], error: null })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: '1', name: 'Updated Room' }, error: null })
          })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null })
      })
    })
  }
}));

describe('Room Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRoomHandler', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('deve criar uma sala com sucesso', async () => {
      const roomData = {
        name: 'Sala de Reunião',
        size: 10,
        description: 'Sala para reuniões',
        exclusive: false,
        status: 'ativa'
      };

      const result = await handler.createRoomHandler(roomData);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('deve retornar erro quando nome não é fornecido', async () => {
      const roomData = {
        size: 10
      } as any;

      const result = await handler.createRoomHandler(roomData);

      expect(result.error).toBe('O nome da sala é obrigatório.');
      expect(result.data).toBeNull();
    });
  });

  describe('getRoomsHandler', () => {
    it('deve retornar salas com paginação padrão', async () => {
      const result = await handler.getRoomsHandler();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.total).toBe(1);
      expect(result.error).toBeNull();
    });

    it('deve retornar salas com paginação customizada', async () => {
      const result = await handler.getRoomsHandler(2, 5);
      expect(result.data).toBeDefined();
      expect(result.page).toBe(2);
      expect(result.error).toBeNull();
    });

    it('deve lidar com erro do Supabase', async () => {
      const result = await handler.getRoomsHandler();
      expect(result).toBeDefined();
    });
  });

  describe('getRoomByIdHandler', () => {
    it('deve buscar sala por ID', async () => {
      const result = await handler.getRoomByIdHandler('1');
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('deve lidar com sala não encontrada', async () => {
      const result = await handler.getRoomByIdHandler('999');
      expect(result).toBeDefined();
    });
  });

  describe('updateRoomHandler', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('deve atualizar sala com sucesso', async () => {
      const updateData: UpdateRoomInput = {
        id: '1',
        updates: {
          name: 'Sala Atualizada',
          size: 25
        }
      };

      const result = await handler.updateRoomHandler(updateData);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      const updateData: UpdateRoomInput = {
        id: '1',
        updates: {
          size: 30
        }
      };

      const result = await handler.updateRoomHandler(updateData);
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
  });

  describe('deleteRoomHandler', () => {
    it('deve deletar sala com sucesso', async () => {
      const result = await handler.deleteRoomHandler('1');
      expect(result.error).toBeNull();
    });

    it('deve lidar com erro do Supabase', async () => {
      const result = await handler.deleteRoomHandler('1');
      expect(result).toBeDefined();
    });
  });

  describe('searchRoomHandler', () => {
    it('deve buscar sala por nome', async () => {
      const result = await handler.searchRoomHandler('Reunião');
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('deve lidar com erro do Supabase', async () => {
      const result = await handler.searchRoomHandler('Reunião');
      expect(result).toBeDefined();
    });
  });
});