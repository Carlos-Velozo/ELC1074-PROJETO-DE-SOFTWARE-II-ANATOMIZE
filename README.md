# ELC1074-PROJETO-DE-SOFTWARE-II

## Definição do tema

Jogo a modo de ¨Trivia¨que use Inteligência artificial, onde os estudantes carreguem uma unidade em formato pdf, e o software elabore perguntas de Anatomia sistémica para o aluno carregar um áudio com a resposta, o software avalia a resposta e pontua com uma qualificação, oferecendo ao mesmo tempo uma retroalimentação de uma resposta 10 de 10. Serve para preparação das provas semestrais teóricas e desenvolver expressão oral sem a pressão de uma prova presencial.  

## Divisão de tarefas

1 - Frontend:

- Tecnologia: HTML, CSS, JavaScript, React

2 - Banco de dados, autenticação e salvamento de PDF:

- Tecnologia:
- Sugestão de tecnologia: Supabase ou firebase, tem serviços gratuitos que poupam esse desenvolvimento de autenticação e banco de dados

3 - IA para geração de perguntas e avaliação (Murilo):

- Tecnologia: 
- Tecnologia: Python e API do Groq

4 - Transcrição de áudio:

- Tecnologia:
- Sugestão de tecnologia: grog cloud ou gemini

5 - Hospedagem e deploy

- Tecnologia:
- Sugestão: vercel, render, netlify

## Geração de perguntas (Murilo)

O módulo em `src/gerador_perguntas.py` recebe o texto já extraído de um PDF e
gera perguntas discursivas estruturadas. A leitura do arquivo PDF ficará a cargo
de outro componente do sistema.

### Contrato do módulo

```python
from src import gerar_perguntas

perguntas = gerar_perguntas(contexto, quantidade=3)
```

Cada pergunta possui o seguinte formato:

```json
{
  "id": 1,
  "enunciado": "Texto da pergunta",
  "respostaEsperada": "Resposta completa baseada no contexto",
  "topicosChave": ["conceito 1", "conceito 2"],
  "dificuldade": "básica"
}
```

### Como executar

É necessário ter o Python 3.10 ou superior e uma chave da API do Groq. A chave
deve existir apenas no backend; ela não pode ser incluída no código do frontend.

Crie um arquivo `.env` com:

```env
GROQ_API_KEY=sua_chave
```

No PowerShell:

```powershell
python -m pip install -r requirements.txt
python -m examples.gerar_perguntas
```

## Avaliação de respostas (Murilo)

O módulo em `src/avaliador_respostas.py` recebe uma pergunta gerada e a resposta
do aluno já transcrita para texto. A avaliação considera o significado da resposta,
atribui uma nota de 0 a 10 e considera correta uma resposta com nota mínima 7.

```python
from src import avaliar_resposta

avaliacao = avaliar_resposta(pergunta, resposta_transcrita)
```

O retorno possui o seguinte formato:

```json
{
  "correta": true,
  "nota": 9,
  "feedback": "A resposta apresentou os conceitos principais.",
  "pontosAcertados": ["ventrículo direito", "pulmões"],
  "pontosFaltantes": [],
  "respostaIdeal": "Exemplo de resposta completa."
}
```

Para testar a mesma pergunta com três respostas diferentes — completa, parcial e
incorreta:

```powershell
python -m examples.avaliar_resposta
```

## Frontend (Lucas)

O módulo em `frontend/`, contém as funcionalidades: tradução (PT/ES) da interface, painel lateral com histórico de conversas, seção de ajdua com tutorial de como usar o app, upload de PDF e gravação de áudio pelo microfone.

### Como integrar no backend

O frontend possui duas rotas de API

#### 1. Upload de Arquivo
- POST `/upload-pdf`
- Corpo : `file` (o arquivo PDF) e `quantidade` (3).
- O que espera receber:
```json
{
  "pdfName": "nome_do_arquivo.pdf",
  "perguntas": [ /* Array seguindo o formato de perguntas do Murilo */ ]
}
```

#### 2. Avaliação de Resposta (Texto ou Áudio)
- POST `/avaliar`
- O que espera receber: Um objeto JSON seguindo o formato de avaliação do Murilo (`correta`, `nota`, `feedback`, `pontosAcertados`, `pontosFaltantes`, `respostaIdeal`).

### Como executar o frontend

Acesse a pasta `frontend` pelo terminal:

```powershell
cd frontend
npm install
npm run dev
```

# Avisos para o backend e banco de ados
- Restrição: quando o usuário manda áudio, o frontend envia via `FormData` contendo a chave `audio` no formato `.webm`. O serviço de transcrição no backend deve interpretar e transcrever arquivos `.webm`.
- o histórico de chats atual funciona na memória, quando fizerem o backend e o banco de dados, deve substituir o estado local `sessions` para uma requição GET na inicialização para buscar os chats persistidos no banco de dados