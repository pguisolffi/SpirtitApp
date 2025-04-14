import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function NovoAtendimento() {
  const [historico, setHistorico] = useState([
    { id: 1, queixa: 'Dor de cabeça constante', resposta: 'Recomendado repouso e hidratação' },
    { id: 2, queixa: 'Sentindo-se cansado e sem energia', resposta: 'Sugerido exame de sangue' },
    { id: 3, queixa: 'Insônia frequente', resposta: 'Evitar cafeína à noite' },
    { id: 4, queixa: 'Ansiedade em situações sociais', resposta: 'Encaminhado para atendimento fraterno' },
    { id: 5, queixa: 'Falta de apetite', resposta: 'Observar alimentação e retorno em 7 dias' },
  ]);
  const [mostrarHistoricoCompleto, setMostrarHistoricoCompleto] = useState(false);
  const [novaQueixa, setNovaQueixa] = useState('');
  const [sala, setSala] = useState('');
  const [buscaPaciente, setBuscaPaciente] = useState('');

  const salas = ['Maca', 'Passe', 'Fraterno'];

  const handleSalvarAtendimento = () => {
    console.log('Atendimento salvo', { buscaPaciente, novaQueixa, sala });
  };

  const handleCadastrarPessoa = () => {
    console.log('Abrir formulário de cadastro de nova pessoa');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Novo Atendimento</Text>

      <TouchableOpacity style={styles.botaoFixo} onPress={handleCadastrarPessoa}>
        <Text style={styles.botaoTexto}>+ Nova Pessoa</Text>
      </TouchableOpacity>

      {/* Busca de paciente */}
      <TextInput
        style={styles.input}
        placeholder="pesquise pelo nome ou data de nascimento"
        value={buscaPaciente}
        onChangeText={(text) => setBuscaPaciente(text)}
      />

      {/* Nova queixa */}
      <TextInput
        style={[styles.input, styles.novaQueixa]}
        placeholder="Informações..."
        multiline
        value={novaQueixa}
        onChangeText={(text) => setNovaQueixa(text)}
      />

      {/* Histórico de queixas */}
      <View style={styles.historicoContainer}>
        <Text style={styles.subTitle}>Histórico</Text>
        {(mostrarHistoricoCompleto ? historico : historico.slice(0, 2)).map((item) => (
          <View key={item.id} style={styles.historicoItem}>
            <Text style={styles.historicoText}>{item.queixa}</Text>
            {item.resposta && (
              <Text style={styles.respostaText}>{item.resposta}</Text>
            )}
          </View>
        ))}
        {historico.length > 2 && (
          <TouchableOpacity onPress={() => setMostrarHistoricoCompleto(!mostrarHistoricoCompleto)}>
            <Text style={styles.verMais}>
              {mostrarHistoricoCompleto ? 'Ver menos' : 'Ver mais'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Seleção da sala */}
      <View style={styles.salaContainer}>
        <Text style={styles.subTitle}>Selecione a Sala</Text>
        {salas.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.salaButton,
              sala === item && styles.salaButtonSelected,
            ]}
            onPress={() => setSala(item)}
          >
            <Text
              style={[
                styles.salaButtonText,
                sala === item && styles.salaButtonTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Botões */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSalvarAtendimento}>
          <Text style={styles.buttonText}>Salvar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => console.log('Cancelando atendimento')}
        >
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: width * 0.05,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    textAlign: 'left',
    marginVertical: height * 0.03,
  },
  botaoFixo: {
    position: 'absolute',
    top: height * 0.06,  // Ajusta a distância da parte inferior da tela
    right: width * 0.05,    // Ajusta a distância da borda direita
    backgroundColor: '#007AFF', // Cor roxa semelhante ao Nubank
    paddingVertical: height * 0.010,  // Espaçamento vertical para o botão
    paddingHorizontal: width * 0.010,  // Espaçamento horizontal para o botão
    borderRadius: 30,         // Arredondamento do botão
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,             // Sombra para o botão
  },
  botaoTexto: {
    color: '#fff',   // Cor do texto dentro do botão
    fontSize: width * 0.03,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 50, // altura maior
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: height * 0.02,
    paddingLeft: width * 0.04,
    paddingVertical: 10, // espaçamento interno pra não cortar texto
  },
  novaQueixa: {
    height: height * 0.1,
    textAlignVertical: 'top',
  },
  historicoContainer: {
    marginBottom: height * 0.03,
  },
  subTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginBottom: height * 0.01,
  },
  historicoItem: {
    padding: width * 0.04,
    backgroundColor: '#f0f0f0',
    marginBottom: height * 0.01,
    borderRadius: 5,
  },
  historicoText: {
    fontSize: width * 0.04,
    color: '#333',
  },
  respostaText: {
    fontSize: width * 0.038,
    color: '#666',
    marginTop: height * 0.005,
    marginLeft: width * 0.05,
    fontStyle: 'italic',
  },
  verMais: {
    color: '#007AFF',
    fontSize: width * 0.04,
    marginTop: height * 0.01,
    textAlign: 'right',
  },
  salaContainer: {
    marginBottom: height * 0.03,
  },
  salaButton: {
    padding: width * 0.05,
    backgroundColor: 'rgba(7, 145, 209, 0.2)',
    borderRadius: 5,
    marginBottom: height * 0.015,
  },
  salaButtonSelected: {
    padding: width * 0.05,
    backgroundColor: 'rgba(7, 145, 209, 0.2)', // roxinho Nubank bem leve
    borderRadius: 8,
    marginBottom: height * 0.015,
    borderWidth: 2,
    borderColor: '#007AFF', // roxinho Nubank puro
  },
  salaButtonText: {
    color: '#000',
    fontSize: width * 0.045,
  },
  salaButtonTextSelected: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: 'rgba(17, 116, 230, 0.2)',
    padding: height * 0.015,
    borderRadius: 5,
    marginHorizontal: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A5E5BC',
  },
  cancelButton: {
    backgroundColor: '#FDDCDC',
    borderColor: '#F5A3A3',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: {
    color: '#146C43',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
});
