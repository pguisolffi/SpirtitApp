import { db } from '../screens/firebaseConfig'; // Ajuste o caminho conforme necessário
import { collection, doc, writeBatch,setDoc  } from 'firebase/firestore';

export default async function dev() {
  const livro1Ref = doc(db, 'bzmLivro', '1'); // ID = "1"
  const livro2Ref = doc(db, 'bzmLivro', '2'); // ID = "2"

 /* await setDoc(livro1Ref, {
    titulo: "A Alma dos Animais",
    autor: "Ernesto Bozzano",

    temPDF: true,
    linkPDF: "https://drive.google.com/uc?export=download&id=1Zkk-TinLYp8Ni6rSF0judez3_ZqX3Unn",

    emprestimoDisponivel: true,
    emprestado: false,
    emprestadoPara: "",
    dataEmprestimo: "",
    dataDevolucaoPrevista: "",

    vendaDisponivel: false,
    precoVenda: 0,
    estoque: 0
  });

  await setDoc(livro2Ref, {
    titulo: "Nosso Lar",
    autor: "André Luiz",

    temPDF: true,
    linkPDF: "https://drive.google.com/uc?export=download&id=1Zkk-TinLYp8Ni6rSF0judez3_ZqX3Unn",

    emprestimoDisponivel: true,
    emprestado: false,
    emprestadoPara: "",
    dataEmprestimo: "",
    dataDevolucaoPrevista: "",

    vendaDisponivel: true,
    precoVenda: 25,
    estoque: 3
  });*/

  console.log("📚 Livros atualizados com sucesso!");
}