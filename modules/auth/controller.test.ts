import { signUpUser, loginUser, getUserProfile, updateUserProfile, deleteUser, logout } from './controller';
import * as handler from './handler';

// Mock do handler
jest.mock('./handler', () => ({
  signUpUserHandler: jest.fn(),
  loginUserHandler: jest.fn(),
  getUserProfileHandler: jest.fn(),
  updateUserProfileHandler: jest.fn(),
  deleteUserHandler: jest.fn(),
  logoutHandler: jest.fn()
}));

const mockHandler = handler as jest.Mocked<typeof handler>;

describe('Auth Controller', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      body: {},
      query: {},
      user: { id: 'user-123' },
      role: 'user'
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Default mocks
    mockHandler.signUpUserHandler.mockResolvedValue({ 
      user: { id: 'user-123', email: 'test@test.com' },
      profile: { id: 'profile-123', name: 'Test User', phone: '1234567890' }
    });
    mockHandler.loginUserHandler.mockResolvedValue({ 
      session: { access_token: 'token123' }, 
      profile: { id: 'profile-123', name: 'Test User' } 
    });
    mockHandler.getUserProfileHandler.mockResolvedValue({ 
      profileData: { id: 'profile-123', name: 'Test User', email: 'test@test.com' } 
    });
    mockHandler.updateUserProfileHandler.mockResolvedValue({ 
      profile: { id: 'profile-123', name: 'Updated User', phone: '123456789' } 
    });
    mockHandler.deleteUserHandler.mockResolvedValue({ success: true });
    mockHandler.logoutHandler.mockResolvedValue({ success: true });
  });

  describe('signUpUser', () => {
    it('should create user successfully', async () => {
      req.body = { email: 'test@test.com', password: 'password123', name: 'Test User', phone: '1234567890' };
      
      await signUpUser(req, res);
      
      expect(mockHandler.signUpUserHandler).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuário registrado com sucesso',
        user: { id: 'user-123', email: 'test@test.com' },
        profile: { id: 'profile-123', name: 'Test User', phone: '1234567890' }
      });
    });

    it('should return 400 when required fields are missing', async () => {
      req.body = { email: 'test@test.com' }; // missing password and name
      
      await signUpUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Campos obrigatórios ausentes.' });
      expect(mockHandler.signUpUserHandler).not.toHaveBeenCalled();
    });

    it('should return 400 when handler returns error', async () => {
      req.body = { email: 'test@test.com', password: 'password123', name: 'Test User' };
      mockHandler.signUpUserHandler.mockResolvedValue({ error: { message: 'Email já existe' } });
      
      await signUpUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email já existe' });
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      req.body = { email: 'test@test.com', password: 'password123' };
      
      await loginUser(req, res);
      
      expect(mockHandler.loginUserHandler).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123'
      });
      expect(res.json).toHaveBeenCalledWith({
        session: { access_token: 'token123' },
        profile: { id: 'profile-123', name: 'Test User' }
      });
    });

    it('should return 400 when email or password is missing', async () => {
      req.body = { email: 'test@test.com' }; // missing password
      
      await loginUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email e senha são obrigatórios.' });
      expect(mockHandler.loginUserHandler).not.toHaveBeenCalled();
    });

    it('should return 401 when handler returns error', async () => {
      req.body = { email: 'test@test.com', password: 'wrongpassword' };
      mockHandler.loginUserHandler.mockResolvedValue({ error: { message: 'Credenciais inválidas' } });
      
      await loginUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciais inválidas' });
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully with user ID from query', async () => {
      req.query.id = 'user-123';
      req.role = 'admin';
      
      await getUserProfile(req, res);
      
      expect(mockHandler.getUserProfileHandler).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({
        id: 'profile-123',
        name: 'Test User',
        email: 'test@test.com'
      });
    });

    it('should get user profile successfully with user ID from req.user', async () => {
      req.user.id = 'user-123';
      
      await getUserProfile(req, res);
      
      expect(mockHandler.getUserProfileHandler).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({
        id: 'profile-123',
        name: 'Test User',
        email: 'test@test.com'
      });
    });

    it('should return 400 when user ID is not found', async () => {
      req.query = {};
      req.user = {};
      
      await getUserProfile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'ID do usuário não encontrado.' });
      expect(mockHandler.getUserProfileHandler).not.toHaveBeenCalled();
    });

    it('should return 403 when non-admin tries to access other user profile', async () => {
      req.query.id = 'other-user-123';
      req.user.id = 'user-123';
      req.role = 'user';
      
      await getUserProfile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Acesso restrito. Somente administradores podem acessar perfis de outros usuários.' 
      });
      expect(mockHandler.getUserProfileHandler).not.toHaveBeenCalled();
    });

    it('should return 400 when handler returns error', async () => {
      req.query.id = 'user-123';
      req.role = 'admin';
      mockHandler.getUserProfileHandler.mockResolvedValue({ error: { message: 'Usuário não encontrado' } });
      
      await getUserProfile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuário não encontrado' });
    });
  });
/*
  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      req.query.id = 'profile-123';
      req.body = { name: 'Updated User', phone: '987654321' };
      req.role = 'admin';
      
      await updateUserProfile(req, res);
      console.log(res.json)
      
      expect(mockHandler.updateUserProfileHandler).toHaveBeenCalledWith('profile-123', {
        name: 'Updated User',
        phone: '987654321'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Perfil atualizado com sucesso',
        profile: { id: 'profile-123', name: 'Updated User', phone: '123456789' }
      });
    });

    it('should return 400 when user ID is not found', async () => {
      req.query = {};
      req.user = {};
      
      await updateUserProfile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'ID do usuário não encontrado.' });
      expect(mockHandler.updateUserProfileHandler).not.toHaveBeenCalled();
    });

    it('should return 403 when non-admin tries to update other user profile', async () => {
      req.query.id = 'other-user-123';
      req.user.id = 'user-123';
      req.role = 'user';
      
      await updateUserProfile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Acesso restrito. Somente administradores podem acessar perfis de outros usuários.' 
      });
      expect(mockHandler.updateUserProfileHandler).not.toHaveBeenCalled();
    });

    it('should return 400 when handler returns error', async () => {
      req.query.id = 'user-123';
      req.body = { name: 'Updated User' };
      req.role = 'admin';
      mockHandler.updateUserProfileHandler.mockResolvedValue({ error: { message: 'Erro ao atualizar' } });
      
      await updateUserProfile(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao atualizar' });
    });
  });
  */
  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      req.user.id = 'user-123';
      
      await deleteUser(req, res);
      
      expect(mockHandler.deleteUserHandler).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário e perfil excluídos com sucesso.' });
    });

    it('should return 400 when user ID is not found', async () => {
      req.user = {};
      
      await deleteUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'ID do usuário não encontrado.' });
      expect(mockHandler.deleteUserHandler).not.toHaveBeenCalled();
    });

    it('should return 400 when handler returns error', async () => {
      req.user.id = 'user-123';
      mockHandler.deleteUserHandler.mockResolvedValue({ error: { message: 'Erro ao excluir usuário' } });
      
      await deleteUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao excluir usuário' });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await logout(req, res);
      
      expect(mockHandler.logoutHandler).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Logout realizado com sucesso.' });
    });

    it('should return 400 when handler returns error', async () => {
      mockHandler.logoutHandler.mockResolvedValue({ error: { message: 'Erro ao fazer logout' } });
      
      await logout(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao fazer logout' });
    });
  });
});