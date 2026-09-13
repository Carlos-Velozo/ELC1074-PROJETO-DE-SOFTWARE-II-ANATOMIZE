import { useEffect, useRef, useState } from 'react';
import { Menu, Globe, Sparkles, AlertTriangle, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { EvaluationCard } from './components/EvaluationCard';
import { QuestionCard } from './components/QuestionCard';
import { ChatInputBar } from './components/ChatInputBar';
import { PdfDropzone } from './components/PdfDropzone';
import { GenerateMoreQuestions } from './components/GenerateMoreQuestions';
import { HelpModal } from './components/HelpModal';
import { AuthScreen } from './components/AuthScreen';
import { TRANSLATIONS } from './types';
import type { StudySession, Language, Pergunta } from './types';
import { apiService } from './services/api';
import { useAuth } from './hooks/useAuth';

const LANG_STORAGE_KEY = 'anatomize:lang';

// o idioma também decide em que língua a IA gera perguntas e dá feedback, então
// vale a pena não perdê-lo a cada reload
function lerIdiomaSalvo(): Language {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'ES' ? 'ES' : 'PT';
  } catch {
    return 'PT';
  }
}

export function App() {
  const [lang, setLang] = useState<Language>(lerIdiomaSalvo);
  const { user, isLoading: isAuthLoading, signOut } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Sempre que o usuário logado muda (login, logout ou troca de conta), zera
  // o estado local e recarrega as sessions do banco do usuário atual — evita
  // que o histórico de uma conta vaze para outra.
  const loadedMessagesSessionIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    setSessions([]);
    setActiveSessionId(null);
    loadedMessagesSessionIds.current = new Set();

    if (!user) return;

    apiService.listarSessions()
      .then(setSessions)
      .catch((err) => console.error('Falha ao carregar sessions:', err));
  }, [user]);

  const t = TRANSLATIONS[lang];
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // uma sessão só existe a partir de um PDF; sem ele a única ação possível é anexar
  const hasPdf = Boolean(activeSession?.pdfName);

  const toggleLanguage = () => {
    setLang((prev) => {
      const proximo = prev === 'PT' ? 'ES' : 'PT';
      try {
        localStorage.setItem(LANG_STORAGE_KEY, proximo);
      } catch {
        // navegador sem storage (aba anônima, cookies bloqueados): só não persiste
      }
      return proximo;
    });
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);

    if (loadedMessagesSessionIds.current.has(id)) return;
    loadedMessagesSessionIds.current.add(id);

    apiService.carregarMensagens(id)
      .then((messages) => {
        setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, messages } : s)));
      })
      .catch((err) => console.error('Falha ao carregar mensagens:', err));
  };

  // não cria linha nenhuma: a sessão nasce no banco quando o PDF é enviado
  // (Edge Function upload-pdf). Antes disso a tela só mostra o dropzone.
  const handleNewStudy = () => {
    setActiveSessionId(null);
    setErrorBanner(null);
  };

  const handleRenameSession = async (id: string, title: string) => {
    try {
      // o servidor resolve colisões acrescentando "(1)", "(2)", então o nome
      // gravado pode diferir do digitado
      const tituloGravado = await apiService.renomearSession(id, title);
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: tituloGravado } : s)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao renomear a sessão';
      console.error('Falha ao renomear sessão:', err);
      setErrorBanner(msg);
    }
  };

  const handleSendMessage = async (text: string) => {
    // sem texto não há o que avaliar (o microfone ainda não transcreve e chegava
    // aqui com string vazia, gravando mensagem em branco e gastando chamada de IA)
    if (!text.trim()) return;
    if (!activeSessionId || !activeSession?.currentQuestion || !user) return;
    const sessionId = activeSessionId;
    const questionId = String(activeSession.currentQuestion.id);

    setIsProcessing(true);
    setProcessingStatus(t.processingAudio);
    setErrorBanner(null);

    try {
      const userMessage = await apiService.inserirMensagemTexto(sessionId, user.id, text);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, userMessage] } : s)),
      );

      const { evaluationId, ...evaluation } = await apiService.avaliarResposta(questionId, text, lang);
      const evaluationMessage = await apiService.inserirMensagemAvaliacao(sessionId, user.id, evaluationId, evaluation);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, evaluationMessage] }
            : s
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao conectar ao backend';
      console.error('Erro na avaliação:', err);
      setErrorBanner(msg);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleSelectQuestion = (pergunta: Pergunta) => {
    if (!activeSessionId) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, currentQuestion: pergunta } : s
      )
    );
    apiService.definirPerguntaAtual(activeSessionId, String(pergunta.id))
      .catch((err) => console.error('Falha ao salvar pergunta atual:', err));
  };

  const handleSendAudio = (_audioBlob: Blob, transcribedText?: string) => {
    handleSendMessage(transcribedText || '');
  };

  const handleUploadPdf = async (file: File, quantidade: number) => {
    setIsProcessing(true);
    setProcessingStatus(t.generatingQuestions);
    setErrorBanner(null);

    try {
      // title já vem único e sanitizado do servidor — não recalcular aqui
      const { sessionId, title, perguntas, pdfName } = await apiService.uploadPdf(file, quantidade, lang);

      const [questionMessages] = await Promise.all([
        apiService.inserirMensagensDePerguntas(sessionId, user!.id, perguntas),
        apiService.definirPerguntaAtual(sessionId, String(perguntas[0].id)),
      ]);

      const newSession: StudySession = {
        id: sessionId,
        title,
        topic: title,
        pdfName,
        currentQuestion: perguntas[0],
        messages: questionMessages,
        updatedAt: new Date().toISOString(),
      };
      loadedMessagesSessionIds.current.add(sessionId);
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(sessionId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar PDF';
      console.error('Falha ao processar PDF:', err);
      setErrorBanner(msg);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // gera mais perguntas na sessão atual, continuando a numeração e sem repetir
  // as que já foram feitas (o servidor manda os enunciados anteriores no prompt)
  const handleGerarMaisPerguntas = async (quantidade: number) => {
    if (!activeSessionId || !user) return;
    const sessionId = activeSessionId;

    setIsProcessing(true);
    setProcessingStatus(t.generatingMore);
    setErrorBanner(null);

    try {
      const perguntas = await apiService.gerarMaisPerguntas(sessionId, quantidade, lang);
      const questionMessages = await apiService.inserirMensagensDePerguntas(sessionId, user.id, perguntas);

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, ...questionMessages] } : s)),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar novas perguntas';
      console.error('Falha ao gerar novas perguntas:', err);
      setErrorBanner(msg);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <Sparkles className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen lang={lang} onToggleLanguage={toggleLanguage} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900 font-sans">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewStudy={handleNewStudy}
        onRenameSession={handleRenameSession}
        lang={lang}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onOpenHelp={() => setIsHelpOpen(true)}
        user={user}
        onSignOut={signOut}
      />

      <HelpModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        lang={lang} 
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
        <header className="h-14 px-4 md:px-8 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="md:hidden p-2 -ml-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
              aria-label={t.openMenu}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {activeSession && (
            <div className="text-[11px] font-bold tracking-wider text-zinc-600 uppercase select-none text-center truncate px-2">
              {t.activeSession}: {activeSession.title}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 hover:border-zinc-400 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
              title={t.changeLanguage}
            >
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              <span>{lang === 'PT' ? 'PT / ES' : 'ES / PT'}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {activeSession && activeSession.pdfName ? (
            <div className="max-w-3xl mx-auto space-y-6">
              {activeSession.messages.map((msg) => (
                <div key={msg.id} className="w-full">
                  {msg.type === 'question' && msg.pergunta ? (
                    <div className="flex justify-start pt-1">
                      <QuestionCard
                        pergunta={msg.pergunta}
                        lang={lang}
                        isActive={activeSession?.currentQuestion?.id === msg.pergunta.id}
                        onSelect={() => handleSelectQuestion(msg.pergunta!)}
                      />
                    </div>
                  ) : msg.sender === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-xl bg-zinc-100/90 text-zinc-900 rounded-2xl rounded-tr-xs px-5 py-3 text-[15px] leading-relaxed shadow-2xs">
                        {msg.content}
                      </div>
                    </div>
                  ) : msg.type === 'evaluation' && msg.evaluation ? (
                    <div className="flex justify-start pt-2">
                      <EvaluationCard evaluation={msg.evaluation} lang={lang} />
                    </div>
                  ) : null}
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-3 text-zinc-600 text-sm italic pl-2 bg-emerald-50/60 border border-emerald-100/80 rounded-xl p-3 max-w-md">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>{processingStatus || t.processingAudio}</span>
                </div>
              )}

              <GenerateMoreQuestions
                onGenerate={handleGerarMaisPerguntas}
                lang={lang}
                disabled={isProcessing}
              />
            </div>
          ) : (
            <PdfDropzone
              onUploadPdf={handleUploadPdf}
              lang={lang}
              isProcessing={isProcessing}
              processingStatus={processingStatus}
            />
          )}
        </div>

        <div className="p-4 pt-2 shrink-0 bg-gradient-to-t from-white via-white to-transparent">
          {errorBanner && (
            <div className="max-w-3xl mx-auto mb-2 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
              <p className="flex-1 leading-relaxed">{errorBanner}</p>
              <button
                type="button"
                onClick={() => setErrorBanner(null)}
                className="text-amber-500 hover:text-amber-700 shrink-0"
                aria-label={t.closeWarning}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {hasPdf && activeSession?.currentQuestion && (
            <div className="max-w-3xl mx-auto mb-2 text-[11px] font-medium text-emerald-700 px-1">
              {t.answeringThis}: {t.questionBadge} #{activeSession.currentQuestion.ordem}
            </div>
          )}
          {/* sem PDF não há pergunta para responder: a tela mostra só o dropzone */}
          {hasPdf && (
            <ChatInputBar
              onSendMessage={handleSendMessage}
              onSendAudio={handleSendAudio}
              pdfName={activeSession?.pdfName}
              hasSelectedQuestion={Boolean(activeSession?.currentQuestion)}
              lang={lang}
              disabled={isProcessing}
            />
          )}
        </div>
      </main>
    </div>
  );
}
export default App;
