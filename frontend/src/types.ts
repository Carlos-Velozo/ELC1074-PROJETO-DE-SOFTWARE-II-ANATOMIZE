export type Language = 'PT' | 'ES';

export interface Pergunta {
  id: number | string;
  enunciado: string;
  respostaEsperada: string;
  topicosChave: string[];
  dificuldade: 'básica' | 'intermediária' | 'avançada' | string;
}

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

export const TRANSLATIONS = {
  PT: {
    appName: 'Anatomize',
    newStudy: 'Novo Estudo',
    searchChat: 'Buscar Conversa',
    history: 'HISTÓRICO',
    help: 'Ajuda',
    logout: 'Sair',
    activeSession: 'SESSÃO ATIVA',
    placeholder: 'Escreva ou fale sua pergunta...',
    modelAnswerHeader: 'RESPOSTA IDEAL 10/10',
    audioRecording: 'Gravando resposta...',
    stopRecording: 'Parar e Enviar',
    uploadPdf: 'Upload de PDF da disciplina',
    processingAudio: 'Transcrevendo e avaliando resposta...',
    generatingQuestions: 'Analisando unidade e gerando perguntas com IA...',
    welcomeTitle: 'Como posso ajudar nos seus estudos de anatomia hoje?',
    welcomeSubtitle: 'Anexe o PDF da aula para gerar perguntas ou inicie gravando uma resposta em voz alta.',
    deleteSession: 'Excluir',
    questionBadge: 'PERGUNTA',
    answeringThis: 'Respondendo esta',
    difficulty: 'Dificuldade',
    keyTopics: 'Tópicos-chave',
    pointsCorrect: 'Pontos acertados',
    pointsMissing: 'Pontos a melhorar',
    noConversations: 'Nenhuma conversa encontrada',
    helpTitle: 'Como usar o Anatomize',
    helpStep1Title: 'Faça upload do material',
    helpStep1Desc: 'Envie o PDF da sua apostila ou texto base usando o ícone de clipe no chat.',
    helpStep2Title: 'Responda as questões',
    helpStep2Desc: 'A IA irá gerar perguntas sobre o texto. Responda digitando ou gravando um áudio.',
    helpStep3Title: 'Receba o feedback',
    helpStep3Desc: 'Veja sua nota, os pontos que acertou e o que faltou para a resposta ideal.',
    closeHelp: 'Entendi, vamos lá!',
  },
  ES: {
    appName: 'Anatomize',
    newStudy: 'Nuevo Estudio',
    searchChat: 'Buscar Conversación',
    history: 'HISTORIAL',
    help: 'Ayuda',
    logout: 'Salir',
    activeSession: 'SESIÓN ACTIVA',
    placeholder: 'Escribe o habla tu pregunta...',
    modelAnswerHeader: 'RESPUESTA IDEAL 10/10',
    audioRecording: 'Grabando respuesta...',
    stopRecording: 'Detener y Enviar',
    uploadPdf: 'Subir PDF de la asignatura',
    processingAudio: 'Transcribiendo y evaluando respuesta...',
    generatingQuestions: 'Analizando unidad y generando preguntas con IA...',
    welcomeTitle: '¿Cómo puedo ayudarte en tus estudios de anatomía hoy?',
    welcomeSubtitle: 'Adjunta el PDF de la clase para generar preguntas o comienza grabando una respuesta en voz alta.',
    deleteSession: 'Eliminar',
    questionBadge: 'PREGUNTA',
    answeringThis: 'Respondiendo esta',
    difficulty: 'Dificultad',
    keyTopics: 'Tópicos clave',
    pointsCorrect: 'Puntos acertados',
    pointsMissing: 'Puntos a mejorar',
    noConversations: 'No se encontraron conversaciones',
    helpTitle: 'Cómo usar Anatomize',
    helpStep1Title: 'Sube el material',
    helpStep1Desc: 'Envía el PDF de tu apunte o texto base usando el ícono de clip en el chat.',
    helpStep2Title: 'Responde las preguntas',
    helpStep2Desc: 'La IA generará preguntas sobre el texto. Responde escribiendo o grabando un audio.',
    helpStep3Title: 'Recibe el feedback',
    helpStep3Desc: 'Ve tu nota, los puntos correctos y lo que faltó para la respuesta ideal.',
    closeHelp: '¡Entendido, vamos!',
  },
};
