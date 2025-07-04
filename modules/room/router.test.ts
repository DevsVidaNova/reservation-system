import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import roomRouter from './router';
import * as roomController from './controller';

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

jest.mock('../../config/middleware', () => ({
  requireAuth: jest.fn((req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Token não fornecido. Acesso restrito.' });
      return;
    }
    (req as any).user = { id: 'user-123' };
    (req as any).profile = { id: 'profile-123', role: 'user' };
    (req as any).role = 'user';
    next();
  }),
  requireAdmin: jest.fn((req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Token não fornecido. Acesso restrito.' });
      return;
    }
    (req as any).user = { id: 'admin-123' };
    (req as any).profile = { id: 'admin-profile-123', role: 'admin' };
    (req as any).role = 'admin';
    next();
  }),
  publicRoute: jest.fn((req: Request, res: Response, next: NextFunction) => next())
}));

// Importar os mocks para usar nos testes
const { requireAuth, requireAdmin, publicRoute } = require('../../config/middleware');
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;
const mockPublicRoute = publicRoute as jest.MockedFunction<typeof publicRoute>;

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

jest.mock('./controller');
const mockController = roomController as jest.Mocked<typeof roomController>;


describe('Room Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/rooms', roomRouter);
    jest.clearAllMocks();
    
    // Reset mocks to default behavior
    mockRequireAdmin.mockImplementation((req: Request, res: Response, next: NextFunction) => {
      const token = req.headers['authorization']?.split(' ')[1];
      if (!token) {
        res.status(401).json({ error: 'Token não fornecido. Acesso restrito.' });
        return;
      }
      (req as any).user = { id: 'admin-123' };
      (req as any).profile = { id: 'admin-profile-123', role: 'admin' };
      (req as any).role = 'admin';
      next();
    });
    
    mockPublicRoute.mockImplementation((req: Request, res: Response, next: NextFunction) => next());
  });

  describe('POST /', () => {
    it('deve chamar requireAdmin middleware e createRoom controller', async () => {
      mockController.createRoom.mockImplementation(async (req, res) => {
        res.status(201).json({ id: 1, name: 'Nova Sala' });
      });

      const roomData = {
        name: 'Sala de Reunião',
        size: 10,
        description: 'Sala para reuniões'
      };

      const response = await request(app)
        .post('/rooms')
        .set('Authorization', 'Bearer valid-token')
        .send(roomData)
        .expect(201);

      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.createRoom).toHaveBeenCalled();
      expect(response.body).toEqual({ id: 1, name: 'Nova Sala' });
    });

    it('deve bloquear acesso quando requireAdmin falha', async () => {
      mockRequireAdmin.mockImplementation((req: Request, res: Response, next: NextFunction) => {
        res.status(403).json({ error: 'Acesso negado' });
      });

      const roomData = {
        name: 'Sala de Reunião'
      };

      const response = await request(app)
        .post('/rooms')
        .send(roomData)
        .expect(403);

      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.createRoom).not.toHaveBeenCalled();
      expect(response.body).toEqual({ error: 'Acesso negado' });
    });
  });

  describe('GET /', () => {
    it('deve chamar publicRoute middleware e getRooms controller', async () => {
      const mockRooms = {
        data: [{ id: 1, name: 'Sala 1' }],
        total: 1,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      };

      mockController.getRooms.mockImplementation(async (req, res) => {
        res.json(mockRooms);
      });

      const response = await request(app)
        .get('/rooms')
        .expect(200);

      expect(mockPublicRoute).toHaveBeenCalled();
      expect(mockController.getRooms).toHaveBeenCalled();
      expect(response.body).toEqual(mockRooms);
    });

    it('deve passar parâmetros de query para o controller', async () => {
      mockController.getRooms.mockImplementation(async (req, res) => {
        res.json({ data: [], total: 0 });
      });

      await request(app)
        .get('/rooms?page=2&limit=5')
        .expect(200);

      expect(mockController.getRooms).toHaveBeenCalled();
      const call = mockController.getRooms.mock.calls[0];
      expect(call[0].query).toEqual({ page: '2', limit: '5' });
    });
  });

  describe('GET /search', () => {
    it('deve chamar publicRoute middleware e searchRoom controller', async () => {
      const mockSearchResults = [{ id: 1, name: 'Sala de Reunião' }];

      mockController.searchRoom.mockImplementation(async (req, res) => {
        res.json(mockSearchResults);
      });

      const response = await request(app)
        .get('/rooms/search?name=Reunião')
        .expect(200);

      expect(mockPublicRoute).toHaveBeenCalled();
      expect(mockController.searchRoom).toHaveBeenCalled();
      expect(response.body).toEqual(mockSearchResults);
    });

    it('deve passar parâmetro de busca para o controller', async () => {
      mockController.searchRoom.mockImplementation(async (req, res) => {
        res.json([]);
      });

      await request(app)
        .get('/rooms/search?name=TestRoom')
        .expect(200);

      expect(mockController.searchRoom).toHaveBeenCalled();
      const call = mockController.searchRoom.mock.calls[0];
      expect(call[0].query).toEqual({ name: 'TestRoom' });
    });
  });

  describe('GET /:id', () => {
    it('deve chamar publicRoute middleware e getRoomById controller', async () => {
      const mockRoom = { id: 1, name: 'Sala 1' };

      mockController.getRoomById.mockImplementation(async (req, res) => {
        res.json(mockRoom);
      });

      const response = await request(app)
        .get('/rooms/1')
        .expect(200);

      expect(mockPublicRoute).toHaveBeenCalled();
      expect(mockController.getRoomById).toHaveBeenCalled();
      expect(response.body).toEqual(mockRoom);
    });

    it('deve passar o ID correto para o controller', async () => {
      mockController.getRoomById.mockImplementation(async (req, res) => {
        res.json({ id: 123, name: 'Sala 123' });
      });

      await request(app)
        .get('/rooms/123')
        .expect(200);

      expect(mockController.getRoomById).toHaveBeenCalled();
      const call = mockController.getRoomById.mock.calls[0];
      expect(call[0].params).toEqual({ id: '123' });
    });
  });

  describe('PUT /:id', () => {
    it('deve chamar requireAdmin middleware e updateRoom controller', async () => {
      const updatedRoom = { id: 1, name: 'Sala Atualizada' };

      mockController.updateRoom.mockImplementation(async (req, res) => {
        res.json(updatedRoom);
      });

      const updateData = { name: 'Sala Atualizada' };

      const response = await request(app)
        .put('/rooms/1')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.updateRoom).toHaveBeenCalled();
      expect(response.body).toEqual(updatedRoom);
    });

    it('deve bloquear acesso quando requireAdmin falha', async () => {
      mockRequireAdmin.mockImplementation((req: Request, res: Response, next: NextFunction) => {
        res.status(403).json({ error: 'Acesso negado' });
      });

      const updateData = { name: 'Sala Atualizada' };

      const response = await request(app)
        .put('/rooms/1')
        .send(updateData)
        .expect(403);

      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.updateRoom).not.toHaveBeenCalled();
      expect(response.body).toEqual({ error: 'Acesso negado' });
    });

    it('deve passar ID e dados de atualização para o controller', async () => {
      mockController.updateRoom.mockImplementation(async (req, res) => {
        res.json({ success: true });
      });

      const updateData = { name: 'Nova Sala', size: 20 };

      await request(app)
        .put('/rooms/456')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(mockController.updateRoom).toHaveBeenCalled();
      const call = mockController.updateRoom.mock.calls[0];
      expect(call[0].params).toEqual({ id: '456' });
      expect(call[0].body).toEqual(updateData);
    });
  });

  describe('DELETE /:id', () => {
    it('deve chamar requireAdmin middleware e deleteRoom controller', async () => {
      mockController.deleteRoom.mockImplementation(async (req, res) => {
        res.json({ message: 'Sala deletada com sucesso.' });
      });

      const response = await request(app)
        .delete('/rooms/1')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.deleteRoom).toHaveBeenCalled();
      expect(response.body).toEqual({ message: 'Sala deletada com sucesso.' });
    });

    it('deve bloquear acesso quando requireAdmin falha', async () => {
      mockRequireAdmin.mockImplementation((req: Request, res: Response, next: NextFunction) => {
        res.status(403).json({ error: 'Acesso negado' });
      });

      const response = await request(app)
        .delete('/rooms/1')
        .expect(403);

      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.deleteRoom).not.toHaveBeenCalled();
      expect(response.body).toEqual({ error: 'Acesso negado' });
    });

    it('deve passar o ID correto para o controller', async () => {
      mockController.deleteRoom.mockImplementation(async (req, res) => {
        res.json({ message: 'Deletado' });
      });

      await request(app)
        .delete('/rooms/789')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(mockController.deleteRoom).toHaveBeenCalled();
      const call = mockController.deleteRoom.mock.calls[0];
      expect(call[0].params).toEqual({ id: '789' });
    });
  });

  describe('Middleware Integration', () => {
    it('deve aplicar publicRoute para rotas GET', async () => {
      mockController.getRooms.mockImplementation(async (req, res) => res.json([]));
      mockController.getRoomById.mockImplementation(async (req, res) => res.json({}));
      mockController.searchRoom.mockImplementation(async (req, res) => res.json([]));

      await request(app).get('/rooms').expect(200);
      await request(app).get('/rooms/1').expect(200);
      await request(app).get('/rooms/search').expect(200);

      expect(mockPublicRoute).toHaveBeenCalledTimes(3);
      expect(mockRequireAdmin).not.toHaveBeenCalled();
    });

    it('deve aplicar requireAdmin para rotas de modificação', async () => {
      mockController.createRoom.mockImplementation(async (req, res) => res.status(201).json({}));
      mockController.updateRoom.mockImplementation(async (req, res) => res.json({}));
      mockController.deleteRoom.mockImplementation(async (req, res) => res.json({}));

      await request(app).post('/rooms').set('Authorization', 'Bearer valid-token').send({ name: 'Test' }).expect(201);
      await request(app).put('/rooms/1').set('Authorization', 'Bearer valid-token').send({ name: 'Test' }).expect(200);
      await request(app).delete('/rooms/1').set('Authorization', 'Bearer valid-token').expect(200);

      expect(mockRequireAdmin).toHaveBeenCalledTimes(3);
      expect(mockPublicRoute).not.toHaveBeenCalled();
    });
  });

  describe('Route Parameters and Body Parsing', () => {
    it('deve processar JSON no body das requisições', async () => {
      mockController.createRoom.mockImplementation(async (req, res) => {
        res.status(201).json(req.body);
      });

      const roomData = {
        name: 'Sala JSON',
        size: 15,
        description: 'Teste de JSON'
      };

      const response = await request(app)
        .post('/rooms')
        .set('Authorization', 'Bearer valid-token')
        .send(roomData)
        .expect(201);

      expect(response.body).toEqual(roomData);
    });

    it('deve capturar parâmetros de rota corretamente', async () => {
      mockController.getRoomById.mockImplementation(async (req, res) => {
        res.json({ receivedId: req.params.id });
      });

      const response = await request(app)
        .get('/rooms/test-id-123')
        .expect(200);

      expect(response.body).toEqual({ receivedId: 'test-id-123' });
    });
  });
});