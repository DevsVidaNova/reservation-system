const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Executa Jest apenas para gerar relatório de cobertura dos arquivos existentes
  const result = execSync('npx jest --coverage --testMatch="<rootDir>/non-existent-test.js" --passWithNoTests', {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log(result);
} catch (error) {
  // Mesmo com erro, o relatório de cobertura pode ter sido gerado
  console.log(error.stdout || error.message);
}