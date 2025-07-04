import request from 'supertest';
import express from 'express';
import MembersRouter from './router';
import * as controller from './controller';
import { requireAdmin } from '@/config/middleware';

// Mock do controller e middleware
jest.mock('./controller');
jest.mock('@/config/middleware');

const mockController = controller as jest.Mocked<typeof controller>;
const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;

// Configuração do app de teste
const app = express();
app.use(express.json());
app.use('/members', MembersRouter);

describe('Members Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock do middleware requireAdmin para permitir todas as requisições
    mockRequireAdmin.mockImplementation((req, res, next) => next());
    
    // Mock das funções do controller
    mockController.createMember.mockImplementation(async (req, res) => {
      res.status(201).json({ 
        id: 1, 
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      });
    });
    
    mockController.getMembers.mockImplementation(async (req, res) => {
      res.json({ data: [{ 
        id: 1, 
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      }] });
    });
    
    mockController.getMemberById.mockImplementation(async (req, res) => {
      res.json({ 
        id: 1, 
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      });
    });
    
    mockController.updateMember.mockImplementation(async (req, res) => {
      res.json({ 
        id: 1, 
        full_name: 'João Silva Atualizado',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      });
    });
    
    mockController.deleteMember.mockImplementation(async (req, res) => {
      res.json({ message: 'Membro deletado com sucesso.' });
    });
    
    mockController.searchMember.mockImplementation(async (req, res) => {
      res.json([{ 
        id: 1, 
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      }]);
    });
    
    mockController.searchByFilter.mockImplementation(async (req, res) => {
      res.json([{ 
        id: 1, 
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      }]);
    });
  });

  describe('POST /', () => {
    it('deve criar um novo membro', async () => {
      // Given
      const memberData = {
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      };

      // When
      const response = await request(app)
        .post('/members')
        .send(memberData);

      // Then
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ 
        id: 1, 
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      });
      expect(mockController.createMember).toHaveBeenCalled();
      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it('deve aplicar middleware requireAdmin', async () => {
      // When
      await request(app)
        .post('/members')
        .send({ full_name: 'Test' });

      // Then
      expect(mockRequireAdmin).toHaveBeenCalled();
    });
  });

  describe('GET /', () => {
    it('deve listar todos os membros', async () => {
      // When
      const response = await request(app)
        .get('/members');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [{ 
        id: 1, 
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      }] });
      expect(mockController.getMembers).toHaveBeenCalled();
      expect(mockRequireAdmin).toHaveBeenCalled();
    });

    it('deve listar membros com parâmetros de paginação', async () => {
      // When
      const response = await request(app)
        .get('/members?page=2&limit=5');

      // Then
      expect(response.status).toBe(200);
      expect(mockController.getMembers).toHaveBeenCalled();
    });
  });

  describe('GET /:id', () => {
    it('deve buscar membro por ID', async () => {
      // When
      const response = await request(app)
        .get('/members/1');

      // Then
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ 
          id: 1, 
          full_name: 'João Silva',
          birth_date: '01/01/1990',
          gender: 'Masculino',
          phone: '11999999999',
          email: 'joao@email.com'
        });
        expect(mockController.getMemberById).toHaveBeenCalled();
        expect(mockRequireAdmin).toHaveBeenCalled();
    });
  });

  describe('PUT /:id', () => {
    it('deve atualizar um membro', async () => {
      // Given
      const updateData = { full_name: 'João Silva Atualizado' };

      // When
      const response = await request(app)
        .put('/members/1')
        .send(updateData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ 
        id: 1, 
        full_name: 'João Silva Atualizado',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      });
      expect(mockController.updateMember).toHaveBeenCalled();
      expect(mockRequireAdmin).toHaveBeenCalled();
    });
  });

  describe('DELETE /:id', () => {
    it('deve deletar um membro', async () => {
      // When
      const response = await request(app)
        .delete('/members/1');

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Membro deletado com sucesso.' });
      expect(mockController.deleteMember).toHaveBeenCalled();
      expect(mockRequireAdmin).toHaveBeenCalled();
    });
  });

  describe('POST /search', () => {
    it('deve buscar membro por nome', async () => {
      // Given
      const searchData = { full_name: 'João' };

      // When
      const response = await request(app)
        .post('/members/search')
        .send(searchData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ 
        id: 1, 
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      }]);
      expect(mockController.searchMember).toHaveBeenCalled();
      expect(mockRequireAdmin).toHaveBeenCalled();
    });
  });

  describe('POST /filter', () => {
    it('deve buscar membros com filtro', async () => {
      // Given
      const filterData = {
        field: 'gender',
        value: 'Masculino',
        operator: 'eq'
      };

      // When
      const response = await request(app)
        .post('/members/filter')
        .send(filterData);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ 
        id: 1, 
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      }]);
      expect(mockController.searchByFilter).toHaveBeenCalled();
      expect(mockRequireAdmin).toHaveBeenCalled();
    });
  });

  describe('Middleware Tests', () => {
    it('deve aplicar requireAdmin em todas as rotas', async () => {
      // Given
      const routes = [
        { method: 'post', path: '/members', data: { full_name: 'Test' } },
        { method: 'get', path: '/members' },
        { method: 'get', path: '/members/1' },
        { method: 'put', path: '/members/1', data: { full_name: 'Test' } },
        { method: 'delete', path: '/members/1' },
        { method: 'post', path: '/members/search', data: { full_name: 'Test' } },
        { method: 'post', path: '/members/filter', data: { field: 'test', value: 'test', operator: 'eq' } }
      ];

      // When & Then
      for (const route of routes) {
        jest.clearAllMocks();
        
        let response;
        switch (route.method) {
          case 'post':
            response = await request(app).post(route.path).send(route.data);
            break;
          case 'get':
            response = await request(app).get(route.path);
            break;
          case 'put':
            response = await request(app).put(route.path).send(route.data);
            break;
          case 'delete':
            response = await request(app).delete(route.path);
            break;
        }
        
        expect(mockRequireAdmin).toHaveBeenCalled();
      }
    });
  });

  describe('Error Handling', () => {
    it('deve lidar com erros do controller createMember', async () => {
      // Given
      mockController.createMember.mockImplementation(async (req, res) => {
        res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      });

      // When
      const response = await request(app)
        .post('/members')
        .send({ full_name: '' });

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Campos obrigatórios ausentes.' });
    });

    it('deve lidar com erros do controller getMemberById', async () => {
      // Given
      mockController.getMemberById.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Membro não encontrado.' });
      });

      // When
      const response = await request(app)
        .get('/members/999');

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Membro não encontrado.' });
    });

    it('deve lidar com erros do controller searchMember', async () => {
      // Given
      mockController.searchMember.mockImplementation(async (req, res) => {
        res.status(404).json({ error: 'Membro não encontrado.' });
      });

      // When
      const response = await request(app)
        .post('/members/search')
        .send({ full_name: 'Inexistente' });

      // Then
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Membro não encontrado.' });
    });

    it('deve lidar com erros do controller searchByFilter', async () => {
      // Given
      mockController.searchByFilter.mockImplementation(async (req, res) => {
        res.status(400).json({ error: 'Parâmetros inválidos.' });
      });

      // When
      const response = await request(app)
        .post('/members/filter')
        .send({ field: '', value: '', operator: '' });

      // Then
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Parâmetros inválidos.' });
    });
  });
});