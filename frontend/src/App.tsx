import { useState } from 'react';
import { Menu, Globe, Sparkles, AlertTriangle, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { EvaluationCard } from './components/EvaluationCard';
import { QuestionCard } from './components/QuestionCard';
import { ChatInputBar } from './components/ChatInputBar';
import { HelpModal } from './components/HelpModal';
import { TRANSLATIONS } from './types';
import type { StudySession, Language, ChatMessage, Pergunta } from './types';
import { apiService } from './services/api';

export function App() {
  const [lang, setLang] = useState<Language>('PT');
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'PT' ? 'ES' : 'PT'));
  };

  const handleNewStudy = () => {
    const newId = String(Date.now());
    const newSession: StudySession = {
      id: newId,
      title: lang === 'PT' ? 'Novo Tópico de Anatomia' : 'Nuevo Tema de Anatomía',
      topic: lang === 'PT' ? 'Estudo Geral' : 'Estudio General',
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const handleSendMessage = async (text: string, audioBlob?: Blob) => {
    if (!activeSessionId) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      type: 'text',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
            ...s,
            messages: [...s.messages, userMessage],
            title: s.messages.length === 0 ? text.slice(0, 24) + '...' : s.title,
          }
          : s
      )
    );

    setIsProcessing(true);
    setProcessingStatus(t.processingAudio);
    setErrorBanner(null);

    try {
      const currentPergunta: Pergunta = activeSession?.currentQuestion || {
        id: 1,
        enunciado: 'Descreva os elementos anatômicos essenciais da estrutura em estudo.',
        respostaEsperada: 'O músculo braquiocefálico no cão tem sua origem na interseção clavicular e se insere na rafe fibrosa do pescoço.',
        topicosChave: ['origem', 'inserção'],
        dificuldade: 'básica',
      };

      const evaluation = await apiService.avaliarResposta(currentPergunta, text, audioBlob);

      const evaluationMessage: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        type: 'evaluation',
        evaluation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
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
  };

  const handleSendAudio = (audioBlob: Blob, transcribedText?: string) => {
    handleSendMessage(transcribedText || '', audioBlob);
  };

  const handleUploadPdf = async (file: File) => {
    setIsProcessing(true);
    setProcessingStatus(t.generatingQuestions);
    setErrorBanner(null);

    try {
      const { perguntas, pdfName } = await apiService.uploadPdf(file, 3);

      const cleanTitle = pdfName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

      const questionMessages: ChatMessage[] = perguntas.map((p, idx) => ({
        id: `q-${Date.now()}-${idx}`,
        sender: 'assistant',
        type: 'question',
        pergunta: p,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      if (activeSessionId) {
        const sessionId = activeSessionId;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                ...s,
                pdfName,
                title: cleanTitle,
                topic: cleanTitle,
                currentQuestion: perguntas[0],
                messages: [...s.messages, ...questionMessages],
              }
              : s
          )
        );
      } else {
        const newSessionId = String(Date.now());
        const newSession: StudySession = {
          id: newSessionId,
          title: cleanTitle,
          topic: cleanTitle,
          pdfName,
          currentQuestion: perguntas[0],
          messages: questionMessages,
          updatedAt: new Date().toISOString(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSessionId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar PDF';
      console.error('Falha ao processar PDF:', err);
      setErrorBanner(msg);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900 font-sans">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewStudy={handleNewStudy}
        lang={lang}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onOpenHelp={() => setIsHelpOpen(true)}
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
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {activeSession && (
            <div className="text-[11px] font-bold tracking-wider text-zinc-600 uppercase select-none text-center">
              {t.activeSession}: {activeSession.topic || activeSession.title}
            </div>
          )}

          <div className="flex items-center">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 hover:border-zinc-400 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
              title="Alterar idioma (Português / Espanhol)"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              <span>{lang === 'PT' ? 'PT / ES' : 'ES / PT'}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {activeSession && activeSession.messages.length > 0 ? (
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
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto select-none">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#2e7d32] mb-4 shadow-2xs">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-3.79c-2.35-.37-4.18-2.22-4.55-4.57.94-.13 1.94.1 2.68.65.94.7 1.87 2.05 1.87 3.71v4zm2 0v-4c0-1.66.93-3.01 1.87-3.71.74-.55 1.74-.78 2.68-.65-.37 2.35-2.2 4.2-4.55 4.57V16.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-800 mb-2">
                {t.welcomeTitle}
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
                {t.welcomeSubtitle}
              </p>
            </div>
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
                aria-label="Fechar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {activeSession?.currentQuestion && (
            <div className="max-w-3xl mx-auto mb-2 text-[11px] font-medium text-emerald-700 px-1">
              {t.answeringThis}: {t.questionBadge} #{activeSession.currentQuestion.id}
            </div>
          )}
          <ChatInputBar
            onSendMessage={handleSendMessage}
            onSendAudio={handleSendAudio}
            onUploadPdf={handleUploadPdf}
            lang={lang}
            disabled={isProcessing}
          />
        </div>
      </main>
    </div>
  );
}
export default App;
