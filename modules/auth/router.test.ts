import request from 'supertest';
import express from 'express';
import AuthRouter from './router';
import * as controller from './controller';
import * as middleware from '@/config/middleware';

// Mock do controller
jest.mock('./controller');
const mockController = controller as jest.Mocked<typeof controller>;

// Mock do middleware
jest.mock('@/config/middleware');
const mockMiddleware = middleware as jest.Mocked<typeof middleware>;

describe('Auth Router', () => {
  let app: express.Application;
  let mockRequireAdmin: jest.Mock;
  let mockPublicRoute: jest.Mock;
  let mockRequireAuth: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    
    // Setup middleware mocks
    mockRequireAdmin = jest.fn((req, res, next) => {
      req.user = { id: 'admin-123' };
      req.role = 'admin';
      next();
    });
    
    mockPublicRoute = jest.fn((req, res, next) => {
      next();
    });
    
    mockRequireAuth = jest.fn((req, res, next) => {
      req.user = { id: 'user-123' };
      req.role = 'user';
      next();
    });
    
    mockMiddleware.requireAdmin.mockImplementation(mockRequireAdmin);
    mockMiddleware.publicRoute.mockImplementation(mockPublicRoute);
    mockMiddleware.requireAuth.mockImplementation(mockRequireAuth);
    
    // Setup controller mocks
    mockController.signUpUser.mockImplementation(async (req, res) => {
      res.status(201).json({ message: 'Usuário registrado com sucesso' });
    });
    
    mockController.loginUser.mockImplementation(async (req, res) => {
      res.json({ session: { access_token: 'token123' }, profile: { name: 'Test User' } });
    });
    
    mockController.getUserProfile.mockImplementation(async (req, res) => {
      res.json({ id: 'profile-123', name: 'Test User' });
    });
    
    mockController.updateUserProfile.mockImplementation(async (req, res) => {
      res.json({ message: 'Perfil atualizado com sucesso' });
    });
    
    mockController.deleteUser.mockImplementation(async (req, res) => {
      res.json({ message: 'Usuário excluído com sucesso' });
    });
    
    mockController.logout.mockImplementation(async (req, res) => {
      res.json({ message: 'Logout realizado com sucesso' });
    });
    
    app.use('/auth', AuthRouter);
  });

  describe('POST /register', () => {
    it('should register user successfully with admin access', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
        phone: '123456789'
      };
      
      const response = await request(app)
        .post('/auth/register')
        .send(userData);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ message: 'Usuário registrado com sucesso' });
      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.signUpUser).toHaveBeenCalled();
    });

    it('should apply requireAdmin middleware', async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'test@test.com', password: 'password123', name: 'Test User' });
      
      expect(mockRequireAdmin).toHaveBeenCalled();
    });
  });

  describe('POST /login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@test.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/auth/login')
        .send(loginData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        session: { access_token: 'token123' },
        profile: { name: 'Test User' }
      });
      expect(mockPublicRoute).toHaveBeenCalled();
      expect(mockController.loginUser).toHaveBeenCalled();
    });

    it('should apply publicRoute middleware', async () => {
      await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });
      
      expect(mockPublicRoute).toHaveBeenCalled();
    });
  });

  describe('DELETE /delete', () => {
    it('should delete user successfully with authentication', async () => {
      const response = await request(app)
        .delete('/auth/delete');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Usuário excluído com sucesso' });
      expect(mockRequireAuth).toHaveBeenCalled();
      expect(mockController.deleteUser).toHaveBeenCalled();
    });

    it('should apply requireAuth middleware', async () => {
      await request(app)
        .delete('/auth/delete');
      
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });

  describe('GET /profile', () => {
    it('should get user profile successfully with authentication', async () => {
      const response = await request(app)
        .get('/auth/profile');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'profile-123', name: 'Test User' });
      expect(mockRequireAuth).toHaveBeenCalled();
      expect(mockController.getUserProfile).toHaveBeenCalled();
    });

    it('should get user profile with query parameter', async () => {
      const response = await request(app)
        .get('/auth/profile?id=user-456');
      
      expect(response.status).toBe(200);
      expect(mockRequireAuth).toHaveBeenCalled();
      expect(mockController.getUserProfile).toHaveBeenCalled();
    });

    it('should apply requireAuth middleware', async () => {
      await request(app)
        .get('/auth/profile');
      
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });

  describe('PUT /edit', () => {
    it('should update user profile successfully with authentication', async () => {
      const updateData = {
        name: 'Updated User',
        phone: '987654321'
      };
      
      const response = await request(app)
        .put('/auth/edit')
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Perfil atualizado com sucesso' });
      expect(mockRequireAuth).toHaveBeenCalled();
      expect(mockController.updateUserProfile).toHaveBeenCalled();
    });

    it('should apply requireAuth middleware', async () => {
      await request(app)
        .put('/auth/edit')
        .send({ name: 'Updated User' });
      
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });

  describe('POST /logout', () => {
    it('should logout user successfully with authentication', async () => {
      const response = await request(app)
        .post('/auth/logout');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Logout realizado com sucesso' });
      expect(mockRequireAuth).toHaveBeenCalled();
      expect(mockController.logout).toHaveBeenCalled();
    });

    it('should apply requireAuth middleware', async () => {
      await request(app)
        .post('/auth/logout');
      
      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });

  describe('Middleware Integration', () => {
    it('should apply correct middleware for each route', async () => {
      // Test all routes to ensure middleware is applied
      await request(app).post('/auth/register').send({});
      await request(app).post('/auth/login').send({});
      await request(app).delete('/auth/delete');
      await request(app).get('/auth/profile');
      await request(app).put('/auth/edit').send({});
      await request(app).post('/auth/logout');
      
      expect(mockRequireAdmin).toHaveBeenCalledTimes(1); // only /register
      expect(mockPublicRoute).toHaveBeenCalledTimes(1); // only /login
      expect(mockRequireAuth).toHaveBeenCalledTimes(4); // /delete, /profile, /edit, /logout
    });

    it('should handle JSON body parsing', async () => {
      const testData = { test: 'data' };
      
      await request(app)
        .post('/auth/register')
        .send(testData);
      
      expect(mockController.signUpUser).toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle controller errors for register', async () => {
      mockController.signUpUser.mockImplementation(async (req, res) => {
        res.status(400).json({ error: 'Email já existe' });
      });
      
      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'test@test.com', password: 'password123', name: 'Test User' });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Email já existe' });
    });

    it('should handle controller errors for login', async () => {
      mockController.loginUser.mockImplementation(async (req, res) => {
        res.status(401).json({ error: 'Credenciais inválidas' });
      });
      
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' });
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Credenciais inválidas' });
    });

    it('should handle controller errors for profile operations', async () => {
      mockController.getUserProfile.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Usuário não encontrado' });
      });
      
      const response = await request(app)
        .get('/auth/profile');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Usuário não encontrado' });
    });
  });
});