import supabase from './supabaseClient';
import { RequestHandler } from 'express';

// 📌 1. Necessita de autenticacao
const requireAuth: RequestHandler = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Token não fornecido. Acesso restrito.' });
    return 
  }
  try {
    const { data: user, error } = await supabase.auth.getUser(token);
    if (error) {
      res.status(401).json({ error: 'Token inválido ou expirado.' });
      return 
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    (req as any).profile = profile;
    (req as any).role = profile.role;
    (req as any).user = user.user;
    next();
  } catch (err) {
    console.error('Erro ao verificar autenticação:', err);
    res.status(500).json({ error: 'Erro no servidor. Tente novamente.' });
    return 
  }
};

// 📌 2. Apenas admin pode acessar
const requireAdmin: RequestHandler = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token não fornecido. Acesso restrito.' });
    return 
  }

  try {
    const { data: user, error } = await supabase.auth.getUser(token);

    if (error) {
      res.status(401).json({ error: 'Token inválido ou expirado.' });
      return 
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.user.id)
      .single();

    if (profileError || profile.role !== 'admin') {
      res.status(403).json({ error: 'Acesso negado. Somente administradores podem acessar.' });
      return 
    }

    (req as any).user = user.user;
    (req as any).profile = profile;

    next(); 
  } catch (err) {
    console.error('Erro ao verificar admin:', err);
    res.status(500).json({ error: 'Erro no servidor. Tente novamente.' });
    return 
  }
};

// 📌 3. Sem necessidade de autenticao
const publicRoute: RequestHandler = (req, res, next) => {
  next(); 
};

export { requireAuth, requireAdmin, publicRoute };