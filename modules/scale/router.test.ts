import request from 'supertest';
import express from 'express';
import ScaleRouter from './router';
import * as controller from './controller';
import { requireAdmin, requireAuth } from '@/config/middleware';

// Mock do controller
jest.mock('./controller');
const mockController = controller as jest.Mocked<typeof controller>;

// Mock dos middlewares
jest.mock('@/config/middleware', () => ({
  requireAdmin: jest.fn((req, res, next) => next()),
  requireAuth: jest.fn((req, res, next) => next())
}));

const app = express();
app.use(express.json());
app.use('/scale', ScaleRouter);

describe('Scale Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock das funções do controller
    mockController.createScale.mockImplementation(async (req, res) => {
      res.status(201).json({ message: 'Escala criada com sucesso.' });
    });

    mockController.getScales.mockImplementation(async (req, res) => {
      res.status(200).json({
        scales: [
          {
            id: '1',
            date: '2024-01-01',
            name: 'Escala Teste',
            description: 'Descrição teste',
            direction: { id: '1', full_name: 'João Silva' },
            band: { id: '1', full_name: 'Banda Teste' }
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          pageSize: 15,
          totalPages: 1
        }
      });
    });

    mockController.getScaleById.mockImplementation(async (req, res) => {
      res.status(200).json({
        id: '1',
        date: '2024-01-01',
        name: 'Escala Teste',
        description: 'Descrição teste'
      });
    });

    mockController.updateScale.mockImplementation(async (req, res) => {
      res.status(200).json({ message: 'Escala atualizada com sucesso.' });
    });

    mockController.deleteScale.mockImplementation(async (req, res) => {
      res.status(200).json({ message: 'Escala excluída com sucesso.' });
    });

    mockController.searchScale.mockImplementation(async (req, res) => {
      res.status(200).json([
        {
          id: '1',
          date: '2024-01-01',
          name: 'Escala Teste',
          description: 'Descrição teste'
        }
      ]);
    });

    mockController.duplicateScale.mockImplementation(async (req, res) => {
      res.status(201).json({
        id: '2',
        date: '2024-01-01',
        name: 'Escala Teste (duplicado)',
        description: 'Descrição teste'
      });
    });
  });

  describe('POST /', () => {
    it('should create scale successfully', async () => {
      // When
      const response = await request(app)
        .post('/scale/')
        .send({
          date: '01/01/2024',
          name: 'Escala Teste',
          direction: '1',
          band: '1'
        })
        .expect(201);

      // Then
      expect(mockController.createScale).toHaveBeenCalledTimes(1);
      expect(requireAdmin).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({ message: 'Escala criada com sucesso.' });
    });
  });

  describe('GET /', () => {
    it('should get scales successfully', async () => {
      // When
      const response = await request(app)
        .get('/scale/')
        .expect(200);

      // Then
      expect(mockController.getScales).toHaveBeenCalledTimes(1);
      expect(requireAuth).toHaveBeenCalledTimes(1);
      expect(response.body.scales).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should get scales with pagination parameters', async () => {
      // When
      const response = await request(app)
        .get('/scale/?page=2&pageSize=10')
        .expect(200);

      // Then
      expect(mockController.getScales).toHaveBeenCalledTimes(1);
      expect(response.body.scales).toBeDefined();
    });
  });

  describe('GET /:id', () => {
    it('should get scale by id successfully', async () => {
      // When
      const response = await request(app)
        .get('/scale/1')
        .expect(200);

      // Then
      expect(mockController.getScaleById).toHaveBeenCalledTimes(1);
      expect(requireAuth).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        id: '1',
        date: '2024-01-01',
        name: 'Escala Teste',
        description: 'Descrição teste'
      });
    });
  });

  describe('PUT /:id', () => {
    it('should update scale successfully', async () => {
      // When
      const response = await request(app)
        .put('/scale/1')
        .send({ name: 'Escala Atualizada' })
        .expect(200);

      // Then
      expect(mockController.updateScale).toHaveBeenCalledTimes(1);
      expect(requireAdmin).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({ message: 'Escala atualizada com sucesso.' });
    });
  });

  describe('DELETE /:id', () => {
    it('should delete scale successfully', async () => {
      // When
      const response = await request(app)
        .delete('/scale/1')
        .expect(200);

      // Then
      expect(mockController.deleteScale).toHaveBeenCalledTimes(1);
      expect(requireAdmin).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({ message: 'Escala excluída com sucesso.' });
    });
  });

  describe('PUT /search', () => {
    it('should search scales successfully', async () => {
      // When
      const response = await request(app)
        .put('/scale/search')
        .send({ name: 'Teste' })
        .expect(200);

      // Then
      expect(mockController.searchScale).toHaveBeenCalledTimes(1);
      expect(requireAdmin).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual([
        {
          id: '1',
          date: '2024-01-01',
          name: 'Escala Teste',
          description: 'Descrição teste'
        }
      ]);
    });
  });

  describe('POST /duplicate/:id', () => {
    it('should duplicate scale successfully', async () => {
      // When
      const response = await request(app)
        .post('/scale/duplicate/1')
        .expect(201);

      // Then
      expect(mockController.duplicateScale).toHaveBeenCalledTimes(1);
      expect(requireAdmin).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        id: '2',
        date: '2024-01-01',
        name: 'Escala Teste (duplicado)',
        description: 'Descrição teste'
      });
    });
  });

  describe('Middleware validation', () => {
    it('should call requireAdmin for admin routes', async () => {
      // Test POST /
      await request(app).post('/scale/').send({});
      expect(requireAdmin).toHaveBeenCalled();

      jest.clearAllMocks();

      // Test PUT /search
      await request(app).put('/scale/search').send({});
      expect(requireAdmin).toHaveBeenCalled();

      jest.clearAllMocks();

      // Test POST /duplicate/:id
      await request(app).post('/scale/duplicate/1');
      expect(requireAdmin).toHaveBeenCalled();

      jest.clearAllMocks();

      // Test DELETE /:id
      await request(app).delete('/scale/1');
      expect(requireAdmin).toHaveBeenCalled();

      jest.clearAllMocks();

      // Test PUT /:id
      await request(app).put('/scale/1').send({});
      expect(requireAdmin).toHaveBeenCalled();
    });

    it('should call requireAuth for auth routes', async () => {
      // Test GET /
      await request(app).get('/scale/');
      expect(requireAuth).toHaveBeenCalled();

      jest.clearAllMocks();

      // Test GET /:id
      await request(app).get('/scale/1');
      expect(requireAuth).toHaveBeenCalled();
    });
  });

  describe('Route validation', () => {
    const routes = [
      { method: 'post', path: '/' },
      { method: 'get', path: '/' },
      { method: 'put', path: '/search' },
      { method: 'post', path: '/duplicate/1' },
      { method: 'delete', path: '/1' },
      { method: 'put', path: '/1' },
      { method: 'get', path: '/1' }
    ];

    routes.forEach(route => {
      it(`should have ${route.method.toUpperCase()} ${route.path} route configured`, async () => {
        let response;
        
        switch (route.method) {
          case 'post':
            response = await request(app).post(`/scale${route.path}`).send({});
            break;
          case 'get':
            response = await request(app).get(`/scale${route.path}`);
            break;
          case 'put':
            response = await request(app).put(`/scale${route.path}`).send({});
            break;
          case 'delete':
            response = await request(app).delete(`/scale${route.path}`);
            break;
          default:
            throw new Error(`Unsupported method: ${route.method}`);
        }
        
        // Should not return 404 (route exists)
        expect(response.status).not.toBe(404);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle controller errors', async () => {
      // Given
      mockController.createScale.mockImplementation(async (req, res) => {
        res.status(400).json({ error: 'Data inválida.' });
      });

      // When
      const response = await request(app)
        .post('/scale/')
        .send({
          date: 'invalid-date',
          name: 'Escala Teste',
          direction: '1'
        })
        .expect(400);

      // Then
      expect(response.body).toEqual({ error: 'Data inválida.' });
    });

    it('should handle not found errors', async () => {
      // Given
      mockController.getScaleById.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Escala não encontrada.' });
      });

      // When
      const response = await request(app)
        .get('/scale/999')
        .expect(404);

      // Then
      expect(response.body).toEqual({ error: 'Escala não encontrada.' });
    });
  });
});