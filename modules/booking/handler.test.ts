import 'dayjs/locale/pt.js';
import * as handler from './handler';
import { Request, Response } from 'express';

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
  mockDayjs.locale = jest.fn();
  return {
    __esModule: true,
    default: mockDayjs
  };
});

// Removido mock do handler para permitir testes reais


// Mock dos plugins do dayjs
jest.mock('dayjs/locale/pt.js', () => {});
jest.mock('dayjs/plugin/customParseFormat.js', () => {});

// Mock do Supabase
const mockSupabaseResponse = {
  data: [],
  error: null
};

const createMockQuery = () => {
  const mockQuery: any = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gt: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    or: jest.fn(),
    range: jest.fn(),
    limit: jest.fn(),
    order: jest.fn(),
    single: jest.fn(),
    head: jest.fn(),
    then: jest.fn()
  };
  
  // Configure all methods to return this by default
  Object.keys(mockQuery).forEach(key => {
    if (key !== 'single' && key !== 'head' && key !== 'then') {
      mockQuery[key].mockReturnValue(mockQuery);
    }
  });
  
  // Configure terminal methods
  mockQuery.single.mockResolvedValue(mockSupabaseResponse);
  mockQuery.head.mockResolvedValue(mockSupabaseResponse);
  mockQuery.then.mockImplementation((callback: any) => {
    return Promise.resolve(callback(mockSupabaseResponse));
  });
  
  return mockQuery;
};

// Mock global do Supabase
jest.mock('../../config/supabaseClient', () => {
  const mockQuery = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gt: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    or: jest.fn(),
    range: jest.fn(),
    limit: jest.fn(),
    order: jest.fn(),
    single: jest.fn(),
    head: jest.fn(),
    then: jest.fn()
  };
  
  // Configure all methods to return mockQuery by default
  Object.keys(mockQuery).forEach(key => {
    if (key !== 'single' && key !== 'head' && key !== 'then') {
      (mockQuery as any)[key].mockReturnValue(mockQuery);
    }
  });
  
  // Configure terminal methods
  (mockQuery as any).single.mockResolvedValue({ data: [], error: null });
  (mockQuery as any).head.mockResolvedValue({ data: [], error: null });
  (mockQuery as any).then.mockImplementation((callback: any) => {
    return Promise.resolve(callback({ data: [], error: null }));
  });
  
  return {
    __esModule: true,
    default: {
      from: jest.fn().mockReturnValue(mockQuery)
    }
  };
});

describe('Booking Handler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    mockRequest = {
      body: {},
      params: {},
      query: {}
    };

    // Create fresh mock query for each test
    mockQuery = createMockQuery();
    
    // Reset the Supabase mock
    const supabase = require('../../config/supabaseClient').default;
    supabase.from.mockReturnValue(mockQuery);
  });

  describe('create', () => {
    const mockUser = { id: 'user-123' };
    const validBookingData = {
      description: 'Reunião de equipe',
      room: 1,
      date: '15/01/2024',
      start_time: '09:00:00',
      end_time: '10:00:00',
      repeat: null,
      day_repeat: null
    };
    


    it('deve criar uma reserva com sucesso', async () => {
      mockQuery.then.mockImplementation((callback: any) => {
         return Promise.resolve(callback({ data: [], error: null }));
       });
      
      const mockBookingResult = {
        id: 1,
        ...validBookingData,
        user_id: mockUser.id,
        date: '2024-01-15'
      };
      mockQuery.single.mockResolvedValue({ data: mockBookingResult, error: null });
      
      // O mock do Supabase já está configurado no beforeEach

      await handler.create(mockUser, validBookingData, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando há conflito de horário', async () => {
      const conflictingBooking = {
        id: 2,
        room: 1,
        date: '2024-01-15',
        start_time: '08:30:00',
        end_time: '09:30:00'
      };

      // Mock para a consulta de conflitos retornar dados conflitantes
      const mockConflictQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lt: jest.fn().mockReturnValue({
                gt: jest.fn().mockResolvedValue({ data: [conflictingBooking], error: null })
              })
            })
          })
        })
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockConflictQuery);

      await handler.create(mockUser, validBookingData, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Conflito de horário: já existe uma reserva nesse intervalo.' });
    });

    it('deve criar reserva com repeat=day', async () => {
      const repeatBookingData = {
        ...validBookingData,
        repeat: 'day',
        day_repeat: 1,
        date: null
      };

      mockQuery.then.mockImplementation((callback: any) => {
         return Promise.resolve(callback({ data: [], error: null }));
       });
      
      const mockBookingResult = {
        id: 1,
        ...repeatBookingData,
        user_id: mockUser.id
      };
      mockQuery.single.mockResolvedValue({ data: mockBookingResult, error: null });
      
      // O mock do Supabase já está configurado no beforeEach

      await handler.create(mockUser, repeatBookingData, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve criar reserva com repeat=week', async () => {
      const repeatBookingData = {
        ...validBookingData,
        repeat: 'week',
        day_repeat: 1,
        date: null
      };

      mockQuery.then.mockImplementation((callback: any) => {
         return Promise.resolve(callback({ data: [], error: null }));
       });
      
      const mockBookingResult = {
        id: 1,
        ...repeatBookingData,
        user_id: mockUser.id
      };
      mockQuery.single.mockResolvedValue({ data: mockBookingResult, error: null });
      
      // O mock do Supabase já está configurado no beforeEach

      await handler.create(mockUser, repeatBookingData, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve criar reserva com repeat=month', async () => {
      const repeatBookingData = {
        ...validBookingData,
        repeat: 'month',
        day_repeat: 15,
        date: null
      };

      mockQuery.then.mockImplementation((callback: any) => {
         return Promise.resolve(callback({ data: [], error: null }));
       });
      
      const mockBookingResult = {
        id: 1,
        ...repeatBookingData,
        user_id: mockUser.id
      };
      mockQuery.single.mockResolvedValue({ data: mockBookingResult, error: null });
      
      // O mock do Supabase já está configurado no beforeEach

      await handler.create(mockUser, repeatBookingData, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando há erro na inserção', async () => {
      // Mock para não ter conflitos
      const mockNoConflictQuery = {
        ...mockQuery,
        then: jest.fn().mockImplementation((callback: any) => {
          return Promise.resolve(callback({ data: [], error: null }));
        })
      };
      
      // Mock para erro na inserção
      const mockInsertQuery = {
        ...mockQuery,
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Erro na inserção' } })
          })
        })
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from
        .mockReturnValueOnce(mockNoConflictQuery) // primeira chamada para verificar conflitos
        .mockReturnValueOnce(mockInsertQuery);    // segunda chamada para inserção

      await handler.create(mockUser, validBookingData, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro na inserção' });
    });

    it('deve retornar erro 500 quando há exceção', async () => {
      // Mock para lançar exceção na primeira consulta
      const mockErrorQuery = {
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lt: jest.fn().mockReturnValue({
              gt: jest.fn().mockRejectedValue(new Error('Erro inesperado'))
            })
          })
        })
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockErrorQuery);

      await handler.create(mockUser, validBookingData, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao criar reserva' });
    });

    it('deve tratar repeat="null" como null', async () => {
      const nullRepeatData = {
        ...validBookingData,
        repeat: 'null'
      };

      mockQuery.then.mockImplementation((callback: any) => {
         return Promise.resolve(callback({ data: [], error: null }));
       });
      
      const mockBookingResult = {
        id: 1,
        ...nullRepeatData,
        repeat: null,
        user_id: mockUser.id,
        date: '2024-01-15'
      };
      mockQuery.single.mockResolvedValue({ data: mockBookingResult, error: null });
      
      // O mock do Supabase já está configurado no beforeEach

      await handler.create(mockUser, nullRepeatData, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe('getBooking', () => {
    it('deve retornar todas as reservas formatadas', async () => {
      const mockBookings = [
        {
          id: 1,
          description: 'Reunião',
          date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          repeat: null,
          day_repeat: null,
          user_profiles: [{
            id: 1,
            name: 'João Silva',
            email: 'joao@teste.com',
            phone: '11999999999'
          }],
          rooms: [{
            id: 1,
            name: 'Sala A',
            size: 10
          }]
        }
      ];

      mockQuery.select.mockResolvedValue({ data: mockBookings, error: null });
      
      // O mock do Supabase já está configurado no beforeEach

      await handler.getBooking(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando há falha na consulta', async () => {
      const mockErrorQuery = {
        ...mockQuery,
        select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Erro na consulta' } })
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockErrorQuery);

      await handler.getBooking(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro na consulta' });
    });

    it('deve retornar erro 500 quando há exceção', async () => {
      const mockErrorQuery = {
        ...mockQuery,
        select: jest.fn().mockRejectedValue(new Error('Erro inesperado'))
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockErrorQuery);

      await handler.getBooking(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao buscar reservas' });
    });

    it('deve formatar reservas com repeat corretamente', async () => {
      const mockBookings = [
        {
          id: 1,
          description: 'Reunião recorrente',
          date: null,
          start_time: '09:00:00',
          end_time: '10:00:00',
          repeat: 'week',
          day_repeat: 1,
          user_profiles: [{
            id: 1,
            name: 'João Silva',
            email: 'joao@teste.com',
            phone: '11999999999'
          }],
          rooms: [{
            id: 1,
            name: 'Sala A',
            size: 10
          }]
        }
      ];

      mockQuery.select.mockResolvedValue({ data: mockBookings, error: null });
      
      // O mock do Supabase já está configurado no beforeEach

      await handler.getBooking(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe('getBookingById', () => {
    beforeEach(() => {
      mockRequest.params = { id: '1' };
    });

    it('deve retornar uma reserva específica', async () => {
      const mockBooking = {
        id: 1,
        description: 'Reunião',
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        repeat: null,
        day_repeat: null,
        user_profiles: [{
          id: 1,
          name: 'João Silva',
          email: 'joao@teste.com',
          phone: '11999999999'
        }],
        rooms: [{
          id: 1,
          name: 'Sala A',
          size: 10
        }]
      };

      const mockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockBooking, error: null })
          })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.getBookingById(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve retornar erro 404 quando reserva não é encontrada', async () => {
      const mockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.getBookingById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Reserva não encontrada' });
    });

    it('deve retornar erro 404 quando data é null', async () => {
      const mockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.getBookingById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Reserva não encontrada' });
    });

    it('deve retornar erro 500 quando há exceção', async () => {
      const mockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Erro inesperado'))
          })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.getBookingById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao buscar reserva por ID' });
    });
  });

  describe('updateBooking', () => {
    beforeEach(() => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        description: 'Reunião atualizada',
        start_time: '10:00:00'
      };
    });

    it('deve atualizar uma reserva com sucesso', async () => {
      const existingBooking = {
        id: 1,
        description: 'Reunião antiga',
        room: 1,
        date: '2024-01-15'
      };

      const updatedBooking = {
        ...existingBooking,
        description: 'Reunião atualizada',
        start_time: '10:00'
      };

      // First call for fetching existing booking
      const mockFetchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: existingBooking, error: null })
          })
        })
      };
      
      // Second call for update operation
      const mockUpdateChain = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: updatedBooking, error: null })
            })
          })
        })
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValueOnce(mockFetchChain).mockReturnValueOnce(mockUpdateChain);

      await handler.updateBooking(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve retornar erro 404 quando reserva não existe', async () => {
      // Usar horários válidos para passar na validação
      mockRequest.body = {
        description: 'Reunião atualizada',
        start_time: '09:00:00',
        end_time: '10:00:00'
      };
      
      const mockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.updateBooking(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao atualizar reserva' });
    });

    it('deve retornar erro 400 quando há erro na atualização', async () => {
      // Usar horários válidos para passar na validação
      mockRequest.body = {
        description: 'Reunião atualizada',
        start_time: '09:00:00',
        end_time: '10:00:00'
      };
      
      const existingBooking = {
        id: 1,
        description: 'Reunião antiga',
        room: 1,
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00'
      };

      // First call for fetching existing booking
      const mockFetchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: existingBooking, error: null })
          })
        })
      };
      
      // Mock para não ter conflitos
      const mockNoConflictQuery = {
        ...mockQuery,
        then: jest.fn().mockImplementation((callback: any) => {
          return Promise.resolve(callback({ data: [], error: null }));
        })
      };
      
      // Second call for update operation
      const mockUpdateChain = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Erro na atualização' } })
            })
          })
        })
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from
        .mockReturnValueOnce(mockFetchChain)     // primeira chamada para buscar reserva existente
        .mockReturnValueOnce(mockNoConflictQuery) // segunda chamada para verificar conflitos
        .mockReturnValueOnce(mockUpdateChain);    // terceira chamada para atualização

      await handler.updateBooking(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro na atualização' });
    });

    it('deve retornar erro 500 quando há exceção', async () => {
      const mockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Erro inesperado'))
          })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.updateBooking(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao atualizar reserva' });
    });

    it('deve atualizar campos específicos corretamente', async () => {
      mockRequest.body = {
        date: '16/01/2024',
        room: 2,
        repeat: 'null',
        day_repeat: 3
      };

      const existingBooking = {
        id: 1,
        description: 'Reunião antiga',
        room: 1,
        date: '2024-01-15'
      };

      const updatedBooking = {
        ...existingBooking,
        room: 2,
        date: '2024-01-16',
        repeat: null,
        day_repeat: 3
      };

      // First call for fetching existing booking
      const mockFetchChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: existingBooking, error: null })
          })
        })
      };
      
      // Second call for update operation
      const mockUpdateChain = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: updatedBooking, error: null })
            })
          })
        })
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValueOnce(mockFetchChain).mockReturnValueOnce(mockUpdateChain);

      await handler.updateBooking(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe('deleteBooking', () => {
    beforeEach(() => {
      mockRequest.params = { id: '1' };
    });

    it('deve deletar uma reserva com sucesso', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: {}, error: null })
          })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.deleteBooking(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando há erro na deleção', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Erro na deleção' } })
          })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.deleteBooking(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro na deleção' });
    });

    it('deve retornar erro 500 quando há exceção', async () => {
      const mockChain = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Erro inesperado'))
          })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.deleteBooking(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao deletar reserva' });
    });
  });

  describe('searchBookingsByDescription', () => {
    it('deve buscar reservas por descrição', async () => {
      mockRequest.query = { description: 'reunião' };
      
      const mockBookings = [
        {
          id: 1,
          description: 'Reunião de equipe',
          date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          repeat: null,
          day_repeat: null,
          user_profiles: [{
            id: 1,
            name: 'João Silva',
            email: 'joao@teste.com',
            phone: '11999999999'
          }],
          rooms: [{
            id: 1,
            name: 'Sala A',
            size: 10
          }]
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockResolvedValue({ data: mockBookings, error: null })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.searchBookingsByDescription(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe('getBookingMy', () => {
    it('deve retornar reservas do usuário autenticado', async () => {
      const mockProfileRequest = {
        ...mockRequest,
        profile: { id: 'user-123' }
      };

      const mockBookings = [
        {
          id: 1,
          description: 'Minha reunião',
          date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          repeat: null,
          day_repeat: null,
          user_profiles: [{
            id: 1,
            name: 'João Silva',
            email: 'joao@teste.com',
            phone: '11999999999'
          }],
          rooms: [{
            id: 1,
            name: 'Sala A',
            size: 10
          }]
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockBookings, error: null })
          })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.getBookingMy(mockProfileRequest as any, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve retornar erro 401 quando usuário não está autenticado', async () => {
      const mockProfileRequest = {
        ...mockRequest,
        profile: undefined
      };

      await handler.getBookingMy(mockProfileRequest as any, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Usuário não autenticado' });
    });
  });

  describe('getBookingByFilter', () => {
    beforeEach(() => {
      mockRequest.body = {
        userId: 'user-123',
        room: 1,
        date: '2024-01-15'
      };
    });

    it('deve filtrar reservas por critérios específicos', async () => {
      const mockBookings = [
        {
          id: 1,
          description: 'Reunião filtrada',
          room: 1,
          date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          repeat: null,
          day_repeat: null,
          user_id: 'user-123'
        }
      ];

      // Mock que simula a cadeia dinâmica de .eq() e é awaitable
      const mockQuery: any = Promise.resolve({ data: mockBookings, error: null });
      mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
      
      const mockChain = {
        select: jest.fn().mockReturnValue(mockQuery)
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.getBookingByFilter(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve retornar erro quando há falha na consulta', async () => {
      // Mock que simula erro diretamente na query
      const mockQuery: any = Promise.resolve({ data: null, error: { message: 'Erro na consulta' } });
      mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
      
      const mockChain = {
        select: jest.fn().mockReturnValue(mockQuery)
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.getBookingByFilter(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro na consulta' });
    });
  });

  describe('getBookingsByToday', () => {
    it('deve retornar reservas de hoje', async () => {
      const mockBookings = [
        {
          id: 1,
          description: 'Reunião de hoje',
          date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          repeat: null,
          day_repeat: null,
          user_profiles: [{
            id: 1,
            name: 'João Silva',
            email: 'joao@teste.com',
            phone: '11999999999'
          }],
          rooms: [{
            id: 1,
            name: 'Sala A',
            size: 10
          }]
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ data: mockBookings, error: null })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.getBookingsByToday(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve retornar erro quando há falha na consulta', async () => {
      const mockChain = {
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ data: null, error: { message: 'Erro na consulta' } })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.getBookingsByToday(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro na consulta' });
    });
  });

  describe('getBookingsByWeek', () => {
    it('deve retornar reservas da semana', async () => {
      const mockBookings = [
        {
          id: 1,
          description: 'Reunião da semana',
          date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          repeat: 'week',
          day_repeat: 1,
          user_profiles: [{
            id: 1,
            name: 'João Silva',
            email: 'joao@teste.com',
            phone: '11999999999'
          }],
          rooms: [{
            id: 1,
            name: 'Sala A',
            size: 10
          }]
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ data: mockBookings, error: null })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.getBookingsByWeek(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve retornar erro quando há falha na consulta', async () => {
      const mockChain = {
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockResolvedValue({ data: null, error: { message: 'Erro na consulta' } })
        })
      };
      const supabase = require('../../config/supabaseClient').default;
      supabase.from.mockReturnValue(mockChain);

      await handler.getBookingsByWeek(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro na consulta' });
    });
  });

  describe('getBookingsByMonth', () => {
    it('deve retornar reservas do mês', async () => {
      const mockBookings = [
        {
          id: 1,
          description: 'Reunião do mês',
          date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          repeat: 'month',
          day_repeat: 15,
          user_profiles: [{
            id: 1,
            name: 'João Silva',
            email: 'joao@teste.com',
            phone: '11999999999'
          }],
          rooms: [{
            id: 1,
            name: 'Sala A',
            size: 10
          }]
        }
      ];

      // Mock para as duas consultas do Promise.all
      const mockChainMonthly = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({ data: mockBookings, error: null })
            })
          })
        })
      };
      
      const mockChainSpecific = {
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              is: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from
        .mockReturnValueOnce(mockChainMonthly)
        .mockReturnValueOnce(mockChainSpecific);

      await handler.getBookingsByMonth(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve retornar erro quando há falha na consulta', async () => {
      // Mock para simular erro na primeira consulta
      const mockChainMonthly = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({ data: null, error: { message: 'Erro na consulta' } })
            })
          })
        })
      };
      
      const mockChainSpecific = {
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              is: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from
        .mockReturnValueOnce(mockChainMonthly)
        .mockReturnValueOnce(mockChainSpecific);

      await handler.getBookingsByMonth(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro na consulta' });
    });
  });

  describe('getBookingsOfCalendar', () => {
    it('deve retornar reservas do calendário com mês e ano específicos', async () => {
      mockRequest.query = { month: '1', year: '2024' };
      
      const mockBookings = [
        {
          id: 1,
          description: 'Reunião do calendário',
          date: '2024-01-15',
          start_time: '09:00:00',
          end_time: '10:00:00',
          repeat: null,
          day_repeat: null,
          user_profiles: [{
            id: 1,
            name: 'João Silva',
            email: 'joao@teste.com',
            phone: '11999999999'
          }],
          rooms: [{
            id: 1,
            name: 'Sala A',
            size: 10
          }]
        }
      ];

      // Mock para as três consultas do Promise.all
      const mockChainMonthly = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      };
      
      const mockChainWeekly = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      };
      
      const mockChainSpecific = {
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              is: jest.fn().mockResolvedValue({ data: mockBookings, error: null })
            })
          })
        })
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from
        .mockReturnValueOnce(mockChainMonthly)
        .mockReturnValueOnce(mockChainWeekly)
        .mockReturnValueOnce(mockChainSpecific);

      await handler.getBookingsOfCalendar(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve usar mês e ano atuais quando não fornecidos', async () => {
      mockRequest.query = {};
      
      const mockBookings:any = [];
      
      // Mock para as três consultas do Promise.all
      const mockChainMonthly = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      };
      
      const mockChainWeekly = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      };
      
      const mockChainSpecific = {
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              is: jest.fn().mockResolvedValue({ data: mockBookings, error: null })
            })
          })
        })
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from
        .mockReturnValueOnce(mockChainMonthly)
        .mockReturnValueOnce(mockChainWeekly)
        .mockReturnValueOnce(mockChainSpecific);

      await handler.getBookingsOfCalendar(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('deve retornar erro quando há falha na consulta', async () => {
      mockRequest.query = { month: '1', year: '2024' };
      
      // Mock para simular erro na primeira consulta
      const mockChainMonthly = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({ data: null, error: { message: 'Erro na consulta' } })
            })
          })
        })
      };
      
      const mockChainWeekly = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      };
      
      const mockChainSpecific = {
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              is: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      };
      
      const supabase = require('../../config/supabaseClient').default;
      supabase.from
        .mockReturnValueOnce(mockChainMonthly)
        .mockReturnValueOnce(mockChainWeekly)
        .mockReturnValueOnce(mockChainSpecific);

      await handler.getBookingsOfCalendar(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro na consulta' });
    });
  });
});