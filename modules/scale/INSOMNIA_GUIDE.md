# Guia da Coleção Insomnia - Módulo Scale

Este guia explica como importar e usar a coleção Insomnia para testar os endpoints do módulo de escalas do sistema CBVN.

## 📥 Como Importar

1. Abra o Insomnia
2. Clique em **"Import/Export"** → **"Import Data"** → **"From File"**
3. Selecione o arquivo `insomnia-collection.json`
4. A coleção **"CBVN - Scale Module"** será criada

## ⚙️ Configuração das Variáveis de Ambiente

Antes de usar os endpoints, configure as seguintes variáveis:

- **`base_url`**: URL base da API (ex: `http://localhost:3000/api`)
- **`jwt_token`**: Token JWT para autenticação (obtido no login)
- **`scale_id`**: ID de uma escala existente para testes

### Como configurar:
1. Clique no ambiente **"Base Environment"**
2. Edite as variáveis com seus valores reais
3. Salve as alterações

## 🔐 Autenticação

**IMPORTANTE**: Todos os endpoints requerem autenticação!

- **Admin**: Criar, atualizar, deletar, buscar e duplicar escalas
- **Usuário autenticado**: Listar e buscar escalas por ID

## 📋 Endpoints Disponíveis

### 1. **Criar Escala** `POST /scale`
- **Autenticação**: Admin
- **Payload de exemplo**:
```json
{
  "date": "25/12/2024",
  "name": "Escala de Natal",
  "band": "1",
  "projection": "João Silva",
  "light": "Maria Santos",
  "transmission": "Pedro Costa",
  "camera": "Ana Oliveira",
  "live": "Carlos Lima",
  "sound": "Lucia Ferreira",
  "training_sound": "Roberto Alves",
  "photography": "Fernanda Rocha",
  "stories": "Gabriel Mendes",
  "dynamic": "Juliana Barbosa",
  "direction": "1"
}
```

### 2. **Listar Escalas** `GET /scale`
- **Autenticação**: Usuário autenticado
- **Parâmetros de query**:
  - `page`: Número da página (padrão: 1)
  - `pageSize`: Itens por página (padrão: 15)

### 3. **Buscar Escala por ID** `GET /scale/:id`
- **Autenticação**: Usuário autenticado
- **Parâmetro**: `scale_id` na URL

### 4. **Atualizar Escala** `PUT /scale/:id`
- **Autenticação**: Admin
- **Parâmetro**: `scale_id` na URL
- **Payload de exemplo**:
```json
{
  "name": "Escala de Ano Novo",
  "projection": "João Silva Atualizado",
  "light": "Maria Santos Atualizada"
}
```

### 5. **Deletar Escala** `DELETE /scale/:id`
- **Autenticação**: Admin
- **Parâmetro**: `scale_id` na URL

### 6. **Buscar Escala por Nome** `PUT /scale/search`
- **Autenticação**: Admin
- **Payload de exemplo**:
```json
{
  "name": "Natal"
}
```

### 7. **Duplicar Escala** `POST /scale/duplicate/:id`
- **Autenticação**: Admin
- **Parâmetro**: `scale_id` na URL

## ✅ Validações Implementadas

### Criação de Escala:
- ✅ Campos obrigatórios: `date`, `name`, `direction`
- ✅ Formato de data: DD/MM/YYYY
- ✅ Data não pode ser no passado
- ✅ Nome deve ter pelo menos 3 caracteres
- ✅ Verificação de nomes duplicados

### Atualização de Escala:
- ✅ Escala deve existir
- ✅ Verificação de nomes duplicados (se alterando nome)
- ✅ Validação de campos opcionais

### Busca:
- ✅ Nome não pode estar vazio
- ✅ Verificação de existência da escala

## 📊 Códigos de Resposta

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Erro de validação
- **401**: Não autorizado
- **403**: Acesso negado (não é admin)
- **404**: Escala não encontrada
- **500**: Erro interno do servidor

## 🚨 Exemplos de Erros Comuns

### Erro de Validação (400):
```json
{
  "error": "Nome é obrigatório."
}
```

### Escala Não Encontrada (404):
```json
{
  "error": "Escala não encontrada."
}
```

### Nome Duplicado (400):
```json
{
  "error": "Já existe uma escala com este nome."
}
```

### Não Autorizado (401):
```json
{
  "error": "Token inválido."
}
```

## 🧪 Cenários de Teste Sugeridos

1. **Fluxo Completo**:
   - Criar escala → Listar → Buscar por ID → Atualizar → Duplicar → Deletar

2. **Validações**:
   - Tentar criar escala sem campos obrigatórios
   - Tentar criar escala com nome duplicado
   - Tentar atualizar escala inexistente
   - Tentar buscar com nome vazio

3. **Autenticação**:
   - Testar endpoints sem token
   - Testar endpoints de admin com usuário comum

## 🔧 Troubleshooting

### Problema: "Token inválido"
- **Solução**: Verifique se o `jwt_token` está correto e não expirou

### Problema: "Escala não encontrada"
- **Solução**: Verifique se o `scale_id` existe no banco de dados

### Problema: "Acesso negado"
- **Solução**: Certifique-se de que o usuário tem permissões de admin

### Problema: Erro de conexão
- **Solução**: Verifique se a API está rodando e se o `base_url` está correto

---

**Dica**: Use a funcionalidade de "Environment" do Insomnia para alternar entre diferentes ambientes (desenvolvimento, produção, etc.).