import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, useWindowDimensions, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../screens/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { APP_NOME } from '../constants/AppBranding';

export default function ScreenWrapper({
  children,
  title,
  showBackButton = true,
  showHeader = true,
  scrollable = true,
}) {
  const router = useRouter();
  const currentPath = usePathname();
  const { width: winWidth } = useWindowDimensions();
  const [userName, setUserName] = useState('Usuário');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user?.email) {
        try {
          const q = query(collection(db, 'bzmpessoa'), where('email', '==', user.email));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const dados = snapshot.docs[0].data();
            const nomeCompleto = dados.nome || 'Usuário';
            const primeiro = nomeCompleto.split(' ')[0];
            setUserName(primeiro);
          }
        } catch (err) {
          console.error('Erro ao buscar nome no Firestore:', err);
        }
      } else {
        setUserName('Usuário');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/Rota_HomeFuncionario');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
  };

  const handleNavigate = (route) => {
    router.push(route);
  };

  const isActive = (route) => currentPath === route;

  const ContainerComponent = scrollable ? ScrollView : View;

  const isWebDesktop = Platform.OS === 'web' && winWidth > 768;

  const sidebarLinks = [
    { label: 'Painel', icon: 'grid-outline', route: '/Rota_HomeFuncionario' },
    { label: 'Novo Atendimento', icon: 'person-add-outline', route: '/Rota_NovoAtendimento' },
    { label: 'Fila de Espera', icon: 'people-outline', route: '/Rota_FilaDeEsperaScreen' },
    { label: 'Próximos Eventos', icon: 'calendar-outline', route: '/Rota_AgendaScreen' },
    { label: 'Escala de Voluntários', icon: 'list-circle-outline', route: '/Rota_EscalaVoluntarios' },
    { label: 'Biblioteca', icon: 'library-outline', route: '/Rota_Livros' },
    { label: 'Orações', icon: 'heart-outline', route: '/Rota_OracoesScreen' },
    { label: 'Cursos e Palestras', icon: 'book-outline', route: '/Rota_CursosPalestrasScreen' },
  ];

  const adminLinks = [
    { label: 'Minha Conta', icon: 'person-outline', route: '/Rota_ContaScreen' },
    { label: 'Gerenciar Usuários', icon: 'settings-outline', route: '/Rota_GerenciarUsuariosScreen' },
    { label: 'Gerenciar Pessoas', icon: 'people-circle-outline', route: '/Rota_GerenciarPessoaScreen' },
  ];

  if (isWebDesktop) {
    if (!showHeader) {
      return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          {children}
        </View>
      );
    }

    return (
      <View style={styles.webMainLayout}>
        {/* LEFT SIDEBAR */}
        <View style={styles.webSidebar}>
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle} numberOfLines={2}>
              {APP_NOME}
            </Text>
          </View>

          {/* Sidebar Links */}
          <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.sidebarSectionTitle}>MENU PRINCIPAL</Text>
            {sidebarLinks.map((link) => {
              const active = isActive(link.route);
              return (
                <TouchableOpacity
                  key={link.route}
                  style={[styles.sidebarLink, active && styles.sidebarLinkActive]}
                  onPress={() => handleNavigate(link.route)}
                >
                  <Ionicons
                    name={link.icon}
                    size={20}
                    color={active ? '#fff' : '#94a3b8'}
                  />
                  <Text style={[styles.sidebarLinkText, active && styles.sidebarLinkTextActive]}>
                    {link.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.sidebarDivider} />

            <Text style={styles.sidebarSectionTitle}>ADMINISTRAÇÃO</Text>
            {adminLinks.map((link) => {
              const active = isActive(link.route);
              return (
                <TouchableOpacity
                  key={link.route}
                  style={[styles.sidebarLink, active && styles.sidebarLinkActive]}
                  onPress={() => handleNavigate(link.route)}
                >
                  <Ionicons
                    name={link.icon}
                    size={20}
                    color={active ? '#fff' : '#94a3b8'}
                  />
                  <Text style={[styles.sidebarLinkText, active && styles.sidebarLinkTextActive]}>
                    {link.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* User Profile / Logout */}
          <View style={styles.sidebarProfile}>
            <Text style={styles.profileGreeting}>Olá, {userName}!</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
              <Text style={styles.logoutBtnText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* RIGHT CONTENT AREA */}
        <View style={styles.webContentArea}>
          {/* Top Header */}
          <View style={styles.webContentHeader}>
            <View style={styles.webHeaderLeft}>
              {showBackButton && (
                <TouchableOpacity onPress={handleBack} style={styles.webBackButton}>
                  <Ionicons name="arrow-back" size={18} color="#6A5ACD" />
                  <Text style={styles.webBackButtonText}>Voltar</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.webPageTitle} numberOfLines={2}>
                {title}
              </Text>
            </View>
          </View>

          {/* Actual Screen Content */}
          <ContainerComponent
            style={scrollable ? styles.webContentScroll : styles.webContentFlex}
            contentContainerStyle={scrollable ? styles.webContentContainer : undefined}
          >
            <View style={scrollable ? styles.webCard : styles.webCardFlex}>
              {children}
            </View>
          </ContainerComponent>
        </View>
      </View>
    );
  }

  // Mobile layout (standard screen options)
  return (
    <SafeAreaView style={styles.mobileContainer}>
      {showHeader && (
        <View style={styles.mobileHeader}>
          {showBackButton && (
            <TouchableOpacity onPress={handleBack} style={styles.mobileBack}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          )}
          <Text style={styles.mobileTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
      )}
      <ContainerComponent style={{ flex: 1 }}>
        {children}
      </ContainerComponent>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  webMainLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  webSidebar: {
    width: 280,
    backgroundColor: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  brandLogo: {
    width: 36,
    height: 36,
    marginRight: 12,
  },
  brandTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarSectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  sidebarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sidebarLinkActive: {
    backgroundColor: '#6A5ACD',
  },
  sidebarLinkText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  sidebarLinkTextActive: {
    color: '#ffffff',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 16,
  },
  sidebarProfile: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 16,
  },
  profileGreeting: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  webContentArea: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#f8fafc',
  },
  webContentHeader: {
    height: 70,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  webHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 16,
  },
  webBackButtonText: {
    color: '#6A5ACD',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
  webPageTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 22,
  },
  webContentScroll: {
    flex: 1,
    width: '100%',
  },
  webContentFlex: {
    flex: 1,
    width: '100%',
  },
  webContentContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  webCard: {
    width: '100%',
    maxWidth: 1100,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  webCardFlex: {
    flex: 1,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    marginVertical: 32,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: '#f2f4f8',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mobileBack: {
    marginRight: 16,
  },
  mobileTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 20,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    width: '100%',
    height: '100%',
  },
});
