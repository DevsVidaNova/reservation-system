import { Request, Response } from 'express';
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  searchRoom
} from './controller';
import * as handler from './handler';

// Mock do supabaseClient
jest.mock('@/config/supabaseClient', () => ({
  default: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));

// Mock do dayjs
jest.mock('dayjs', () => {
  const mockDayjs = jest.fn(() => ({
    format: jest.fn(() => '2024-01-01'),
    isValid: jest.fn(() => true)
  }));
  Object.assign(mockDayjs, {
    extend: jest.fn()
  });
  return mockDayjs;
});

// Mock do handler
jest.mock('./handler');
const mockHandler = handler as jest.Mocked<typeof handler>;

describe('Room Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {};
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    it('deve criar uma sala com sucesso', async () => {
      const roomData = {
        name: 'Sala de Reunião',
        size: 10,
        description: 'Sala para reuniões',
        exclusive: false,
        status: 'ativa'
      };

      const mockResult = {
        data: { id: 1, ...roomData },
        error: null
      };

      mockRequest.body = roomData;
      mockHandler.createRoomHandler.mockResolvedValue(mockResult);

      await createRoom(mockRequest as Request, mockResponse as Response);

      expect(mockHandler.createRoomHandler).toHaveBeenCalledWith(roomData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockResult.data);
    });

    it('deve retornar erro 400 quando há erro na criação', async () => {
      const roomData = { name: '' };
      const mockResult = {
        data: null,
        error: 'Nome da sala é obrigatório.'
      };

      mockRequest.body = roomData;
      mockHandler.createRoomHandler.mockResolvedValue(mockResult);

      await createRoom(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: mockResult.error });
    });
  });

  describe('getRooms', () => {
    it('deve listar salas com paginação padrão', async () => {
      const mockResult = {
        data: [{ id: 1, name: 'Sala 1' }],
        total: 1,
        page: 1,
        to: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        error: null
      };

      mockRequest.query = {};
      mockHandler.getRoomsHandler.mockResolvedValue(mockResult);

      await getRooms(mockRequest as Request, mockResponse as Response);

      expect(mockHandler.getRoomsHandler).toHaveBeenCalledWith(1, 10);
      expect(mockJson).toHaveBeenCalledWith({
        data: mockResult.data,
        total: mockResult.total,
        page: mockResult.page,
        to: mockResult.to,
        totalPages: mockResult.totalPages,
        hasNext: mockResult.hasNext,
        hasPrev: mockResult.hasPrev
      });
    });

    it('deve listar salas com paginação customizada', async () => {
      const mockResult = {
        data: [{ id: 1, name: 'Sala 1' }],
        total: 25,
        page: 2,
        to: 5,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
        error: null
      };

      mockRequest.query = { page: '2', limit: '5' };
      mockHandler.getRoomsHandler.mockResolvedValue(mockResult);

      await getRooms(mockRequest as Request, mockResponse as Response);

      expect(mockHandler.getRoomsHandler).toHaveBeenCalledWith(2, 5);
      expect(mockJson).toHaveBeenCalledWith({
        data: mockResult.data,
        total: mockResult.total,
        page: mockResult.page,
        to: mockResult.to,
        totalPages: mockResult.totalPages,
        hasNext: mockResult.hasNext,
        hasPrev: mockResult.hasPrev
      });
    });

    it('deve retornar erro 500 quando há erro no handler', async () => {
      const mockResult = {
        data: null,
        total: null,
        page: 1,
        to: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        error: 'Erro interno do servidor'
      };

      mockRequest.query = {};
      mockHandler.getRoomsHandler.mockResolvedValue(mockResult);

      await getRooms(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: mockResult.error });
    });
  });

  describe('getRoomById', () => {
    it('deve retornar uma sala por ID', async () => {
      const mockRoom = { id: 1, name: 'Sala 1' };
      const mockResult = {
        data: mockRoom,
        error: null
      };

      mockRequest.params = { id: '1' };
      mockHandler.getRoomByIdHandler.mockResolvedValue(mockResult);

      await getRoomById(mockRequest as Request, mockResponse as Response);

      expect(mockHandler.getRoomByIdHandler).toHaveBeenCalledWith('1');
      expect(mockJson).toHaveBeenCalledWith(mockRoom);
    });

    it('deve retornar erro 404 quando sala não encontrada', async () => {
      const mockResult = {
        data: null,
        error: 'Sala não encontrada.'
      };

      mockRequest.params = { id: '999' };
      mockHandler.getRoomByIdHandler.mockResolvedValue(mockResult);

      await getRoomById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: mockResult.error });
    });
  });

  describe('updateRoom', () => {
    it('deve atualizar uma sala com sucesso', async () => {
      const updates = { name: 'Sala Atualizada' };
      const mockResult = {
        data: { id: 1, name: 'Sala Atualizada' },
        error: null
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updates;
      mockHandler.updateRoomHandler.mockResolvedValue(mockResult);

      await updateRoom(mockRequest as Request, mockResponse as Response);

      expect(mockHandler.updateRoomHandler).toHaveBeenCalledWith({ id: '1', updates });
      expect(mockJson).toHaveBeenCalledWith(mockResult.data);
    });

    it('deve retornar erro 400 quando há erro na atualização', async () => {
      const updates = { name: '' };
      const mockResult = {
        data: null,
        error: 'Nome da sala deve ser uma string não vazia.'
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updates;
      mockHandler.updateRoomHandler.mockResolvedValue(mockResult);

      await updateRoom(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: mockResult.error });
    });
  });

  describe('deleteRoom', () => {
    it('deve deletar uma sala com sucesso', async () => {
      const mockResult = {
        data: null,
        error: null
      };

      mockRequest.params = { id: '1' };
      mockHandler.deleteRoomHandler.mockResolvedValue(mockResult);

      await deleteRoom(mockRequest as Request, mockResponse as Response);

      expect(mockHandler.deleteRoomHandler).toHaveBeenCalledWith('1');
      expect(mockJson).toHaveBeenCalledWith({ message: 'Sala deletada com sucesso.' });
    });

    it('deve retornar erro 400 quando há erro na deleção', async () => {
      const mockResult = {
        data: null,
        error: 'Erro ao deletar sala'
      };

      mockRequest.params = { id: '1' };
      mockHandler.deleteRoomHandler.mockResolvedValue(mockResult);

      await deleteRoom(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: mockResult.error });
    });
  });

  describe('searchRoom', () => {
    it('deve buscar salas por nome', async () => {
      const mockRooms = [{ id: 1, name: 'Sala de Reunião' }];
      const mockResult = {
        data: mockRooms,
        error: null
      };

      mockRequest.query = { name: 'Reunião' };
      mockHandler.searchRoomHandler.mockResolvedValue(mockResult);

      await searchRoom(mockRequest as Request, mockResponse as Response);

      expect(mockHandler.searchRoomHandler).toHaveBeenCalledWith('Reunião');
      expect(mockJson).toHaveBeenCalledWith(mockRooms);
    });

    it('deve retornar erro 404 quando nenhuma sala é encontrada', async () => {
      const mockResult = {
        data: null,
        error: 'Sala não encontrada.'
      };

      mockRequest.query = { name: 'Inexistente' };
      mockHandler.searchRoomHandler.mockResolvedValue(mockResult);

      await searchRoom(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: mockResult.error });
    });
  });
});