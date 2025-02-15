const supabase = require('../config/supabaseClient');

const requireAuth = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido. Acesso restrito.' });
  }
  try {
    const { data: user, error } = await supabase.auth.getUser(token);
    if (error) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    req.role = profile.role;
    req.user = user.user;
    next();
  } catch (err) {
    console.error('Erro ao verificar autenticação:', err);
    return res.status(500).json({ error: 'Erro no servidor. Tente novamente.' });
  }
};

// Middleware para verificar se o usuário é administrador
const requireAdmin = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Obtém o token do cabeçalho

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido. Acesso restrito.' });
  }

  try {
    // Verificar o token de autenticação do usuário
    const { data: user, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    // Verificar se o usuário é administrador (usando a tabela `user_profiles`)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.user.id)
      .single();

    if (profileError || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Somente administradores podem acessar.' });
    }

    // Adiciona o usuário autenticado e o perfil ao `req`
    req.user = user;
    req.profile = profile;

    next(); // Seguir para a próxima função (rota)
  } catch (err) {
    console.error('Erro ao verificar admin:', err);
    return res.status(500).json({ error: 'Erro no servidor. Tente novamente.' });
  }
};

// Middleware para rotas públicas (sem necessidade de autenticação)
const publicRoute = (req, res, next) => {
  // Sem verificação de autenticação necessária
  next(); // Seguir para a próxima função (rota)
};

module.exports = { requireAuth, requireAdmin, publicRoute };