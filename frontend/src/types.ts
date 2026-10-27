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

export interface SessionSummaryStats {
  totalPerguntas: number;
  totalRespondidas: number;
  acertos: number;
  erros: number;
  notaMedia: number;
  pontosFaltantes: string[];
  pontosAcertados: string[];
  isCompleto: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  type: 'text' | 'question' | 'evaluation';
  content?: string;
  pergunta?: Pergunta;
  evaluation?: EvaluationData;
  /** pergunta a que a mensagem pertence: a própria (question) ou a respondida (text/evaluation) */
  questionId?: string;
  timestamp: string;
}

/** id do bloco da pergunta no DOM; o trilho de navegação e o scroll automático usam o mesmo */
export const idDoBlocoPergunta = (perguntaId: number | string) => `q-${perguntaId}`;

export interface GrupoPergunta {
  pergunta: Pergunta;
  /** respostas do aluno e avaliações desta pergunta, em ordem cronológica */
  respostas: ChatMessage[];
}

/**
 * Agrupa o chat por pergunta: cada pergunta vem seguida das respostas e avaliações
 * que apontam para ela. Mensagens sem pergunta correspondente (resposta cuja
 * avaliação falhou, histórico antigo) vão em `orfas` para nunca sumirem da tela.
 */
export function agruparPorPergunta(messages: ChatMessage[]): { grupos: GrupoPergunta[]; orfas: ChatMessage[] } {
  const grupos: GrupoPergunta[] = [];
  const porId = new Map<string, GrupoPergunta>();

  for (const msg of messages) {
    if (msg.type === 'question' && msg.pergunta) {
      const grupo: GrupoPergunta = { pergunta: msg.pergunta, respostas: [] };
      grupos.push(grupo);
      porId.set(String(msg.pergunta.id), grupo);
    }
  }

  const orfas: ChatMessage[] = [];
  for (const msg of messages) {
    if (msg.type === 'question') continue;
    const grupo = msg.questionId ? porId.get(msg.questionId) : undefined;
    if (grupo) grupo.respostas.push(msg);
    else orfas.push(msg);
  }

  return { grupos, orfas };
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
    AUDIO_INVALIDO: 'O áudio está vazio ou é grande demais. Grave uma resposta mais curta e tente de novo.',
    TRANSCRICAO_VAZIA: 'Não foi possível entender o áudio. Tente gravar novamente.',
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
    AUDIO_INVALIDO: 'El audio está vacío o es demasiado grande. Graba una respuesta más corta e inténtalo de nuevo.',
    TRANSCRICAO_VAZIA: 'No se pudo entender el audio. Intenta grabar de nuevo.',
    FALHA_INESPERADA: 'No se pudo procesar la solicitud ahora. Inténtalo en unos instantes.',
  },
};

// O Supabase Auth devolve as mensagens em inglês; o code é estável e a frase vem daqui.
// A chave GENERICO cobre qualquer code que não esteja mapeado.
export const AUTH_ERROR_MESSAGES: Record<Language, Record<string, string>> = {
  PT: {
    invalid_credentials: 'E-mail ou senha incorretos.',
    user_already_exists: 'Já existe uma conta com este e-mail.',
    email_exists: 'Já existe uma conta com este e-mail.',
    weak_password: 'A senha é fraca demais. Use pelo menos 6 caracteres.',
    email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
    email_address_invalid: 'O e-mail informado não é válido.',
    over_request_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    over_email_send_rate_limit: 'Muitos e-mails enviados. Aguarde alguns minutos e tente novamente.',
    signup_disabled: 'O cadastro de novas contas está desativado.',
    network_error: 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.',
    GENERICO: 'Não foi possível autenticar agora. Tente novamente em instantes.',
  },
  ES: {
    invalid_credentials: 'Correo o contraseña incorrectos.',
    user_already_exists: 'Ya existe una cuenta con este correo.',
    email_exists: 'Ya existe una cuenta con este correo.',
    weak_password: 'La contraseña es demasiado débil. Usa al menos 6 caracteres.',
    email_not_confirmed: 'Confirma tu correo antes de entrar.',
    email_address_invalid: 'El correo ingresado no es válido.',
    over_request_rate_limit: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    over_email_send_rate_limit: 'Demasiados correos enviados. Espera unos minutos e inténtalo de nuevo.',
    signup_disabled: 'El registro de nuevas cuentas está desactivado.',
    network_error: 'No se pudo conectar al servidor. Revisa tu internet e inténtalo de nuevo.',
    GENERICO: 'No se pudo autenticar ahora. Inténtalo en unos instantes.',
  },
};

// O espanhol é tipado a partir do português: chave faltando ou sobrando em
// qualquer um dos dois idiomas quebra o `tsc`, em vez de aparecer em branco na tela.
function traduzir<T extends Record<string, string>>(pt: T, es: Record<keyof T, string>) {
  return { PT: pt, ES: es };
}

export const TRANSLATIONS = traduzir(
  {
    appName: 'Anatomize',
    documentTitle: 'Anatomize - Estudo de Anatomia Veterinária',
    close: 'Fechar',
    micPermissionDenied: 'Não foi possível acessar o microfone. Verifique as permissões no navegador.',
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
    sessionSummaryTitle: 'Resumo da Sessão',
    sessionSummarySubtitle: 'Você concluiu todas as perguntas desta rodada! Veja o resumo do seu desempenho:',
    averageScore: 'Nota média',
    correctCount: 'Acertos',
    incorrectCount: 'Erros',
    completionRate: 'Perguntas respondidas',
    summaryPointsMissing: 'Pontos a melhorar',
    summaryPointsMissingDesc: 'Revise estes conceitos no material para fixar o conteúdo:',
    summaryPointsCorrect: 'Conceitos dominados',
    summaryPointsCorrectDesc: 'Você demonstrou domínio nestes tópicos:',
    noPointsMissing: 'Excelente aproveitamento! Nenhum ponto crítico faltante foi identificado nesta sessão.',
    viewSummary: 'Ver resumo da sessão',
    hideSummary: 'Ocultar resumo',
    sessionCompletedBadge: 'RODADA CONCLUÍDA',
    questionNavLabel: 'Navegar entre as perguntas',
    questionNavAnswered: 'respondida',
    questionNavPending: 'sem resposta',
    questionNavCurrent: 'em resposta',
  },
  {
    appName: 'Anatomize',
    documentTitle: 'Anatomize - Estudio de Anatomía Veterinaria',
    close: 'Cerrar',
    micPermissionDenied: 'No se pudo acceder al micrófono. Revisa los permisos del navegador.',
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
    sessionSummaryTitle: 'Resumen de la Sesión',
    sessionSummarySubtitle: '¡Completaste todas las preguntas de esta ronda! Mira el resumen de tu desempeño:',
    averageScore: 'Calificación promedio',
    correctCount: 'Aciertos',
    incorrectCount: 'Errores',
    completionRate: 'Preguntas respondidas',
    summaryPointsMissing: 'Puntos a mejorar',
    summaryPointsMissingDesc: 'Revisa estos conceptos en el material para afianzar el contenido:',
    summaryPointsCorrect: 'Conceptos dominados',
    summaryPointsCorrectDesc: 'Demostraste dominio en estos tópicos:',
    noPointsMissing: '¡Excelente rendimiento! No se identificaron puntos críticos pendientes en esta sesión.',
    viewSummary: 'Ver resumen de la sesión',
    hideSummary: 'Ocultar resumen',
    sessionCompletedBadge: 'RONDA COMPLETADA',
    questionNavLabel: 'Navegar entre las preguntas',
    questionNavAnswered: 'respondida',
    questionNavPending: 'sin respuesta',
    questionNavCurrent: 'en respuesta',
  },
);
