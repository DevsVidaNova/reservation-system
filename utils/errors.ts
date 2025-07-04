function translateError(error: any) {
    const errorMap = {
      '23505': 'Registro duplicado: já existe um membro com este dado único.',
      '23503': 'Violação de chave estrangeira: o dado referenciado não existe.',
      '23502': 'Violação de não nulo: um campo obrigatório está ausente.',
      '22P02': 'Erro de tipo de dado: formato inválido.',
     '22008': 'A data enviada está incorreta.',
    };
  
    return errorMap[error.code as keyof typeof errorMap] || 'Erro desconhecido no banco de dados.';
  }

export default translateError;