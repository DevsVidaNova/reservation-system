# Guia da Coleção Insomnia - Módulo Analytics

Este guia explica como usar a coleção Insomnia para testar os endpoints do módulo de analytics.

## Importando a Coleção

1. Abra o Insomnia
2. Clique em "Import/Export" > "Import Data" > "From File"
3. Selecione o arquivo `insomnia-collection.json`
4. A coleção "Analytics Module API" será importada

## Configuração de Variáveis de Ambiente

Antes de usar os endpoints, configure as seguintes variáveis:

- `base_url`: URL base da API (ex: `http://localhost:3000`)
- `jwt_token`: Token JWT obtido após o login (necessário para autenticação admin)

### Como configurar:
1. Clique no dropdown de ambiente (canto superior esquerdo)
2. Selecione "Manage Environments"
3. Edite o "Base Environment"
4. Defina os valores das variáveis

## Endpoints Disponíveis

### 1. Obter Estatísticas
- **Método**: GET
- **URL**: `/analytics/`
- **Autenticação**: Requer token de admin
- **Payload**: Nenhum
- **Resposta**:
```json
{
  "rooms": 10,
  "bookings": 25,
  "users": 15,
  "week": 5,
  "members": 30
}
```

## Validações Implementadas

### Obtenção de Estatísticas:
- Verificação de permissões de administrador
- Validação de nomes de tabelas permitidas para segurança
- Lista restrita de tabelas consultáveis: `rooms`, `bookings`, `user_profiles`, `members`
- Tratamento de erros de conexão com banco de dados
- Cálculo automático de reservas da última semana

### Segurança:
- Validação de entrada para nomes de tabelas
- Prevenção contra SQL injection através de lista de tabelas permitidas
- Verificação de tipos de dados de entrada
- Tratamento robusto de erros

## Códigos de Resposta

- **200**: Sucesso - Estatísticas obtidas com sucesso
- **400**: Erro de validação - Problema com parâmetros ou dados
- **401**: Não autorizado - Token inválido ou ausente
- **403**: Acesso negado - Usuário não tem permissões de admin
- **500**: Erro interno do servidor

## Exemplos de Erros Comuns

### Tabela não permitida:
```json
{
  "message": "Erro ao buscar estatísticas.",
  "errors": "Tabela 'invalid_table' não é permitida para consulta."
}
```

### Nome de tabela inválido:
```json
{
  "message": "Erro ao buscar estatísticas.",
  "errors": "Nome da tabela é obrigatório e deve ser uma string válida."
}
```

### Erro de conexão com banco:
```json
{
  "message": "Erro ao buscar estatísticas.",
  "errors": {
    "roomsError": "Connection timeout",
    "bookingsError": null,
    "usersError": null,
    "membersError": null
  }
}
```

### Acesso negado:
```json
{
  "error": "Acesso negado. Apenas administradores podem acessar este recurso."
}
```

## Cenários de Teste

### Fluxo Básico:
1. **Login** como administrador para obter token JWT
2. **Obter Estatísticas** do sistema
3. Verificar se todos os contadores estão corretos

### Testes de Validação:
1. Tentar acessar sem token de autenticação
2. Tentar acessar com token de usuário comum (não admin)
3. Verificar se as estatísticas são calculadas corretamente
4. Testar comportamento com banco de dados indisponível

## Estrutura da Resposta

A resposta de estatísticas contém os seguintes campos:

- `rooms`: Número total de salas cadastradas
- `bookings`: Número total de reservas no sistema
- `users`: Número total de usuários cadastrados
- `week`: Número de reservas feitas na última semana
- `members`: Número total de membros cadastrados

## Dicas de Troubleshooting

1. **Token expirado**: Faça login novamente para obter um novo token
2. **Erro 403**: Verifique se você está logado como administrador
3. **Erro de conexão**: Verifique se a API está rodando na URL configurada
4. **Estatísticas zeradas**: Verifique se há dados nas tabelas do banco
5. **Erro 500**: Verifique os logs do servidor para mais detalhes

## Notas Importantes

- Este endpoint requer permissões de administrador
- As estatísticas são calculadas em tempo real
- O cálculo de "reservas da semana" considera os últimos 7 dias
- Todas as consultas são otimizadas para performance
- O sistema possui proteções contra consultas maliciosas
- Em caso de erro em uma das consultas, o sistema retorna detalhes específicos do erro

## Monitoramento e Performance

- As consultas são executadas em paralelo para melhor performance
- Timeout padrão de 30 segundos para consultas
- Cache automático pode ser implementado para reduzir carga no banco
- Logs detalhados para troubleshooting