import {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  searchMember,
  searchByFilter,
  getAnalytics
} from './controller';
import * as handler from './handler';
import supabase from '@/config/supabaseClient';

// Mock dos handlers
jest.mock('./handler');
jest.mock('@/config/supabaseClient');

const mockHandler = handler as jest.Mocked<typeof handler>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Members Controller', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createMember', () => {
    it('deve criar um membro com sucesso', async () => {
      // Given
      const memberData = {
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      };
      const createdMember = { id: 1, ...memberData };
      mockReq.body = memberData;
      mockHandler.createMemberHandler.mockResolvedValue({ data: createdMember });

      // When
      await createMember(mockReq, mockRes);

      // Then
      expect(mockHandler.createMemberHandler).toHaveBeenCalledWith(memberData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdMember);
    });

    it('deve retornar erro quando falha na criação', async () => {
      // Given
      const memberData = { full_name: 'João Silva' };
      mockReq.body = memberData;
      mockHandler.createMemberHandler.mockResolvedValue({ error: 'Data de nascimento é obrigatória.' });

      // When
      await createMember(mockReq, mockRes);

      // Then
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Data de nascimento é obrigatória.' });
    });
  });

  describe('getMembers', () => {
    it('deve listar membros com paginação padrão', async () => {
      // Given
      const membersResult = {
        data: [{ 
          id: 1, 
          full_name: 'João Silva',
          birth_date: '01/01/1990',
          gender: 'Masculino',
          phone: '11999999999',
          email: 'joao@email.com'
        }],
        total: 1,
        page: 1,
        to: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      };
      mockHandler.getMembersHandler.mockResolvedValue({ data: membersResult });

      // When
      await getMembers(mockReq, mockRes);

      // Then
      expect(mockHandler.getMembersHandler).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(mockRes.json).toHaveBeenCalledWith({ data: membersResult });
    });

    it('deve listar membros com paginação customizada', async () => {
      // Given
      mockReq.query = { page: '2', limit: '5' };
      const membersResult = { 
        data: [], 
        total: 0, 
        page: 2, 
        to: 0, 
        totalPages: 0, 
        hasNext: false, 
        hasPrev: true 
      };
      mockHandler.getMembersHandler.mockResolvedValue({ data: membersResult });

      // When
      await getMembers(mockReq, mockRes);

      // Then
      expect(mockHandler.getMembersHandler).toHaveBeenCalledWith({ page: 2, limit: 5 });
    });

    it('deve retornar erro quando falha na busca', async () => {
      // Given
      mockHandler.getMembersHandler.mockResolvedValue({ error: 'Erro ao buscar membros.' });

      // When
      await getMembers(mockReq, mockRes);

      // Then
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro ao buscar membros.' });
    });
  });

  describe('getMemberById', () => {
    it('deve buscar membro por ID com sucesso', async () => {
      // Given
      const member = { 
        id: 1, 
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      };
      mockReq.params = { id: '1' };
      mockHandler.getMemberByIdHandler.mockResolvedValue({ data: member });

      // When
      await getMemberById(mockReq, mockRes);

      // Then
      expect(mockHandler.getMemberByIdHandler).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(member);
    });

    it('deve retornar erro quando membro não encontrado', async () => {
      // Given
      mockReq.params = { id: '999' };
      mockHandler.getMemberByIdHandler.mockResolvedValue({ error: 'Membro não encontrado.' });

      // When
      await getMemberById(mockReq, mockRes);

      // Then
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Membro não encontrado.' });
    });
  });

  describe('updateMember', () => {
    it('deve atualizar membro com sucesso', async () => {
      // Given
      const updateData = { full_name: 'João Silva Atualizado' };
      const updatedMember = { 
        id: 1, 
        full_name: 'João Silva Atualizado',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      };
      mockReq.params = { id: '1' };
      mockReq.body = updateData;
      mockHandler.updateMemberHandler.mockResolvedValue({ data: updatedMember });

      // When
      await updateMember(mockReq, mockRes);

      // Then
      expect(mockHandler.updateMemberHandler).toHaveBeenCalledWith('1', updateData);
      expect(mockRes.json).toHaveBeenCalledWith(updatedMember);
    });

    it('deve retornar erro quando falha na atualização', async () => {
      // Given
      mockReq.params = { id: '1' };
      mockReq.body = { full_name: '' };
      mockHandler.updateMemberHandler.mockResolvedValue({ error: 'Nome completo deve ser uma string não vazia.' });

      // When
      await updateMember(mockReq, mockRes);

      // Then
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Nome completo deve ser uma string não vazia.' });
    });
  });

  describe('deleteMember', () => {
    it('deve deletar membro com sucesso', async () => {
      // Given
      const deleteResult = { message: 'Membro deletado com sucesso.' };
      mockReq.params = { id: '1' };
      mockHandler.deleteMemberHandler.mockResolvedValue({ data: deleteResult });

      // When
      await deleteMember(mockReq, mockRes);

      // Then
      expect(mockHandler.deleteMemberHandler).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(deleteResult);
    });

    it('deve retornar erro quando falha na exclusão', async () => {
      // Given
      mockReq.params = { id: '999' };
      mockHandler.deleteMemberHandler.mockResolvedValue({ error: 'Erro ao deletar membro.' });

      // When
      await deleteMember(mockReq, mockRes);

      // Then
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro ao deletar membro.' });
    });
  });

  describe('searchMember', () => {
    it('deve buscar membro por nome com sucesso', async () => {
      // Given
      const members = [{ 
        id: 1, 
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      }];
      mockReq.body = { full_name: 'João' };
      mockHandler.searchMemberHandler.mockResolvedValue({ data: members });

      // When
      await searchMember(mockReq, mockRes);

      // Then
      expect(mockHandler.searchMemberHandler).toHaveBeenCalledWith('João');
      expect(mockRes.json).toHaveBeenCalledWith(members);
    });

    it('deve retornar erro quando membro não encontrado', async () => {
      // Given
      mockReq.body = { full_name: 'Inexistente' };
      mockHandler.searchMemberHandler.mockResolvedValue({ error: 'Membro não encontrado.' });

      // When
      await searchMember(mockReq, mockRes);

      // Then
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Membro não encontrado.' });
    });
  });

  describe('searchByFilter', () => {
    it('deve buscar com filtro com sucesso', async () => {
      // Given
      const members = [{ 
        id: 1, 
        full_name: 'João Silva',
        birth_date: '01/01/1990',
        gender: 'Masculino',
        phone: '11999999999',
        email: 'joao@email.com'
      }];
      const filterParams = { field: 'gender', value: 'Masculino', operator: 'eq' };
      mockReq.body = filterParams;
      mockHandler.searchByFilterHandler.mockResolvedValue({ data: members });

      // When
      await searchByFilter(mockReq, mockRes);

      // Then
      expect(mockHandler.searchByFilterHandler).toHaveBeenCalledWith(filterParams);
      expect(mockRes.json).toHaveBeenCalledWith(members);
    });

    it('deve retornar erro quando filtro inválido', async () => {
      // Given
      mockReq.body = { field: '', value: '', operator: '' };
      mockHandler.searchByFilterHandler.mockResolvedValue({ error: 'Campo é obrigatório.' });

      // When
      await searchByFilter(mockReq, mockRes);

      // Then
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Campo é obrigatório.' });
    });
  });

  /*describe('getAnalytics', () => {
    beforeEach(() => {
      // Mock do supabase
      (mockSupabase.from as jest.Mock) = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis()
      });
    });

    it('deve retornar estatísticas com sucesso', async () => {
      // Given
      const mockMembers = [
        {
          id: 1,
          full_name: 'João Silva',
          birth_date: '1990-01-01',
          gender: 'Masculino',
          marital_status: 'Solteiro',
          children_count: 0,
          city: 'São Paulo',
          state: 'SP'
        },
        {
          id: 2,
          full_name: 'Maria Santos',
          birth_date: '1985-05-15',
          gender: 'Feminino',
          marital_status: 'Casada',
          children_count: 2,
          city: 'Rio de Janeiro',
          state: 'RJ'
        }
      ];

      const mockSelect = mockSupabase.from('members').select as jest.Mock;
      mockSelect.mockResolvedValue({
        data: mockMembers,
        error: null
      });

      // When
      await getAnalytics(mockReq, mockRes);

      // Then
      expect(mockSupabase.from).toHaveBeenCalledWith('members');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          marital: expect.any(Array),
          gender: expect.any(Array),
          children: expect.any(Array),
          age: expect.any(Array),
          city: expect.any(Array),
          state: expect.any(Array)
        })
      );
    });

    it('deve retornar erro quando falha na busca de membros', async () => {
      // Given
      const mockSelect = mockSupabase.from('members').select as jest.Mock;
      mockSelect.mockResolvedValue({
        data: null,
        error: { message: 'Erro na consulta' }
      });

      // When
      await getAnalytics(mockReq, mockRes);

      // Then
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro ao buscar membros.' });
    });

    it('deve retornar erro quando ocorre exceção', async () => {
      // Given
      const mockSelect = mockSupabase.from('members').select as jest.Mock;
      mockSelect.mockRejectedValue(new Error('Erro de conexão'));

      // When
      await getAnalytics(mockReq, mockRes);

      // Then
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Erro ao buscar com filtro.' });
    });
  });
  */
});