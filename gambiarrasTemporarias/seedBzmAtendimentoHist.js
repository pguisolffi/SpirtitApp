import { db } from '../screens/firebaseConfig'; // Ajuste o caminho conforme necessário
import { collection, doc, writeBatch,setDoc  } from 'firebase/firestore';

/*const seedBzmLivro = async () => {
  const livros = [
    {
      id: '1',
      titulo: 'A Alma dos Animais',
      autor: 'Ernesto Bozzano',
      linkPDF: 'https://drive.google.com/uc?export=download&id=1Zkk-TinLYp8Ni6rSF0judez3_ZqX3Unn',
    },
    {
      id: '2',
      titulo: 'Nosso Lar',
      autor: 'André Luiz',
      linkPDF: 'https://drive.google.com/uc?export=download&id=1Zkk-TinLYp8Ni6rSF0judez3_ZqX3Unn',
    },
  ];

  try {
    for (const livro of livros) {
      await setDoc(doc(db, 'bzmLivro', livro.id), livro);
      console.log(`Livro ${livro.titulo} inserido com sucesso.`);
    }
    alert('Livros inseridos com sucesso!');
  } catch (error) {
    console.error('Erro ao inserir livros:', error);
    alert('Erro ao criar seed de livros.');
  }
};

export default seedBzmLivro;*/