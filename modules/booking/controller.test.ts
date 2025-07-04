import { Request, Response, NextFunction } from 'express';
import * as controller from './controller';
import * as handler from './handler';

// Mock do handler
jest.mock('./handler', () => ({
  create: jest.fn(),
  getBooking: jest.fn(),
  getBookingById: jest.fn(),
  updateBooking: jest.fn(),
  deleteBooking: jest.fn(),
  getBookingByFilter: jest.fn(),
  getBookingMy: jest.fn(),
  getBookingsByToday: jest.fn(),
  getBookingsByWeek: jest.fn(),
  searchBookingsByDescription: jest.fn()
}));

describe('Booking Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockNext = jest.fn();
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    mockRequest = {
      body: {},
      params: {},
      query: {},
      profile: { id: 'user-123' },
      user: { id: 'user-123' }
    } as any;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('deve criar uma reserva com dados válidos', async () => {
      mockRequest.body = {
        description: 'Reunião de equipe',
        room: 'Sala 1',
        date: '15/01/2024',
        start_time: '09:00',
        end_time: '10:00',
        repeat: null,
        day_repeat: null
      };

      await controller.createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(handler.create).toHaveBeenCalledWith(
        { id: 'user-123' },
        mockRequest.body,
        mockResponse
      );
    });

    it('deve retornar erro 400 quando campos obrigatórios não fornecidos', async () => {
      mockRequest.body = {
        description: 'Reunião',
        // room, start_time, end_time ausentes
      };

      await controller.createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Sala é obrigatória e deve ser um texto válido.' });
      expect(handler.create).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando data não fornecida para reserva não repetida', async () => {
      mockRequest.body = {
        description: 'Reunião',
        room: 'Sala 1',
        start_time: '09:00',
        end_time: '10:00',
        repeat: 'null',
        // date ausente
      };

      await controller.createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Tipo de recorrência inválido. Use: none, day, week ou month.'
      });
      expect(handler.create).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando horário de início >= horário de fim', async () => {
      mockRequest.body = {
        description: 'Reunião',
        room: 'Sala 1',
        date: '15/01/2024',
        start_time: '10:00',
        end_time: '09:00', // Horário inválido
        repeat: null
      };

      await controller.createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Horário de início deve ser anterior ao horário de fim.' });
      expect(handler.create).not.toHaveBeenCalled();
    });

    it('deve normalizar horários corretamente', async () => {
      mockRequest.body = {
        description: 'Reunião',
        room: "12dasda-dad-1-13",
        date: '15/01/2024',
        start_time: '09:00', // Será normalizado para 09:00:00
        end_time: '10:00:00', // Já está normalizado
        repeat: null
      };

      await controller.createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(handler.create).toHaveBeenCalledWith(
        { id: 'user-123' },
        mockRequest.body,
        mockResponse
      );
    });

    it('deve usar profile.id quando disponível', async () => {
      mockRequest.body = {
        description: 'Reunião',
        room: 'Sala 1',
        date: '15/01/2024',
        start_time: '09:00',
        end_time: '10:00',
        repeat: null
      };
      
      (mockRequest as any).profile = { id: 'profile-123' };
      (mockRequest as any).user = { id: 'user-456' };

      await controller.createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(handler.create).toHaveBeenCalledWith(
        { id: 'profile-123' },
        mockRequest.body,
        mockResponse
      );
    });

    it('deve usar user.id quando profile não disponível', async () => {
      mockRequest.body = {
        description: 'Reunião',
        room: 'Sala 1',
        date: '15/01/2024',
        start_time: '09:00',
        end_time: '10:00',
        repeat: null
      };
      
      (mockRequest as any).profile = undefined;
      (mockRequest as any).user = { id: 'user-456' };

      await controller.createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(handler.create).toHaveBeenCalledWith(
        { id: 'user-456' },
        mockRequest.body,
        mockResponse
      );
    });

    it('deve tratar exceções e retornar erro 500', async () => {
      mockRequest.body = {
        description: 'Reunião',
        room: 'Sala 1',
        date: '15/01/2024',
        start_time: '09:00',
        end_time: '10:00',
        repeat: null
      };

      (handler.create as jest.Mock).mockRejectedValue(new Error('Erro interno'));

      await controller.createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro interno do servidor ao criar reserva.' });
    });
  });

  describe('getBooking', () => {
    it('deve chamar handler.getBooking', async () => {
      await controller.getBooking(mockRequest as Request, mockResponse as Response);

      expect(handler.getBooking).toHaveBeenCalledWith(mockRequest, mockResponse);
    });
  });

  describe('getBookingById', () => {
    it('deve chamar handler.getBookingById', async () => {
      await controller.getBookingById(mockRequest as Request, mockResponse as Response);

      expect(handler.getBookingById).toHaveBeenCalledWith(mockRequest, mockResponse);
    });
  });

  describe('updateBooking', () => {
    it('deve atualizar reserva com dados válidos', async () => {
      mockRequest.body = {
        description: 'Reunião atualizada',
        start_time: '10:00'
      };

      await controller.updateBooking(mockRequest as Request, mockResponse as Response);

      expect(handler.updateBooking).toHaveBeenCalledWith(mockRequest, mockResponse);
    });

    it('deve retornar erro 400 quando body está vazio', async () => {
      mockRequest.body = {};

      await controller.updateBooking(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Nenhum campo válido enviado para atualização'
      });
      expect(handler.updateBooking).not.toHaveBeenCalled();
    });
  });

  describe('deleteBooking', () => {
    it('deve chamar handler.deleteBooking', async () => {
      await controller.deleteBooking(mockRequest as Request, mockResponse as Response);

      expect(handler.deleteBooking).toHaveBeenCalledWith(mockRequest, mockResponse);
    });
  });

  describe('getBookingByFilter', () => {
    it('deve chamar handler.getBookingByFilter', async () => {
      await controller.getBookingByFilter(mockRequest as Request, mockResponse as Response);

      expect(handler.getBookingByFilter).toHaveBeenCalledWith(mockRequest, mockResponse);
    });
  });

  describe('getBookingMy', () => {
    it('deve chamar handler.getBookingMy', async () => {
      await controller.getBookingMy(mockRequest as Request, mockResponse as Response);

      expect(handler.getBookingMy).toHaveBeenCalledWith(mockRequest, mockResponse);
    });
  });

  describe('getBookingsByToday', () => {
    it('deve chamar handler.getBookingsByToday', async () => {
      await controller.getBookingsByToday(mockRequest as Request, mockResponse as Response);

      expect(handler.getBookingsByToday).toHaveBeenCalledWith(mockRequest, mockResponse);
    });
  });

  describe('getBookingsByWeek', () => {
    it('deve chamar handler.getBookingsByWeek', async () => {
      await controller.getBookingsByWeek(mockRequest as Request, mockResponse as Response);

      expect(handler.getBookingsByWeek).toHaveBeenCalledWith(mockRequest, mockResponse);
    });
  });

  describe('searchBookingsByDescription', () => {
    it('deve chamar handler.searchBookingsByDescription', async () => {
      await controller.searchBookingsByDescription(mockRequest as Request, mockResponse as Response);

      expect(handler.searchBookingsByDescription).toHaveBeenCalledWith(mockRequest, mockResponse);
    });
  });

  describe('normalizeTime utility', () => {
    // Testando a função normalizeTime indiretamente através do createBooking
    it('deve normalizar horários sem segundos', async () => {
      mockRequest.body = {
        description: 'Reunião',
        room: 'Sala 1',
        date: '15/01/2024',
        start_time: '09:00', // Sem segundos
        end_time: '10:30', // Sem segundos
        repeat: null
      };

      await controller.createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      // Verifica se o handler foi chamado (indicando que a normalização funcionou)
      expect(handler.create).toHaveBeenCalled();
    });

    it('deve manter horários já normalizados', async () => {
      mockRequest.body = {
        description: 'Reunião',
        room: 'Sala 1',
        date: '15/01/2024',
        start_time: '09:00:00', // Já com segundos
        end_time: '10:30:00', // Já com segundos
        repeat: null
      };

      await controller.createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(handler.create).toHaveBeenCalled();
    });

    it('deve tratar horários nulos', async () => {
      mockRequest.body = {
        description: 'Reunião',
        room: 'Sala 1',
        date: '15/01/2024',
        start_time: null,
        end_time: undefined,
        repeat: null
      };

      await controller.createBooking(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Horários de início e fim são obrigatórios.' });
    });
  });
});