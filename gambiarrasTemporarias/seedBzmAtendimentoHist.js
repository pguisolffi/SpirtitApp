import { db } from '../screens/firebaseConfig'; // Ajuste o caminho conforme necessário
import { collection, doc, writeBatch } from 'firebase/firestore';

const seedBzmAtendimentoHist = async (idPaciente) => {
  const historicoMock = [
    {
      data_hora: new Date(2024, 3, 1, 9, 15),
      queixa: 'Dor de cabeça intensa',
      orientacao_recebida: 'Orientado a fazer repouso e hidratação, prescrito analgésico.',
      sala_atendida: 'Maca',
      orientador: 'Alcione',
      id_paciente: idPaciente,
    },
    {
      data_hora: new Date(2024, 3, 5, 14, 30),
      queixa: 'Tontura ao levantar',
      orientacao_recebida: 'Realizados testes de glicemia. Orientado a se alimentar melhor e voltar se persistir.',
      sala_atendida: 'Maca',
      orientador: 'Roberto',
      id_paciente: idPaciente,
    },
    {
      data_hora: new Date(2024, 3, 12, 11, 0),
      queixa: 'Retorno para avaliação',
      orientacao_recebida: 'Avaliação positiva. Paciente sem sintomas. Liberado.',
      sala_atendida: 'Passe',
      orientador: 'Daniel',
      id_paciente: idPaciente,
    },
  ];

  try {
    const batch = writeBatch(db);
    const collectionRef = collection(db, 'bzmAtendimentoHist');

    historicoMock.forEach((docData) => {
      const docRef = doc(collectionRef);
      batch.set(docRef, docData);
    });

    await batch.commit();
    console.log(`✅ Mock inserido em 'bzmAtendimentoHist' para paciente ${idPaciente}`);
  } catch (error) {
    console.error('Erro ao inserir dados mock:', error);
  }
};

export default seedBzmAtendimentoHist;
