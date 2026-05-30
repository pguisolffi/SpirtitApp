import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, useWindowDimensions, Image, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../screens/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { APP_NOME } from '../constants/AppBranding';
import { podeGerenciarModulo } from '../constants/Perfis';

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
  const [userProfile, setUserProfile] = useState('');
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user?.email) {
        try {
          // 1. Obter nome do usuário do bzmpessoa
          const qPessoa = query(collection(db, 'bzmpessoa'), where('email', '==', user.email));
          const snapshotPessoa = await getDocs(qPessoa);
          if (!snapshotPessoa.empty) {
            const dados = snapshotPessoa.docs[0].data();
            const nomeCompleto = dados.nome || 'Usuário';
            const primeiro = nomeCompleto.split(' ')[0];
            setUserName(primeiro);
          }

          // 2. Obter perfil e permissões do bzmusuario
          const qUsuario = query(collection(db, 'bzmusuario'), where('uid', '==', user.uid));
          const snapshotUsuario = await getDocs(qUsuario);
          if (!snapshotUsuario.empty) {
            const dadosUsuario = snapshotUsuario.docs[0].data();
            setUserProfile(dadosUsuario.perfil || '');
            setUserPermissions(dadosUsuario.permissoes || []);
          }
        } catch (err) {
          console.error('Erro ao buscar dados do usuário no ScreenWrapper:', err);
        } finally {
          setPermissionsLoaded(true);
        }
      } else {
        setUserName('Usuário');
        setUserProfile('');
        setUserPermissions([]);
        setPermissionsLoaded(true);
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

  const pathPermissionMap = {
    '/Rota_NovoAtendimento': 'atendimento',
    '/Rota_FilaDeEsperaScreen': 'fila',
    '/Rota_AgendaScreen': 'eventos',
    '/Rota_EscalaVoluntarios': 'voluntarios',
    '/Rota_Livros': 'biblioteca',
    '/Rota_LeitorPDFScreen': 'biblioteca',
    '/Rota_OracoesScreen': 'oracoes',
    '/Rota_OracaoViewerScreen': 'oracoes',
    '/Rota_CursosPalestrasScreen': 'cursos',
    '/Rota_VideoViewerScreen': 'cursos',
    '/Rota_GerenciarUsuariosScreen': 'usuarios',
    '/Rota_GerenciarPessoaScreen': 'pessoas',
  };

  const requiredPermission = pathPermissionMap[currentPath];
  const isAuthorized = !requiredPermission || podeGerenciarModulo(userProfile, userPermissions, requiredPermission);

  const filteredSidebarLinks = sidebarLinks.filter(link => {
    const reqPerm = pathPermissionMap[link.route];
    return !reqPerm || podeGerenciarModulo(userProfile, userPermissions, reqPerm);
  });

  const filteredAdminLinks = adminLinks.filter(link => {
    const reqPerm = pathPermissionMap[link.route];
    return !reqPerm || podeGerenciarModulo(userProfile, userPermissions, reqPerm);
  });

  if (!permissionsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#6A5ACD" />
      </View>
    );
  }

  const renderAccessDenied = () => (
    <View style={styles.deniedContainer}>
      <Ionicons name="lock-closed-outline" size={64} color="#dc2626" />
      <Text style={styles.deniedTitle}>Acesso Negado</Text>
      <Text style={styles.deniedMessage}>
        Você não possui permissão para acessar esta funcionalidade.
      </Text>
      <TouchableOpacity style={styles.deniedButton} onPress={() => router.replace('/Rota_HomeFuncionario')}>
        <Text style={styles.deniedButtonText}>Voltar ao Painel</Text>
      </TouchableOpacity>
    </View>
  );

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
            {filteredSidebarLinks.map((link) => {
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
            {filteredAdminLinks.map((link) => {
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
              {!isAuthorized ? renderAccessDenied() : children}
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
        {!isAuthorized ? renderAccessDenied() : children}
      </ContainerComponent>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  deniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 16,
  },
  deniedMessage: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 8,
    marginBottom: 24,
  },
  deniedButton: {
    backgroundColor: '#6A5ACD',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  deniedButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
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
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginVertical: 40,
    alignSelf: 'center',
  },
  deniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  deniedMessage: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
    lineHeight: 22,
  },
  deniedButton: {
    backgroundColor: '#6A5ACD',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#6A5ACD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  deniedButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
