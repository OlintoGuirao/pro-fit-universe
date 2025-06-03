import { updateTrainerCodes } from './updateTrainerCodes';

console.log('Iniciando atualização dos códigos dos professores...');
updateTrainerCodes()
  .then(() => {
    console.log('Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro durante a execução:', error);
    process.exit(1);
  }); 