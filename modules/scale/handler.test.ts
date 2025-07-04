import dayjs from 'dayjs';
import * as handler from './handler';
import { ScaleInput, Scale } from './handler';

// Mock do dayjs
jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  const mockDayjs: any = jest.fn().mockImplementation((...args) => {
    if (args.length === 0) {
      return originalDayjs('2024-01-15T10:00:00');
    }
    const dayjsInstance = originalDayjs(...args);
    dayjsInstance.format = jest.fn().mockReturnValue('2024-01-15');
    dayjsInstance.isValid = jest.fn().mockReturnValue(true);
    return dayjsInstance;
  });
  mockDayjs.extend = jest.fn();
  return {
    __esModule: true,
    default: mockDayjs
  };
});

// Mock dos plugins do dayjs
jest.mock('dayjs/plugin/customParseFormat.js', () => {});

// Mock do Supabase
jest.mock('../../config/supabaseClient.js', () => ({
  __esModule: true,
  default: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      range: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis()
    }))
  }
}));

// Mock duplicado para compatibilidade
jest.mock('../../config/supabaseClient', () => ({
  __esModule: true,
  default: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      range: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis()
    }))
  }
}));

describe('Scale Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const validScaleInput: ScaleInput = {
    date: '15/01/2024',
    name: 'Escala Domingo',
    direction: 'João Silva',
    band: 'Banda Principal',
    projection: 'Maria Santos',
    light: 'Pedro Costa',
    transmission: 'Ana Lima',
    camera: 'Carlos Oliveira',
    live: 'Fernanda Rocha',
    sound: 'Roberto Silva',
    training_sound: 'Lucas Pereira',
    photography: 'Juliana Martins',
    stories: 'Rafael Santos',
    dynamic: 'Camila Ferreira'
  };

  describe('createScaleHandler', () => {
    it('deve criar uma escala com sucesso', async () => {
      const result = await handler.createScaleHandler(validScaleInput);
      expect(result).toEqual({ data: null });
    });
  });

  describe('getScalesHandler', () => {
    it('deve retornar escalas com paginação padrão', async () => {
      const result = await handler.getScalesHandler({});
      expect(result.data).toBeDefined();
      expect(result.data?.pagination).toBeDefined();
    });

    it('deve retornar escalas com paginação customizada', async () => {
      const result = await handler.getScalesHandler({ page: 2, pageSize: 1 });
      expect(result.data).toBeDefined();
      expect(result.data?.pagination.page).toBe(2);
      expect(result.data?.pagination.pageSize).toBe(1);
    });
  });

  describe('getScaleByIdHandler', () => {
    it('deve buscar escala por ID', async () => {
      const result = await handler.getScaleByIdHandler('1');
      expect(result).toBeDefined();
    });
  });

  describe('updateScaleHandler', () => {
    it('deve atualizar escala com sucesso', async () => {
      const updates = { name: 'Escala Atualizada' };
      const result = await handler.updateScaleHandler('1', updates);
      expect(result).toBeDefined();
    });
  });

  describe('deleteScaleHandler', () => {
    it('deve deletar escala com sucesso', async () => {
      const result = await handler.deleteScaleHandler('1');
      expect(result).toBeDefined();
    });
  });

  describe('searchScaleHandler', () => {
    it('deve buscar escalas por nome', async () => {
      const result = await handler.searchScaleHandler('Domingo');
      expect(result).toBeDefined();
    });
  });

  describe('duplicateScaleHandler', () => {
    it('deve duplicar escala com sucesso', async () => {
      const result = await handler.duplicateScaleHandler('1');
      expect(result).toBeDefined();
    });
  });
});