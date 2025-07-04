import translateError from './errors';

describe('translateError', () => {
  it('deve traduzir erro de registro duplicado (23505)', () => {
    const error = { code: '23505' };
    const result = translateError(error);
    expect(result).toBe('Registro duplicado: já existe um membro com este dado único.');
  });

  it('deve traduzir erro de chave estrangeira (23503)', () => {
    const error = { code: '23503' };
    const result = translateError(error);
    expect(result).toBe('Violação de chave estrangeira: o dado referenciado não existe.');
  });

  it('deve traduzir erro de campo obrigatório (23502)', () => {
    const error = { code: '23502' };
    const result = translateError(error);
    expect(result).toBe('Violação de não nulo: um campo obrigatório está ausente.');
  });

  it('deve traduzir erro de tipo de dado (22P02)', () => {
    const error = { code: '22P02' };
    const result = translateError(error);
    expect(result).toBe('Erro de tipo de dado: formato inválido.');
  });

  it('deve traduzir erro de data incorreta (22008)', () => {
    const error = { code: '22008' };
    const result = translateError(error);
    expect(result).toBe('A data enviada está incorreta.');
  });

  it('deve retornar mensagem padrão para código desconhecido', () => {
    const error = { code: '99999' };
    const result = translateError(error);
    expect(result).toBe('Erro desconhecido no banco de dados.');
  });

  it('deve lidar com erro sem código', () => {
    const error = {};
    const result = translateError(error);
    expect(result).toBe('Erro desconhecido no banco de dados.');
  });


});