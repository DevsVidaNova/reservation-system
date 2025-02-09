# Gerenciamento de Reservas de Salas

## 📌 Descrição
Este é um sistema de gerenciamento de reservas de salas, desenvolvido com **Express.js** para o backend. O objetivo é permitir o agendamento e administração eficiente de salas para diferentes finalidades.

## 🚀 Tecnologias Utilizadas
- **Backend:** Node.js, Express.js, JavaScript
- **Banco de Dados:** MongoDB
- **Autenticação:** JWT

## 📁 Estrutura do Projeto (Backend)
```
/backend
├── controllers/    # Controladores para a lógica de negócio
├── routes/         # Definição das rotas da API
├── models/         # Modelos do banco de dados (se houver)
├── middlewares/    # Middlewares para autenticação, logs, etc.
├── config/         # Configurações gerais (ex: conexão com BD)
├── server.js       # Inicialização do servidor
```




## 📌 Instalação e Execução
1. Clone o repositório:
   ```bash
   git clone https://github.com/generosotiago/backagenda
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente (`.env`):
   ```
   DB_CONNECTION=<string de conexão com o banco>
   PORT=5000
   SECRET_KEY=<chave para JWT>
   ```

4. Inicie o servidor:
   ```bash
   npm start
   ```

## 📌 Contribuição
Contribuições são bem-vindas! Siga os passos:
1. Fork o repositório
2. Crie uma branch (`feature/minha-feature`)
3. Commit suas alterações (`git commit -m 'Adiciona minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

## 📜 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.


