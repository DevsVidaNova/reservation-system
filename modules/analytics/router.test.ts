import request from 'supertest';
import express from 'express';
import AnalyticsRouter from './router';
import * as controller from './controller';
import { requireAdmin } from '@/config/middleware';

// Mock do controller
jest.mock('./controller');
const mockController = controller as jest.Mocked<typeof controller>;

// Mock do middleware
jest.mock('@/config/middleware', () => ({
  requireAdmin: jest.fn((req, res, next) => next())
}));

const app = express();
app.use(express.json());
app.use('/analytics', AnalyticsRouter);

describe('Analytics Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock das funções do controller
    mockController.getStats.mockImplementation(async (req, res) => {
      res.status(200).json({
        rooms: 10,
        bookings: 25,
        users: 15,
        week: 5,
        members: 30
      });
    });
  });

  describe('GET /', () => {
    it('should get analytics stats successfully', async () => {
      // When
      const response = await request(app)
        .get('/analytics/')
        .expect(200);

      // Then
      expect(mockController.getStats).toHaveBeenCalledTimes(1);
      expect(response.body).toEqual({
        rooms: 10,
        bookings: 25,
        users: 15,
        week: 5,
        members: 30
      });
    });

    it('should call requireAdmin middleware', async () => {
      // When
      await request(app)
        .get('/analytics/')
        .expect(200);

      // Then
      expect(requireAdmin).toHaveBeenCalledTimes(1);
    });

    it('should handle controller errors', async () => {
      // Given
      mockController.getStats.mockImplementation(async (req, res) => {
        res.status(400).json({
          message: 'Erro ao buscar estatísticas.',
          errors: 'Database connection error'
        });
      });

      // When
      const response = await request(app)
        .get('/analytics/')
        .expect(400);

      // Then
      expect(response.body).toEqual({
        message: 'Erro ao buscar estatísticas.',
        errors: 'Database connection error'
      });
    });

    it('should handle server errors', async () => {
      // Given
      mockController.getStats.mockImplementation(async (req, res) => {
        res.status(500).json({
          message: 'Erro ao obter estatísticas.'
        });
      });

      // When
      const response = await request(app)
        .get('/analytics/')
        .expect(500);

      // Then
      expect(response.body).toEqual({
        message: 'Erro ao obter estatísticas.'
      });
    });
  });

  describe('Route validation', () => {
    const routes = [
      { method: 'get', path: '/' }
    ];

    routes.forEach(route => {
      it(`should have ${route.method.toUpperCase()} ${route.path} route configured`, async () => {
        let response;
        
        switch (route.method) {
          case 'get':
            response = await request(app).get(`/analytics${route.path}`);
            break;
          default:
            throw new Error(`Unsupported method: ${route.method}`);
        }
        
        // Should not return 404 (route exists)
        expect(response.status).not.toBe(404);
      });
    });
  });
});