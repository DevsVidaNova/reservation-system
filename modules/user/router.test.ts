import request from 'supertest';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import UserRouter from './router';
import * as userController from './controller';

// Mock do controller
jest.mock('./controller');
const mockController = userController as jest.Mocked<typeof userController>;

// Mock do middleware
jest.mock('@/config/middleware', () => ({
  requireAdmin: jest.fn()
}));

import { requireAdmin } from '@/config/middleware';
const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;

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

describe('User Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', UserRouter);
    
    jest.clearAllMocks();
    
    // Reset mocks to default implementations
    mockRequireAdmin.mockImplementation((req: Request, res: Response, next: NextFunction): void => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token não fornecido' });
        return;
      }
      
      (req as any).user = { id: 'admin-123', role: 'admin' };
      (req as any).profile = { id: '1', name: 'Admin User', role: 'admin' };
      (req as any).role = 'admin';
      next();
    });
    
    // Reset controller mocks to default implementations
    mockController.createUser.mockImplementation(async (req: Request, res: Response) => {
      res.status(201).json({ message: 'Usuário criado' });
    });
    
    mockController.listUsers.mockImplementation(async (req: Request, res: Response) => {
      res.status(200).json({ data: [], total: 0 });
    });
    
    mockController.listUsersScale.mockImplementation(async (req: Request, res: Response) => {
      res.status(200).json([]);
    });
    
    mockController.showUser.mockImplementation(async (req: Request, res: Response) => {
      res.status(200).json({ id: req.params.id });
    });
    
    mockController.updateUser.mockImplementation(async (req: Request, res: Response) => {
      res.status(200).json({ message: 'Usuário atualizado' });
    });
    
    mockController.deleteUser.mockImplementation(async (req: Request, res: Response) => {
      res.status(200).json({ message: 'Usuário deletado' });
    });
  });

  describe('POST /', () => {
    it('deve criar usuário com sucesso', async () => {
      const newUser = {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        role: 'user',
        user_id: 'user-123',
        email: 'joao@email.com'
      };
      
      mockController.createUser.mockImplementation(async (req: Request, res: Response) => {
        res.status(201).json({
          message: 'Usuário criado com sucesso.',
          user: newUser
        });
      });

      const response = await request(app)
        .post('/users')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'João Silva',
          phone: '11999999999',
          email: 'joao@email.com',
          password: 'senha123',
          role: 'user'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Usuário criado com sucesso.');
      expect(response.body.user).toEqual(newUser);
      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.createUser).toHaveBeenCalled();
    });

    it('deve retornar 401 quando token não fornecido', async () => {
      const response = await request(app)
        .post('/users')
        .send({
          name: 'João Silva',
          email: 'joao@email.com'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token não fornecido');
      expect(mockController.createUser).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando dados inválidos', async () => {
      mockController.createUser.mockImplementation(async (req: Request, res: Response) => {
        res.status(400).json({ error: 'Dados inválidos.' });
      });

      const response = await request(app)
        .post('/users')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'João Silva'
          // faltando dados obrigatórios
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Dados inválidos.');
    });
  });

  describe('GET /', () => {
    it('deve listar usuários com sucesso', async () => {
      const mockUsers = {
        data: [{ id: '1', name: 'João' }],
        total: 1,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      };
      
      mockController.listUsers.mockImplementation(async (req: Request, res: Response) => {
        res.status(200).json(mockUsers);
      });

      const response = await request(app)
        .get('/users')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.listUsers).toHaveBeenCalled();
    });

    it('deve listar usuários com paginação', async () => {
      const mockUsers = {
        data: [{ id: '1', name: 'João' }],
        total: 1,
        page: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: true
      };
      
      mockController.listUsers.mockImplementation(async (req: Request, res: Response) => {
        res.status(200).json(mockUsers);
      });

      const response = await request(app)
        .get('/users?page=2&limit=5')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
    });

    it('deve retornar 401 quando token não fornecido', async () => {
      const response = await request(app).get('/users');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token não fornecido');
      expect(mockController.listUsers).not.toHaveBeenCalled();
    });
  });

  describe('GET /scale', () => {
    it('deve listar usuários para escala com sucesso', async () => {
      const mockUsers = [
        { id: '1', name: 'João', role: 'user' },
        { id: '2', name: 'Maria', role: 'admin' }
      ];
      
      mockController.listUsersScale.mockImplementation(async (req: Request, res: Response) => {
        res.status(200).json(mockUsers);
      });

      const response = await request(app)
        .get('/users/scale')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.listUsersScale).toHaveBeenCalled();
    });

    it('deve retornar 401 quando token não fornecido', async () => {
      const response = await request(app).get('/users/scale');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token não fornecido');
      expect(mockController.listUsersScale).not.toHaveBeenCalled();
    });
  });

  describe('GET /:id', () => {
    it('deve mostrar usuário específico com sucesso', async () => {
      const mockUser = {
        id: '1',
        name: 'João Silva',
        phone: '11999999999',
        role: 'user',
        user_id: 'user-123',
        email: 'joao@email.com'
      };
      
      mockController.showUser.mockImplementation(async (req: Request, res: Response) => {
        res.status(200).json(mockUser);
      });

      const response = await request(app)
        .get('/users/1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.showUser).toHaveBeenCalled();
    });

    it('deve retornar 404 quando usuário não encontrado', async () => {
      mockController.showUser.mockImplementation(async (req: Request, res: Response) => {
        res.status(404).json({ message: 'Usuário não encontrado' });
      });

      const response = await request(app)
        .get('/users/999')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Usuário não encontrado');
    });

    it('deve retornar 401 quando token não fornecido', async () => {
      const response = await request(app).get('/users/1');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token não fornecido');
      expect(mockController.showUser).not.toHaveBeenCalled();
    });
  });

  describe('PUT /:id', () => {
    it('deve atualizar usuário com sucesso', async () => {
      const updatedUser = {
        id: '1',
        name: 'João Silva Atualizado',
        phone: '11888888888',
        role: 'admin',
        user_id: 'user-123',
        email: 'joao.novo@email.com'
      };
      
      mockController.updateUser.mockImplementation(async (req: Request, res: Response) => {
        res.status(200).json({
          message: 'Perfil atualizado com sucesso',
          profile: updatedUser
        });
      });

      const response = await request(app)
        .put('/users/user-123')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'João Silva Atualizado',
          phone: '11888888888',
          email: 'joao.novo@email.com',
          role: 'admin'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Perfil atualizado com sucesso');
      expect(response.body.profile).toEqual(updatedUser);
      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.updateUser).toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando dados inválidos', async () => {
      mockController.updateUser.mockImplementation(async (req: Request, res: Response) => {
        res.status(400).json({ error: 'Usuário não encontrado.' });
      });

      const response = await request(app)
        .put('/users/999')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'João' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Usuário não encontrado.');
    });

    it('deve retornar 401 quando token não fornecido', async () => {
      const response = await request(app)
        .put('/users/1')
        .send({ name: 'João' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token não fornecido');
      expect(mockController.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /:id', () => {
    it('deve deletar usuário com sucesso', async () => {
      mockController.deleteUser.mockImplementation(async (req: Request, res: Response) => {
        res.status(200).json({ message: 'Usuário e perfil excluídos com sucesso.' });
      });

      const response = await request(app)
        .delete('/users/user-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Usuário e perfil excluídos com sucesso.');
      expect(mockRequireAdmin).toHaveBeenCalled();
      expect(mockController.deleteUser).toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando usuário não encontrado', async () => {
      mockController.deleteUser.mockImplementation(async (req: Request, res: Response) => {
        res.status(400).json({ error: 'Erro ao deletar usuário' });
      });

      const response = await request(app)
        .delete('/users/999')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Erro ao deletar usuário');
    });

    it('deve retornar 401 quando token não fornecido', async () => {
      const response = await request(app).delete('/users/1');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token não fornecido');
      expect(mockController.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('Middleware Integration', () => {
    it('deve aplicar requireAdmin a todas as rotas', async () => {
      // Testa POST
      await request(app)
        .post('/users')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test' });
      
      // Testa GET
      await request(app)
        .get('/users')
        .set('Authorization', 'Bearer valid-token');
      
      // Testa GET /scale
      await request(app)
        .get('/users/scale')
        .set('Authorization', 'Bearer valid-token');
      
      // Testa GET /:id
      await request(app)
        .get('/users/1')
        .set('Authorization', 'Bearer valid-token');
      
      // Testa PUT /:id
      await request(app)
        .put('/users/1')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test' });
      
      // Testa DELETE /:id
      await request(app)
        .delete('/users/1')
        .set('Authorization', 'Bearer valid-token');

      expect(mockRequireAdmin).toHaveBeenCalledTimes(6);
    });

    it('deve processar JSON no body das requisições', async () => {
      const userData = {
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        password: 'senha123'
      };

      mockController.createUser.mockImplementation(async (req: Request, res: Response) => {
        expect(req.body).toEqual(userData);
        res.status(201).json({ message: 'Usuário criado' });
      });

      const response = await request(app)
        .post('/users')
        .set('Authorization', 'Bearer valid-token')
        .send(userData);

      expect(response.status).toBe(201);
    });

    it('deve capturar parâmetros de rota corretamente', async () => {
      const userId = 'user-123';

      mockController.showUser.mockImplementation(async (req: Request, res: Response) => {
        expect(req.params.id).toBe(userId);
        res.status(200).json({ id: userId });
      });

      const response = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
    });
  });
});