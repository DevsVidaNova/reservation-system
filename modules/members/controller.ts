import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { 
  createMemberHandler,
  getMembersHandler,
  getMemberByIdHandler,
  updateMemberHandler,
  deleteMemberHandler,
  searchMemberHandler,
  searchByFilterHandler,
  getAnalyticsHandler,
} from "./handler";

dayjs.extend(customParseFormat);

// 📌 1. Criar um novo membro
export async function createMember(req: any, res: any) {
  const { full_name, birth_date, gender, phone, email, cpf, rg } = req.body;
  
  // Validações obrigatórias
  if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
    return res.status(400).json({ error: 'Nome completo é obrigatório.' });
  }
  
  if (!birth_date || typeof birth_date !== 'string') {
    return res.status(400).json({ error: 'Data de nascimento é obrigatória.' });
  }
  
  // Validar formato da data (DD/MM/YYYY)
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(birth_date)) {
    return res.status(400).json({ error: 'Data de nascimento deve estar no formato DD/MM/YYYY.' });
  }
  
  // Validar se a data é válida
  const parsedDate = dayjs(birth_date, 'DD/MM/YYYY', true);
  if (!parsedDate.isValid()) {
    return res.status(400).json({ error: 'Data de nascimento inválida.' });
  }
  
  // Validar se não é uma data futura
  if (parsedDate.isAfter(dayjs())) {
    return res.status(400).json({ error: 'Data de nascimento não pode ser no futuro.' });
  }
  
  if (!gender || typeof gender !== 'string' || !['Masculino', 'Feminino', 'Outro'].includes(gender)) {
    return res.status(400).json({ error: 'Gênero deve ser: Masculino, Feminino ou Outro.' });
  }
  
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    return res.status(400).json({ error: 'Telefone é obrigatório.' });
  }
  
  // Validar formato do telefone (básico)
  const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'Formato de telefone inválido.' });
  }
  
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }
  
  // Validar formato do email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Formato de email inválido.' });
  }
  
  // Validar CPF se fornecido
  if (cpf && (typeof cpf !== 'string' || cpf.replace(/\D/g, '').length !== 11)) {
    return res.status(400).json({ error: 'CPF deve ter 11 dígitos.' });
  }
  
  // Validar RG se fornecido
  if (rg && (typeof rg !== 'string' || rg.trim() === '')) {
    return res.status(400).json({ error: 'RG inválido.' });
  }
  
  const result = await createMemberHandler(req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json(result.data);
}

// 📌 2. Listar todos os membros
export async function getMembers(req: any, res: any) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const result = await getMembersHandler({ page, limit });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
}

// 📌 3. Buscar um membro por ID
export async function getMemberById(req: any, res: any) {
  const { id } = req.params;
  const result = await getMemberByIdHandler(id);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  res.json(result.data);
}

// 📌 4. Atualizar um membro
export async function updateMember(req: any, res: any) {
  const { id } = req.params;
  const { full_name, birth_date, gender, phone, email, cpf, rg } = req.body;
  
  // Verificar se há dados para atualizar
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Nenhum dado fornecido para atualização.' });
  }
  
  // Validar nome se fornecido
  if (full_name !== undefined && (typeof full_name !== 'string' || full_name.trim() === '')) {
    return res.status(400).json({ error: 'Nome completo deve ser uma string não vazia.' });
  }
  
  // Validar data de nascimento se fornecida
  if (birth_date !== undefined) {
    if (typeof birth_date !== 'string') {
      return res.status(400).json({ error: 'Data de nascimento deve ser uma string.' });
    }
    
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(birth_date)) {
      return res.status(400).json({ error: 'Data de nascimento deve estar no formato DD/MM/YYYY.' });
    }
    
    const parsedDate = dayjs(birth_date, 'DD/MM/YYYY', true);
    if (!parsedDate.isValid()) {
      return res.status(400).json({ error: 'Data de nascimento inválida.' });
    }
    
    if (parsedDate.isAfter(dayjs())) {
      return res.status(400).json({ error: 'Data de nascimento não pode ser no futuro.' });
    }
  }
  
  // Validar gênero se fornecido
  if (gender !== undefined && (typeof gender !== 'string' || !['Masculino', 'Feminino', 'Outro'].includes(gender))) {
    return res.status(400).json({ error: 'Gênero deve ser: Masculino, Feminino ou Outro.' });
  }
  
  // Validar telefone se fornecido
  if (phone !== undefined) {
    if (typeof phone !== 'string' || phone.trim() === '') {
      return res.status(400).json({ error: 'Telefone deve ser uma string não vazia.' });
    }
    
    const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Formato de telefone inválido.' });
    }
  }
  
  // Validar email se fornecido
  if (email !== undefined) {
    if (typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'Email deve ser uma string não vazia.' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido.' });
    }
  }
  
  // Validar CPF se fornecido
  if (cpf !== undefined && cpf !== null && (typeof cpf !== 'string' || cpf.replace(/\D/g, '').length !== 11)) {
    return res.status(400).json({ error: 'CPF deve ter 11 dígitos.' });
  }
  
  // Validar RG se fornecido
  if (rg !== undefined && rg !== null && (typeof rg !== 'string' || rg.trim() === '')) {
    return res.status(400).json({ error: 'RG inválido.' });
  }
  
  const result = await updateMemberHandler(id, req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result.data);
}

// 📌 5. Deletar um membro
export async function deleteMember(req: any, res: any) {
  const { id } = req.params;
  const result = await deleteMemberHandler(id);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result.data);
}

// 📌 6. Pesquisar membro pelo nome
export async function searchMember(req: any, res: any) {
  const { full_name } = req.body;
  
  if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
    return res.status(400).json({ error: 'Nome é obrigatório para busca.' });
  }
  
  const result = await searchMemberHandler(full_name);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }
  res.json(result.data);
}

// 📌 7. Buscar com filtros genéricos
export async function searchByFilter(req: any, res: any) {
  const { field, value, operator } = req.body;
  
  if (!field || typeof field !== 'string' || field.trim() === '') {
    return res.status(400).json({ error: 'Campo é obrigatório.' });
  }
  
  if (value === undefined || value === null) {
    return res.status(400).json({ error: 'Valor é obrigatório.' });
  }
  
  if (!operator || typeof operator !== 'string' || operator.trim() === '') {
    return res.status(400).json({ error: 'Operador é obrigatório.' });
  }
  
  const validOperators = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike'];
  if (!validOperators.includes(operator)) {
    return res.status(400).json({ error: 'Operador inválido. Use: eq, neq, gt, gte, lt, lte, like, ilike.' });
  }
  
  const result = await searchByFilterHandler({ field, value, operator });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result.data);
}


// 📌 8. Listar estatísticas
export async function getAnalytics(req: any, res: any) {
  const result = await getAnalyticsHandler();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }
  res.json(result.data);
}

