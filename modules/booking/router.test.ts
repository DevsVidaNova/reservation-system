import { Router } from "express";
import request from 'supertest';
import express from 'express';
import BookingRouter from './router';
import * as controller from './controller';
import { requireAuth, requireAdmin, publicRoute } from '../../config/middleware';

// Mock dos middlewares
jest.mock('../../config/middleware', () => ({
  requireAuth: jest.fn((req, res, next) => {
    req.user = { id: 'user-123' };
    req.profile = { id: 'profile-123' };
    req.role = 'user';
    next();
  }),
  requireAdmin: jest.fn((req, res, next) => {
    req.user = { id: 'admin-123' };
    req.profile = { id: 'admin-profile-123' };
    req.role = 'admin';
    next();
  }),
  publicRoute: jest.fn((req, res, next) => next())
}));

// Mock do controller
jest.mock('./controller', () => ({
  createBooking: jest.fn((req, res) => res.status(201).json({ success: true })),
  getBooking: jest.fn((req, res) => res.status(200).json({ bookings: [] })),
  getBookingById: jest.fn((req, res) => res.status(200).json({ booking: {} })),
  updateBooking: jest.fn((req, res) => res.status(200).json({ success: true })),
  deleteBooking: jest.fn((req, res) => res.status(200).json({ success: true })),
  getBookingByFilter: jest.fn((req, res) => res.status(200).json({ bookings: [] })),
  getBookingMy: jest.fn((req, res) => res.status(200).json({ bookings: [] })),
  getBookingsByToday: jest.fn((req, res) => res.status(200).json({ bookings: [] })),
  getBookingsByWeek: jest.fn((req, res) => res.status(200).json({ bookings: [] })),
  searchBookingsByDescription: jest.fn((req, res) => res.status(200).json({ bookings: [] }))
}));

describe('Booking Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/booking', BookingRouter);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /booking', () => {
    it('deve criar uma nova reserva com autenticação', async () => {
      const bookingData = {
        description: 'Reunião de equipe',
        room: 1,
        date: '15/01/2024',
        start_time: '09:00',
        end_time: '10:00'
      };

      const response = await request(app)
        .post('/booking')
        .send(bookingData)
        .expect(201);

      expect(requireAuth).toHaveBeenCalled();
      expect(controller.createBooking).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true });
    });
  });

  describe('GET /booking', () => {
    it('deve listar reservas como rota pública', async () => {
      const response = await request(app)
        .get('/booking')
        .expect(200);

      expect(publicRoute).toHaveBeenCalled();
      expect(controller.getBooking).toHaveBeenCalled();
      expect(response.body).toEqual({ bookings: [] });
    });
  });

  describe('GET /booking/search', () => {
    it('deve buscar reservas por descrição com autenticação', async () => {
      const response = await request(app)
        .get('/booking/search')
        .query({ description: 'reunião' })
        .expect(200);

      expect(requireAuth).toHaveBeenCalled();
      expect(controller.searchBookingsByDescription).toHaveBeenCalled();
      expect(response.body).toEqual({ bookings: [] });
    });
  });

  describe('GET /booking/my', () => {
    it('deve listar reservas do usuário com autenticação', async () => {
      const response = await request(app)
        .get('/booking/my')
        .expect(200);

      expect(requireAuth).toHaveBeenCalled();
      expect(controller.getBookingMy).toHaveBeenCalled();
      expect(response.body).toEqual({ bookings: [] });
    });
  });

  describe('GET /booking/today', () => {
    it('deve listar reservas de hoje como rota pública', async () => {
      const response = await request(app)
        .get('/booking/today')
        .expect(200);

      expect(publicRoute).toHaveBeenCalled();
      expect(controller.getBookingsByToday).toHaveBeenCalled();
      expect(response.body).toEqual({ bookings: [] });
    });
  });

  describe('GET /booking/week', () => {
    it('deve listar reservas da semana como rota pública', async () => {
      const response = await request(app)
        .get('/booking/week')
        .expect(200);

      expect(publicRoute).toHaveBeenCalled();
      expect(controller.getBookingsByWeek).toHaveBeenCalled();
      expect(response.body).toEqual({ bookings: [] });
    });
  });

  describe('POST /booking/filter', () => {
    it('deve filtrar reservas com autenticação', async () => {
      const response = await request(app)
        .post('/booking/filter')
        .send({ room: 1 })
        .expect(200);

      expect(requireAuth).toHaveBeenCalled();
      expect(controller.getBookingByFilter).toHaveBeenCalled();
      expect(response.body).toEqual({ bookings: [] });
    });
  });

  describe('GET /booking/:id', () => {
    it('deve obter reserva por ID como rota pública', async () => {
      const response = await request(app)
        .get('/booking/123')
        .expect(200);

      expect(publicRoute).toHaveBeenCalled();
      expect(controller.getBookingById).toHaveBeenCalled();
      expect(response.body).toEqual({ booking: {} });
    });
  });

  describe('PUT /booking/:id', () => {
    it('deve atualizar reserva com autenticação de admin', async () => {
      const updateData = {
        description: 'Reunião atualizada'
      };

      const response = await request(app)
        .put('/booking/123')
        .send(updateData)
        .expect(200);

      expect(requireAdmin).toHaveBeenCalled();
      expect(controller.updateBooking).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true });
    });
  });

  describe('DELETE /booking/:id', () => {
    it('deve deletar reserva com autenticação e admin', async () => {
      const response = await request(app)
        .delete('/booking/123')
        .expect(200);

      expect(requireAuth).toHaveBeenCalled();
      expect(requireAdmin).toHaveBeenCalled();
      expect(controller.deleteBooking).toHaveBeenCalled();
      expect(response.body).toEqual({ success: true });
    });
  });

  describe('Middleware Integration', () => {
    it('deve aplicar requireAuth nas rotas protegidas', async () => {
      // POST /booking
      jest.clearAllMocks();
      await request(app).post('/booking').send({});
      expect(requireAuth).toHaveBeenCalled();

      // GET /booking/search
      jest.clearAllMocks();
      await request(app).get('/booking/search');
      expect(requireAuth).toHaveBeenCalled();

      // GET /booking/my
      jest.clearAllMocks();
      await request(app).get('/booking/my');
      expect(requireAuth).toHaveBeenCalled();

      // POST /booking/filter
      jest.clearAllMocks();
      await request(app).post('/booking/filter').send({});
      expect(requireAuth).toHaveBeenCalled();

      // DELETE /booking/123
      jest.clearAllMocks();
      await request(app).delete('/booking/123');
      expect(requireAuth).toHaveBeenCalled();
    });

    it('deve aplicar requireAdmin nas rotas administrativas', async () => {
      // PUT /booking/123
      jest.clearAllMocks();
      await request(app).put('/booking/123').send({});
      expect(requireAdmin).toHaveBeenCalled();

      // DELETE /booking/123
      jest.clearAllMocks();
      await request(app).delete('/booking/123');
      expect(requireAdmin).toHaveBeenCalled();
    });

    it('deve aplicar publicRoute nas rotas públicas', async () => {
      // GET /booking
      jest.clearAllMocks();
      await request(app).get('/booking');
      expect(publicRoute).toHaveBeenCalled();

      // GET /booking/today
      jest.clearAllMocks();
      await request(app).get('/booking/today');
      expect(publicRoute).toHaveBeenCalled();

      // GET /booking/week
      jest.clearAllMocks();
      await request(app).get('/booking/week');
      expect(publicRoute).toHaveBeenCalled();

      // GET /booking/123
      jest.clearAllMocks();
      await request(app).get('/booking/123');
      expect(publicRoute).toHaveBeenCalled();
    });
  });

  describe('Route Order', () => {
    it('deve priorizar rota /search sobre /:id', async () => {
      await request(app)
        .get('/booking/search')
        .query({ description: 'test' })
        .expect(200);

      expect(controller.searchBookingsByDescription).toHaveBeenCalled();
      expect(controller.getBookingById).not.toHaveBeenCalled();
    });

    it('deve priorizar rota /my sobre /:id', async () => {
      await request(app)
        .get('/booking/my')
        .expect(200);

      expect(controller.getBookingMy).toHaveBeenCalled();
      expect(controller.getBookingById).not.toHaveBeenCalled();
    });

    it('deve priorizar rota /today sobre /:id', async () => {
      await request(app)
        .get('/booking/today')
        .expect(200);

      expect(controller.getBookingsByToday).toHaveBeenCalled();
      expect(controller.getBookingById).not.toHaveBeenCalled();
    });

    it('deve priorizar rota /week sobre /:id', async () => {
      await request(app)
        .get('/booking/week')
        .expect(200);

      expect(controller.getBookingsByWeek).toHaveBeenCalled();
      expect(controller.getBookingById).not.toHaveBeenCalled();
    });

    it('deve chamar /:id quando ID numérico é fornecido', async () => {
      await request(app)
        .get('/booking/123')
        .expect(200);

      expect(controller.getBookingById).toHaveBeenCalled();
    });
  });

  describe('Request Body and Query Parameters', () => {
    it('deve aceitar JSON no body para POST', async () => {
      const bookingData = {
        description: 'Test booking',
        room: 1,
        date: '15/01/2024',
        start_time: '09:00',
        end_time: '10:00'
      };

      await request(app)
        .post('/booking')
        .send(bookingData)
        .expect(201);

      expect(controller.createBooking).toHaveBeenCalled();
    });

    it('deve aceitar JSON no body para PUT', async () => {
      const updateData = {
        description: 'Updated booking'
      };

      await request(app)
        .put('/booking/123')
        .send(updateData)
        .expect(200);

      expect(controller.updateBooking).toHaveBeenCalled();
    });

    it('deve aceitar query parameters para GET /search', async () => {
      await request(app)
        .get('/booking/search')
        .query({ description: 'test query' })
        .expect(200);

      expect(controller.searchBookingsByDescription).toHaveBeenCalled();
    });

    it('deve aceitar body para POST /filter', async () => {
      await request(app)
        .post('/booking/filter')
        .send({ room: 1, date: '15/01/2024' })
        .expect(200);

      expect(controller.getBookingByFilter).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('deve retornar 404 para métodos não permitidos', async () => {
      await request(app)
        .patch('/booking/123')
        .expect(404);
    });

    it('deve tratar rotas inexistentes como /:id', async () => {
      await request(app)
        .get('/booking/nonexistent')
        .expect(200);

      expect(controller.getBookingById).toHaveBeenCalled();
    });
  });
});
