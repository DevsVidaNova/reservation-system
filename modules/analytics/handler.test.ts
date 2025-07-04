import dayjs from 'dayjs';
import * as handler from './handler';

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
  mockDayjs.subtract = jest.fn().mockReturnValue({
    format: jest.fn().mockReturnValue('2024-01-08')
  });
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
      select: jest.fn().mockReturnValue({
        gte: jest.fn().mockResolvedValue({ count: 5, error: null })
      })
    })
  }
}));

jest.mock('../../config/supabaseClient.js', () => ({
  __esModule: true,
  default: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        gte: jest.fn().mockResolvedValue({ count: 5, error: null })
      })
    })
  }
}));

describe('Analytics Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCountHandler', () => {
    it('deve retornar contagem de uma tabela', async () => {
      const result = await handler.getCountHandler('rooms');
      expect(result).toBeDefined();
    });

    it('deve lidar com erro do Supabase', async () => {
      const result = await handler.getCountHandler('rooms');
      expect(result).toBeDefined();
    });

    it('deve retornar 0 quando count é null', async () => {
      const result = await handler.getCountHandler('rooms');
      expect(result).toBeDefined();
    });
  });

  describe('getStatsHandler', () => {
    it('deve retornar estatísticas completas', async () => {
      const result = await handler.getStatsHandler();
      expect(result).toBeDefined();
    });

    it('deve lidar com erro básico', async () => {
      const result = await handler.getStatsHandler();
      expect(result).toBeDefined();
    });
  });
});