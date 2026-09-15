export type Language = 'PT' | 'ES';

/** quantidades oferecidas na UI; o servidor aceita 1..20 */
export const QUANTIDADES_PERGUNTAS = [3, 5, 10] as const;

export interface Pergunta {
  id: number | string;
  /** posição da pergunta na sessão (1, 2, 3...) — é o número exibido */
  ordem: number;
  enunciado: string;
  respostaEsperada: string;
  topicosChave: string[];
  dificuldade: 'básica' | 'intermediária' | 'avançada' | string;
}

// dificuldade é gravada sempre em português (CHECK em questions.dificuldade e
// enum nos schemas JSON da IA), então só o rótulo exibido muda de idioma
export const DIFFICULTY_LABELS: Record<Language, Record<string, string>> = {
  PT: { 'básica': 'básica', 'intermediária': 'intermediária', 'avançada': 'avançada' },
  ES: { 'básica': 'básica', 'intermediária': 'intermedia', 'avançada': 'avanzada' },
};

export interface EvaluationData {
  correta: boolean;
  nota: number;
  feedback: string;
  pontosAcertados: string[];
  pontosFaltantes: string[];
  respostaIdeal: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  type: 'text' | 'question' | 'evaluation';
  content?: string;
  pergunta?: Pergunta;
  evaluation?: EvaluationData;
  timestamp: string;
}

export interface StudySession {
  id: string;
  title: string;
  topic: string;
  pdfName?: string;
  currentQuestion?: Pergunta;
  messages: ChatMessage[];
  updatedAt: string;
}

// As Edge Functions devolvem { code, error }: o code é estável e traduzido aqui,
// o error é a frase em português usada só como fallback.
export const ERROR_MESSAGES: Record<Language, Record<string, string>> = {
  PT: {
    NAO_AUTENTICADO: 'Sua sessão expirou. Entre novamente.',
    CAMPOS_OBRIGATORIOS: 'Faltam informações na requisição. Recarregue a página e tente de novo.',
    PDF_INVALIDO: 'O arquivo enviado não é um PDF válido.',
    PDF_MUITO_GRANDE: 'O PDF deve ter no máximo 20 MB.',
    PDF_SEM_TEXTO: 'Não foi possível extrair texto deste PDF. Ele pode ser só de imagens digitalizadas.',
    QUANTIDADE_INVALIDA: 'A quantidade de perguntas é inválida.',
    SESSAO_NAO_ENCONTRADA: 'Sessão não encontrada.',
    SESSAO_SEM_PDF: 'Esta sessão não tem um PDF processado.',
    PERGUNTA_NAO_ENCONTRADA: 'Pergunta não encontrada.',
    COTA_EXCEDIDA: 'Você fez muitas solicitações à IA em pouco tempo. Aguarde alguns minutos e tente novamente.',
    IA_SOBRECARREGADA: 'A IA está recebendo muitas solicitações agora. Aguarde um minuto e tente novamente.',
    IA_MODELO_INDISPONIVEL: 'O modelo de IA configurado não está disponível no momento. Avise a equipe.',
    IA_AUTENTICACAO: 'Falha de autenticação com o serviço de IA. Avise a equipe para verificar a chave de API.',
    IA_INDISPONIVEL: 'O serviço de IA está indisponível no momento. Tente novamente em instantes.',
    FALHA_INESPERADA: 'Não foi possível processar a solicitação agora. Tente novamente em instantes.',
  },
  ES: {
    NAO_AUTENTICADO: 'Tu sesión expiró. Vuelve a entrar.',
    CAMPOS_OBRIGATORIOS: 'Faltan datos en la solicitud. Recarga la página e inténtalo de nuevo.',
    PDF_INVALIDO: 'El archivo enviado no es un PDF válido.',
    PDF_MUITO_GRANDE: 'El PDF debe tener como máximo 20 MB.',
    PDF_SEM_TEXTO: 'No se pudo extraer texto de este PDF. Puede contener solo imágenes escaneadas.',
    QUANTIDADE_INVALIDA: 'La cantidad de preguntas no es válida.',
    SESSAO_NAO_ENCONTRADA: 'Sesión no encontrada.',
    SESSAO_SEM_PDF: 'Esta sesión no tiene un PDF procesado.',
    PERGUNTA_NAO_ENCONTRADA: 'Pregunta no encontrada.',
    COTA_EXCEDIDA: 'Hiciste muchas solicitudes a la IA en poco tiempo. Espera unos minutos e inténtalo de nuevo.',
    IA_SOBRECARREGADA: 'La IA está recibiendo muchas solicitudes ahora. Espera un minuto e inténtalo de nuevo.',
    IA_MODELO_INDISPONIVEL: 'El modelo de IA configurado no está disponible en este momento. Avisa al equipo.',
    IA_AUTENTICACAO: 'Fallo de autenticación con el servicio de IA. Avisa al equipo para revisar la clave de API.',
    IA_INDISPONIVEL: 'El servicio de IA no está disponible en este momento. Inténtalo en unos instantes.',
    FALHA_INESPERADA: 'No se pudo procesar la solicitud ahora. Inténtalo en unos instantes.',
  },
};

export const TRANSLATIONS = {
  PT: {
    appName: 'Anatomize',
    newStudy: 'Novo Estudo',
    searchChat: 'Buscar Conversa',
    history: 'HISTÓRICO',
    help: 'Ajuda',
    logout: 'Sair',
    activeSession: 'SESSÃO ATIVA',
    answerPlaceholder: 'Escreva ou grave sua resposta...',
    selectQuestionFirst: 'Selecione uma pergunta acima para responder',
    modelAnswerHeader: 'RESPOSTA IDEAL 10/10',
    showIdealAnswer: 'Mostrar resposta ideal',
    hideIdealAnswer: 'Ocultar resposta ideal',
    answerThis: 'Responder esta',
    questionCount: 'Perguntas',
    generateQuestions: 'Gerar perguntas',
    generateMore: 'Gerar mais perguntas',
    generatingMore: 'Gerando novas perguntas com IA...',
    audioRecording: 'Gravando resposta...',
    stopRecording: 'Parar e Enviar',
    processingAudio: 'Transcrevendo e avaliando resposta...',
    generatingQuestions: 'Analisando unidade e gerando perguntas com IA...',
    startTitle: 'Comece anexando o PDF da aula',
    startSubtitle: 'A IA lê o material e gera as perguntas. Depois é só responder por texto ou áudio.',
    dropzoneCta: 'Arraste o PDF aqui ou clique para escolher',
    dropzoneHint: 'Somente arquivos .pdf, até 20 MB',
    dropzoneInvalidType: 'Selecione um arquivo PDF.',
    dropzoneTooLarge: 'O PDF deve ter no máximo 20 MB.',
    attachedPdf: 'PDF da sessão',
    deleteSession: 'Excluir',
    rename: 'Renomear',
    renameHint: 'Enter para salvar, Esc para cancelar',
    confirmLogout: 'Deseja realmente sair?',
    confirmLogoutDescription: 'Você voltará para a tela de login. Suas sessões de estudo ficam salvas.',
    confirm: 'Sair',
    cancel: 'Cancelar',
    loggedInAs: 'Conectado como',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
    recordAnswer: 'Gravar resposta em voz alta',
    changeLanguage: 'Alterar idioma (Português / Espanhol)',
    closeWarning: 'Fechar aviso',
    questionBadge: 'PERGUNTA',
    answeringThis: 'Respondendo esta',
    difficulty: 'Dificuldade',
    keyTopics: 'Tópicos-chave',
    pointsCorrect: 'Pontos acertados',
    pointsMissing: 'Pontos a melhorar',
    noConversations: 'Nenhuma conversa encontrada',
    helpTitle: 'Como usar o Anatomize',
    helpStep1Title: 'Faça upload do material',
    helpStep1Desc: 'Em "Novo Estudo", arraste o PDF da sua apostila para a área central ou clique para escolher o arquivo. Cada sessão tem um PDF só.',
    helpStep2Title: 'Responda as questões',
    helpStep2Desc: 'A IA irá gerar perguntas sobre o texto. Escolha uma pergunta e responda digitando ou gravando um áudio.',
    helpStep3Title: 'Receba o feedback',
    helpStep3Desc: 'Veja sua nota, os pontos que acertou e o que faltou para a resposta ideal.',
    closeHelp: 'Entendi, vamos lá!',
    authLoginTitle: 'Entrar no Anatomize',
    authSignupTitle: 'Criar sua conta',
    authEmail: 'E-mail',
    authPassword: 'Senha',
    authDisplayName: 'Nome de exibição',
    authLoginButton: 'Entrar',
    authSignupButton: 'Criar conta',
    authToggleToSignup: 'Não tem conta? Cadastre-se',
    authToggleToLogin: 'Já tem conta? Entrar',
    authSignupSuccess: 'Conta criada! Você já pode fazer login.',
  },
  ES: {
    appName: 'Anatomize',
    newStudy: 'Nuevo Estudio',
    searchChat: 'Buscar Conversación',
    history: 'HISTORIAL',
    help: 'Ayuda',
    logout: 'Salir',
    activeSession: 'SESIÓN ACTIVA',
    answerPlaceholder: 'Escribe o graba tu respuesta...',
    selectQuestionFirst: 'Selecciona una pregunta arriba para responder',
    modelAnswerHeader: 'RESPUESTA IDEAL 10/10',
    showIdealAnswer: 'Mostrar respuesta ideal',
    hideIdealAnswer: 'Ocultar respuesta ideal',
    answerThis: 'Responder esta',
    questionCount: 'Preguntas',
    generateQuestions: 'Generar preguntas',
    generateMore: 'Generar más preguntas',
    generatingMore: 'Generando nuevas preguntas con IA...',
    audioRecording: 'Grabando respuesta...',
    stopRecording: 'Detener y Enviar',
    processingAudio: 'Transcribiendo y evaluando respuesta...',
    generatingQuestions: 'Analizando unidad y generando preguntas con IA...',
    startTitle: 'Comienza adjuntando el PDF de la clase',
    startSubtitle: 'La IA lee el material y genera las preguntas. Después solo responde por texto o audio.',
    dropzoneCta: 'Arrastra el PDF aquí o haz clic para elegir',
    dropzoneHint: 'Solo archivos .pdf, hasta 20 MB',
    dropzoneInvalidType: 'Selecciona un archivo PDF.',
    dropzoneTooLarge: 'El PDF debe tener como máximo 20 MB.',
    attachedPdf: 'PDF de la sesión',
    deleteSession: 'Eliminar',
    rename: 'Renombrar',
    renameHint: 'Enter para guardar, Esc para cancelar',
    confirmLogout: '¿Realmente deseas salir?',
    confirmLogoutDescription: 'Volverás a la pantalla de inicio de sesión. Tus sesiones de estudio quedan guardadas.',
    confirm: 'Salir',
    cancel: 'Cancelar',
    loggedInAs: 'Conectado como',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    recordAnswer: 'Grabar respuesta en voz alta',
    changeLanguage: 'Cambiar idioma (Portugués / Español)',
    closeWarning: 'Cerrar aviso',
    questionBadge: 'PREGUNTA',
    answeringThis: 'Respondiendo esta',
    difficulty: 'Dificultad',
    keyTopics: 'Tópicos clave',
    pointsCorrect: 'Puntos acertados',
    pointsMissing: 'Puntos a mejorar',
    noConversations: 'No se encontraron conversaciones',
    helpTitle: 'Cómo usar Anatomize',
    helpStep1Title: 'Sube el material',
    helpStep1Desc: 'En "Nuevo Estudio", arrastra el PDF de tu apunte al área central o haz clic para elegir el archivo. Cada sesión tiene un solo PDF.',
    helpStep2Title: 'Responde las preguntas',
    helpStep2Desc: 'La IA generará preguntas sobre el texto. Elige una pregunta y responde escribiendo o grabando un audio.',
    helpStep3Title: 'Recibe el feedback',
    helpStep3Desc: 'Ve tu nota, los puntos correctos y lo que faltó para la respuesta ideal.',
    closeHelp: '¡Entendido, vamos!',
    authLoginTitle: 'Entrar a Anatomize',
    authSignupTitle: 'Crear tu cuenta',
    authEmail: 'Correo electrónico',
    authPassword: 'Contraseña',
    authDisplayName: 'Nombre para mostrar',
    authLoginButton: 'Entrar',
    authSignupButton: 'Crear cuenta',
    authToggleToSignup: '¿No tienes cuenta? Regístrate',
    authToggleToLogin: '¿Ya tienes cuenta? Entrar',
    authSignupSuccess: '¡Cuenta creada! Ya puedes iniciar sesión.',
  },
};
