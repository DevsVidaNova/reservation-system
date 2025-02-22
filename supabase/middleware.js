const supabase = require('../config/supabaseClient');



// 📌 1. Necessita de autenticacao
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

    req.profile = profile;
    req.role = profile.role;
    req.user = user.user;
    next();
  } catch (err) {
    console.error('Erro ao verificar autenticação:', err);
    return res.status(500).json({ error: 'Erro no servidor. Tente novamente.' });
  }
};


// 📌 2. Apenas admin pode acessar
const requireAdmin = async (req, res, next) => {
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
      .select('role')
      .eq('user_id', user.user.id)
      .single();

    if (profileError || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Somente administradores podem acessar.' });
    }

    req.user = user;
    req.profile = profile;

    next(); 
  } catch (err) {
    console.error('Erro ao verificar admin:', err);
    return res.status(500).json({ error: 'Erro no servidor. Tente novamente.' });
  }
};

// 📌 3. Sem necessidade de autenticao
const publicRoute = (req, res, next) => {
  // Sem verificação de autenticação necessária
  next(); // Seguir para a próxima função (rota)
};

module.exports = { requireAuth, requireAdmin, publicRoute };