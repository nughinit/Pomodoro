# Design System — Pomodoro Focus Planner

> Especificação visual e de interação definitiva do produto.

Referência-base: [Mallow UI Design System](https://mallow-ui-design-system.dear-raven-5222.chatgpt.site/)

## 1. Objetivo

Este documento define as regras visuais, estruturais e comportamentais do Pomodoro Focus Planner. Toda interface deve seguir estas decisões antes de criar novos estilos.

O produto deve parecer:

- calmo;
- tátil;
- organizado;
- acolhedor;
- adulto;
- confiável;
- fácil de ler;
- simples de operar.

O produto não deve parecer:

- infantil;
- excessivamente decorado;
- genérico;
- corporativo frio;
- visualmente pesado;
- um clone literal do Mallow UI;
- uma coleção inconsistente de cards pastéis.

A clareza do timer, das tarefas e do próximo passo sempre tem prioridade sobre a decoração.

---

## 2. Princípios

### 2.1 Suave, não infantil

Cores pastéis convivem com tipografia firme, contraste adequado, textos diretos e densidade controlada.

**Fazer:**

- usar neutros quentes como base;
- aplicar cores em áreas pequenas e com significado;
- manter títulos e números com peso visual;
- limitar ornamentos.

**Evitar:**

- excesso de rosa;
- ícones fofos sem função;
- muitas cores simultâneas;
- textos excessivamente motivacionais;
- cantos arredondados iguais em tudo.

### 2.2 Profundidade com função

A elevação comunica o tipo de elemento.

- **Elevado:** ação, card independente ou elemento manipulável.
- **Plano:** conteúdo estrutural e agrupamento.
- **Rebaixado:** área interna, progresso, seleção ou leitura do tempo.
- **Flutuante:** menu, modal ou ação temporária.

Sombras nunca comunicam um estado sozinhas.

### 2.3 Orgânico com disciplina

Formas orgânicas podem ambientar a experiência. Conteúdo, formulários, dados e ações obedecem ao grid de 8 pontos.

### 2.4 Foco primeiro

A primeira tela deve responder imediatamente:

1. Qual é a tarefa atual?
2. Quanto tempo falta?
3. Qual é a ação principal?
4. O que acontece depois?

### 2.5 Acessibilidade estrutural

A acessibilidade não é uma etapa posterior. Contraste, foco, teclado, alvos de toque, texto alternativo e movimento reduzido fazem parte da definição de pronto.

---

## 3. Tokens

Todos os valores reutilizáveis devem existir como tokens centrais. Componentes não devem declarar cores, sombras, raios ou espaçamentos arbitrários.

### 3.1 Cores-base

```css
:root {
  --color-canvas: #eee8df;
  --color-surface: #f8f3ec;
  --color-surface-raised: #fffaf3;
  --color-ink: #252523;
  --color-ink-muted: #716f6a;
  --color-border: rgba(113, 111, 106, 0.18);

  --color-mint: #a9cbbf;
  --color-aqua: #9fd7df;
  --color-sky: #82b9d0;
  --color-blush: #efb6bd;
  --color-citrus: #d9d985;

  --color-success: #6f9f8e;
  --color-info: #5f96ad;
  --color-warning: #a68d37;
  --color-danger: #a9626b;

  --color-focus-ring: #252523;
  --color-overlay: rgba(37, 37, 35, 0.38);
}
```

### 3.2 Semântica de cor

| Uso | Cor | Regra |
|---|---|---|
| Base da aplicação | Canvas | Deve ocupar a maior parte da tela |
| Cards | Surface | Conteúdo comum |
| Elementos elevados | Surface raised | Ações e cards de destaque |
| Texto principal | Ink | Títulos, números e ações |
| Texto secundário | Ink muted | Metadados e apoio |
| Sessão de foco | Mint | Sempre acompanhada de texto ou ícone |
| Pausa curta | Aqua | Nunca como único indicador |
| Pausa longa | Sky | Nunca como único indicador |
| Atenção/reinício | Blush | Usar com moderação |
| Meta alcançada | Citrus | Destaque pequeno |
| Erro destrutivo | Danger | Texto e ícone obrigatórios |

Neutros devem ocupar aproximadamente 70% a 90% da interface. Uma tela não deve usar todas as cores de destaque simultaneamente.

### 3.3 Espaçamento

Base: múltiplos de 4; layout principal: múltiplos de 8.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 40px;
  --space-8: 48px;
  --space-9: 64px;
  --space-10: 80px;
}
```

Regras:

- 4 px: ajustes internos mínimos;
- 8 px: distância entre ícone e texto;
- 12 px: itens compactos;
- 16 px: padding mínimo de controles;
- 24 px: grupos internos de cards;
- 32 px: separação entre blocos;
- 48 px ou mais: separação entre seções.

### 3.4 Raios

```css
:root {
  --radius-xs: 8px;
  --radius-sm: 14px;
  --radius-md: 22px;
  --radius-lg: 34px;
  --radius-pill: 999px;
}
```

- 8 px: elementos densos e indicadores.
- 14 px: inputs, chips e itens de lista.
- 22 px: cards e controles segmentados.
- 34 px: timer e cards principais.
- Pill: botões principais, badges e seletores curtos.

Não usar raio grande em tabelas ou listas densas.

### 3.5 Sombras

A direção de luz é sempre: luz branca difusa no topo esquerdo e sombra quente embaixo à direita.

```css
:root {
  --shadow-raised:
    -8px -8px 18px rgba(255, 255, 255, 0.72),
    10px 14px 24px rgba(114, 96, 75, 0.18),
    inset 1px 1px 1px rgba(255, 255, 255, 0.80);

  --shadow-floating:
    -12px -12px 22px rgba(255, 255, 255, 0.86),
    14px 18px 32px rgba(100, 83, 64, 0.24),
    inset 1px 2px 2px rgba(255, 255, 255, 1);

  --shadow-pressed:
    inset 5px 6px 10px rgba(128, 109, 87, 0.15),
    inset -4px -4px 8px rgba(255, 255, 255, 0.72);
}
```

Uma superfície não pode usar sombra elevada e rebaixada ao mesmo tempo.

### 3.6 Bordas

- padrão: 1 px;
- cor: `--color-border`;
- foco: 2 px;
- áreas vazias ou dropzones: tracejado discreto;
- não misturar borda forte e sombra pesada no mesmo card.

### 3.7 Movimento

```css
:root {
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 320ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

Movimento permitido:

- pressionar botão;
- trocar sessão;
- abrir modal;
- atualizar progresso;
- concluir tarefa;
- mudar de tela.

Movimento proibido:

- animação decorativa contínua;
- pulsação constante;
- parallax;
- transição maior que 500 ms para ação frequente;
- animação que impeça nova interação.

Com `prefers-reduced-motion: reduce`, remover movimentos não essenciais.

---

## 4. Tipografia

### 4.1 Família

Usar uma família sans-serif legível e disponível no projeto. Não adicionar uma fonte externa apenas por estética sem avaliar desempenho e licenciamento.

```css
--font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-editorial: Georgia, "Times New Roman", serif;
--font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
```

A fonte editorial é permitida somente em pequenos destaques de marca. Nunca no timer, formulários, listas ou dados.

### 4.2 Escala

| Papel | Tamanho/altura | Peso | Uso |
|---|---:|---:|---|
| Timer | 64/64 a 96/96 | 600–700 | Tempo principal |
| Display | 56/60 | 700 | Comunicação rara |
| H1 | 40/44 | 600–700 | Título da tela |
| H2 | 28/34 | 600 | Seções |
| H3 | 20/26 | 600 | Cards |
| Body | 16/26 | 400 | Texto principal |
| Body small | 14/22 | 400 | Apoio |
| Label | 12/16 | 600 | Metadados curtos |
| Caption | 12/18 | 400 | Informação secundária |

### 4.3 Regras

- Timer usa números tabulares: `font-variant-numeric: tabular-nums`.
- Labels em caixa alta apenas quando curtos.
- Não usar peso abaixo de 400.
- Não usar texto menor que 12 px.
- Linhas de texto corrido: máximo aproximado de 70 caracteres.
- Não centralizar parágrafos longos.
- Botões usam texto direto: “Iniciar”, “Pausar”, “Continuar”, “Concluir”.

---

## 5. Grid e layout

### 5.1 Breakpoints

```css
--breakpoint-sm: 480px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

Breakpoints devem responder ao conteúdo, não a modelos de aparelho.

### 5.2 Largura e margens

- mobile: 16 px;
- tablet: 24 px;
- desktop: 32 px;
- conteúdo máximo: 1440 px;
- conteúdo de leitura: máximo de 760 px;
- timer: deve dominar a área principal sem ocupar toda a largura em desktop.

### 5.3 Desktop

Estrutura recomendada:

- navegação lateral: 224 a 248 px;
- área principal flexível;
- coluna secundária: 320 a 380 px;
- gap principal: 24 a 32 px.

Ordem de atenção:

1. tarefa atual;
2. timer;
3. ação principal;
4. tarefas essenciais;
5. progresso diário;
6. conteúdo secundário.

### 5.4 Tablet

- navegação lateral pode recolher;
- duas colunas somente se cada coluna mantiver largura útil;
- timer permanece acima das informações secundárias.

### 5.5 Mobile

- uma coluna;
- navegação principal inferior;
- timer antes de histórico e configurações;
- sem scroll horizontal;
- ações principais acessíveis com uma mão;
- controles não podem depender de hover;
- inputs não devem provocar zoom involuntário.

---

## 6. Elevação

| Nível | Nome | Uso |
|---:|---|---|
| -1 | Pressed | Timer interno, progresso, seletor ativo |
| 0 | Base | Canvas, divisores, conteúdo estrutural |
| 1 | Raised | Cards, inputs e botões |
| 2 | Floating | Menus, popovers, modais e ações temporárias |

Não empilhar mais de dois níveis de cards. Um card dentro de outro deve ser plano ou rebaixado.

---

## 7. Iconografia

- usar uma única biblioteca;
- traço consistente;
- tamanho padrão: 20 ou 24 px;
- ícone nunca substitui texto em ação crítica;
- ícone isolado exige nome acessível;
- ícone decorativo deve ser ignorado por tecnologia assistiva;
- não usar emojis como ícones funcionais;
- não misturar símbolos Unicode, ícones preenchidos e ícones lineares sem regra.

---

## 8. Componentes

### 8.1 Botões

#### Primário

- fundo Ink;
- texto Surface raised;
- formato pill;
- altura mínima de 48 px;
- uma ação primária por região;
- elevado em repouso;
- leve deslocamento ou sombra reduzida ao pressionar.

#### Secundário

- superfície clara;
- texto Ink;
- borda ou elevação discreta;
- não competir com o primário.

#### Fantasma

- fundo transparente;
- usar em ações de baixa prioridade;
- hover e foco visíveis.

#### Destrutivo

- texto Danger;
- Blush pode aparecer como apoio;
- exige descrição clara;
- ações irreversíveis exigem confirmação.

Estados obrigatórios:

- padrão;
- hover;
- foco;
- ativo;
- desabilitado;
- carregando.

Botão desabilitado não deve ser o único meio de explicar o que falta.

### 8.2 Inputs

- label persistente acima do campo;
- placeholder é exemplo, não label;
- altura mínima: 48 px;
- raio: 14 px;
- erro abaixo do campo;
- ajuda antes do erro, quando necessária;
- foco com outline;
- não validar agressivamente durante a digitação;
- manter valor inserido após erro.

### 8.3 Checkbox

- área clicável mínima: 44 × 44 px;
- label clicável;
- estados: vazio, marcado, foco e desabilitado;
- tarefa concluída combina marca, texto e estilo, não apenas cor;
- texto riscado deve continuar legível.

### 8.4 Chips e badges

- chips: filtros ou seleções removíveis;
- badges: status não interativo;
- texto curto;
- não usar mais de três badges em um item;
- status nunca depende somente da cor.

### 8.5 Cards

- título claro;
- conteúdo com hierarquia;
- uma ação principal;
- padding: 24 ou 32 px;
- raio: 22 ou 34 px;
- não tornar o card inteiro clicável quando existirem ações internas;
- evitar cards vazios apenas para preencher layout.

### 8.6 Navegação lateral

Itens:

- Hoje;
- Tarefas;
- Calendário;
- Projetos;
- Reflexão.

Regras:

- item ativo com fundo, peso e indicador;
- ícone + texto;
- grupos nomeados apenas quando necessários;
- configurações e perfil no final;
- navegação não deve competir com o timer.

### 8.7 Navegação mobile

- máximo de cinco destinos;
- labels sempre visíveis;
- item ativo com mais de um indicador;
- altura segura para toque;
- não esconder a ação principal do timer.

### 8.8 Seletor de sessão

Opções:

- Foco;
- Pausa curta;
- Pausa longa.

Regras:

- controle segmentado rebaixado;
- seleção com cor, peso e indicador;
- labels visíveis;
- não trocar sessão acidentalmente enquanto o timer estiver rodando;
- confirmar ou explicar consequências quando houver perda de progresso.

### 8.9 Timer

O timer é o componente mais importante.

Estrutura:

1. tipo de sessão;
2. tarefa associada;
3. tempo restante;
4. progresso;
5. ação primária;
6. controles secundários;
7. indicação do próximo ciclo.

Regras:

- números tabulares;
- contraste forte;
- área do tempo rebaixada;
- não atualizar leitor de tela a cada segundo;
- título da página pode refletir o tempo;
- sessão em execução deve ser distinguível sem depender de animação;
- estado pausado usa texto explícito;
- reset não pode parecer ação principal.

### 8.10 Tarefa

Conteúdo mínimo:

- conclusão;
- título;
- projeto ou categoria;
- Pomodoros estimados e concluídos;
- ação de editar ou menu.

Estados:

- planejada;
- em foco;
- pausada;
- concluída;
- adiada.

Regras:

- título pode ocupar duas linhas;
- metadados não devem superar o título;
- tarefa ativa tem indicador textual;
- concluir tarefa produz feedback breve e reversível quando possível.

### 8.11 Progresso

- apresentar valor textual junto à visualização;
- usar Mint para progresso normal;
- Citrus apenas para meta concluída;
- animação curta;
- zero e vazio precisam de estado próprio;
- nunca sugerir precisão que os dados não possuem.

### 8.12 Modal

- usar somente quando interromper o fluxo for necessário;
- título com verbo ou objeto claro;
- fechar por botão, Escape e clique externo quando seguro;
- foco deve entrar no modal e retornar ao elemento anterior;
- ação primária à direita em desktop;
- ação destrutiva separada visualmente;
- no mobile, pode ocupar quase a tela toda.

### 8.13 Toast

- confirmar resultado já ocorrido;
- não conter informação essencial exclusiva;
- duração suficiente para leitura;
- pausável em hover/foco;
- máximo de uma ação curta;
- erros persistentes devem aparecer perto do problema.

### 8.14 Empty state

Deve conter:

- o que está vazio;
- por que isso importa;
- próximo passo;
- uma ação, quando aplicável.

Evitar ilustrações grandes ou textos genéricos.

### 8.15 Skeleton e loading

- usar skeleton somente quando a estrutura é previsível;
- ações locais usam loading no próprio controle;
- não bloquear a tela inteira por uma atualização pequena;
- impedir ações duplicadas.

---

## 9. Telas

### 9.1 Hoje

Primeiro viewport:

- saudação curta e data;
- energia do dia;
- progresso;
- tarefa ativa;
- timer;
- tarefas essenciais.

Não colocar hero de marketing.

### 9.2 Tarefas

- busca;
- filtros;
- lista clara;
- criar tarefa;
- estimativa de Pomodoros;
- estado vazio;
- agrupamento previsível.

### 9.3 Calendário

- semana como padrão inicial;
- foco em planejamento, não decoração;
- dia selecionado explícito;
- tarefas e blocos distinguíveis por texto e forma;
- versão mobile pode trocar o grid por agenda vertical.

### 9.4 Projetos

- progresso derivado das tarefas;
- número de sessões;
- estado;
- tarefas abertas;
- evitar porcentagem sem explicar sua origem.

### 9.5 Reflexão

- sessões concluídas;
- minutos focados;
- tarefas movidas;
- nota curta;
- linguagem descritiva, sem diagnóstico ou julgamento.

---

## 10. Estados da interface

Toda funcionalidade deve considerar:

- inicial;
- vazio;
- preenchido;
- hover;
- foco;
- ativo;
- carregando;
- sucesso;
- erro;
- offline, quando relevante;
- desabilitado;
- dados inválidos;
- recuperação após recarregar;
- movimento reduzido.

---

## 11. Acessibilidade

Requisitos mínimos:

- WCAG 2.2 nível AA;
- contraste de texto normal: pelo menos 4.5:1;
- texto grande: pelo menos 3:1;
- componentes e foco: pelo menos 3:1;
- alvos de toque: mínimo 44 × 44 px;
- navegação completa por teclado;
- ordem de foco acompanha a ordem visual;
- foco nunca removido sem substituição;
- landmarks semânticos;
- um H1 por tela;
- labels explícitos;
- mensagens de erro associadas ao campo;
- nomes acessíveis em botões de ícone;
- conteúdo não depende apenas de cor, sombra ou posição;
- zoom de 200% sem perda funcional;
- reflow em 320 CSS px sem scroll horizontal;
- animação reduzida;
- leitor de tela não recebe atualizações a cada segundo do timer.

### 11.1 Foco

```css
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 3px;
}
```

Não remover outline por estética.

### 11.2 Anúncios do timer

- anunciar início, pausa, continuação e conclusão;
- não anunciar cada segundo;
- anunciar marcos apenas se houver real benefício;
- manter o tempo disponível visualmente e programaticamente.

---

## 12. Conteúdo e voz

A voz é:

- calma;
- direta;
- respeitosa;
- breve;
- sem culpa;
- orientada à próxima ação.

Exemplos:

- “Escolha uma tarefa para começar.”
- “Sessão concluída.”
- “Seu progresso foi salvo neste dispositivo.”
- “Não foi possível recuperar esta sessão.”
- “Você pode ajustar a duração nas configurações.”

Evitar:

- “Você falhou.”
- “Seja produtiva!”
- “Arrase hoje!”
- “Ops!” em erros importantes;
- mensagens vagas como “Algo deu errado” sem orientação.

### 12.1 Datas e números

- idioma principal: português do Brasil;
- duração: “25 min” em contexto compacto;
- sessões: “3 de 4 sessões”;
- datas relativas apenas quando inequívocas;
- valores completos disponíveis para tecnologia assistiva.

---

## 13. Tema escuro

O tema escuro não é simples inversão.

Regras:

- preservar a hierarquia;
- reduzir intensidade das sombras claras;
- usar superfícies escuras quentes;
- dessaturar cores de destaque quando necessário;
- validar contraste novamente;
- não usar preto absoluto em grandes áreas;
- não implementar antes do tema claro estar estável.

---

## 14. Performance visual

- evitar fontes externas múltiplas;
- evitar imagens decorativas pesadas;
- ícones em SVG;
- animações em opacity e transform;
- evitar blur grande em listas extensas;
- reservar espaço para conteúdo dinâmico;
- prevenir mudança brusca de layout;
- não sacrificar legibilidade para melhorar uma métrica isolada.

---

## 15. Implementação

### 15.1 Organização sugerida

```text
src/
  components/
  features/
  pages/
  styles/
    tokens.css
    reset.css
    globals.css
  assets/
```

### 15.2 Ordem de CSS

1. reset;
2. tokens;
3. estilos globais;
4. layout;
5. componentes;
6. utilitários indispensáveis.

### 15.3 Regras técnicas

- não usar valores hexadecimais fora dos tokens;
- não criar sombra local sem justificativa documentada;
- não usar `!important`;
- não usar style inline para aparência estática;
- componentes recebem variantes semânticas, não cores arbitrárias;
- estados visuais devem refletir estados de domínio;
- estilos responsivos ficam próximos do componente ou layout correspondente;
- qualquer exceção deve ser explícita.

Exemplo correto:

```tsx
<Button variant="primary">Iniciar</Button>
<Badge tone="success">Concluída</Badge>
```

Evitar:

```tsx
<Button color="#a9cbbf" shadow="large">Iniciar</Button>
```

---

## 16. Checklist de revisão visual

### Fundação

- [ ] Todos os estilos usam tokens centrais
- [ ] A direção de luz das sombras é consistente
- [ ] O grid usa múltiplos de 8
- [ ] Não existem cores arbitrárias
- [ ] Tipografia segue a escala

### Hierarquia

- [ ] A ação principal é óbvia
- [ ] O timer domina a tela de foco
- [ ] Conteúdo secundário não compete com a tarefa atual
- [ ] Cards não estão excessivamente aninhados
- [ ] Elevação possui significado

### Componentes

- [ ] Estados obrigatórios estão implementados
- [ ] Botões possuem labels claros
- [ ] Inputs têm label persistente
- [ ] Tarefas exibem progresso compreensível
- [ ] Empty, loading e error states existem

### Responsividade

- [ ] Funciona em 320 px
- [ ] Não existe scroll horizontal
- [ ] Controles continuam alcançáveis
- [ ] Conteúdo não depende de hover
- [ ] Timer permanece prioritário
- [ ] Navegação se adapta ao mobile

### Acessibilidade

- [ ] Contraste atende AA
- [ ] Foco é visível
- [ ] Fluxo completo funciona pelo teclado
- [ ] Alvos possuem pelo menos 44 × 44 px
- [ ] Estado não depende apenas de cor
- [ ] Movimento reduzido é respeitado
- [ ] Leitor de tela não recebe anúncios excessivos

### Conteúdo

- [ ] Textos estão em português do Brasil
- [ ] Mensagens dizem o que aconteceu
- [ ] Erros oferecem próximo passo
- [ ] Linguagem não culpa a pessoa
- [ ] Labels são consistentes

---

## 17. Definição de pronto visual

Uma tela somente está visualmente pronta quando:

1. segue tokens e componentes definidos;
2. possui todos os estados relevantes;
3. funciona em desktop e mobile;
4. funciona com teclado;
5. atende contraste AA;
6. respeita movimento reduzido;
7. não depende de cor ou sombra para comunicar estado;
8. apresenta hierarquia clara;
9. utiliza conteúdo realista;
10. passa pelo checklist deste documento.

---

## 18. Governança

Antes de criar um novo padrão:

1. verificar se um componente existente resolve;
2. preferir uma variante;
3. confirmar que o caso se repetirá;
4. definir tokens necessários;
5. documentar comportamento e acessibilidade;
6. atualizar este arquivo somente depois da decisão.

Este documento é a fonte oficial das decisões visuais do Pomodoro Focus Planner.
