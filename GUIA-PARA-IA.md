# Guia de continuidade para outra IA — Controle de Acesso / Portaria

> Leia este documento e `README-ENTREGA.md` antes de alterar qualquer arquivo. Este guia descreve o comportamento esperado e as regras de manutenção do protótipo.

## Prompt para copiar e usar com outra IA

Você está trabalhando no projeto **Controle de Acesso — Portaria**, um protótipo web responsivo em HTML, CSS e JavaScript puro. Leia primeiro `GUIA-PARA-IA.md`, `README-ENTREGA.md`, `index.html`, `style.css` e `app.js`.

**Regras obrigatórias de trabalho:**
1. Responda e documente em português do Brasil. Use nomes de variáveis, funções, comentários e mensagens de interface em português claro. Não traduza APIs nativas do JavaScript nem nomes de propriedades padronizadas do navegador.
2. Antes de editar, explique brevemente quais arquivos pretende alterar e por quê. Faça backup dos arquivos que forem ser modificados.
3. Faça mudanças pequenas e coerentes. Não acrescente bibliotecas, frameworks, banco de dados, backend ou serviços externos sem pedido explícito.
4. Preserve o visual responsivo e teste especialmente telas estreitas de iPhone/Android, áreas seguras, botões de toque e a navegação inferior.
5. Não confunda uma mensagem visual no navegador com uma notificação enviada para outro aparelho. O protótipo não tem backend nem sincronização entre dispositivos.
6. O QR é apenas decorativo e não escaneável. A validação é feita pelo código numérico. Não afirme que o QR valida acessos.
7. Chamados existem em memória durante a sessão. Não adicione persistência local nem remova o estado atual sem autorização explícita.
8. Não misture avisos temporários com a lista de chamados. Avisos operacionais devem desaparecer pelo temporizador; apenas chamados devem aparecer nas filas de trabalho conforme seu estado.
9. Preserve a sequência de negócio: Morador cria autorização → Portaria 1 valida → Portaria 1 confirma a passagem principal → a área do Morador recebe um aviso demonstrativo para descer à Portaria 2 → Portaria 2 registra a chegada e conclui.
10. Após cada alteração, valide `node --check app.js`, valide `manifest.json` com `python3 -m json.tool manifest.json`, confira os IDs HTML usados no JavaScript e teste os fluxos alterados. Atualize o ZIP de entrega apenas depois das validações.
11. Não afirme que um teste visual ou em aparelho foi feito se ele não foi realmente executado. Registre limitações e testes pendentes com clareza.

## Arquivos

- `index.html`: estrutura da página, formulários, cinco painéis, mensagens e menu inferior.
- `style.css`: identidade visual, responsividade, contraste, navegação e avisos.
- `app.js`: estado temporário dos chamados, regras de negócio, validação, renderização, temporizadores, QR decorativo e compartilhamento.
- `manifest.json`: nome e configuração de instalação como web app.
- `sw.js`: cache do app shell para acesso posterior; não sincroniza chamados.
- `icon.svg` e `icon-192.png`: ícones do protótipo.
- `README-ENTREGA.md`: resumo de entrega e limitações.

## Regras de negócio e estados

- `ativo`: autorização criada, aguardando validação na Portaria 1.
- `aguardando_grupo`: Portaria 1 confirmou que a pessoa passou; Portaria 2 precisa registrar a chegada.
- `concluido`: Portaria 2 confirmou a chegada ao grupo.
- `expirado`: autorização perdeu a validade antes da confirmação.
- A preferência `preferenciaLigacao` indica que a Portaria 2 deve telefonar manualmente para o apartamento; o protótipo não armazena telefones nem realiza ligações.
- A confirmação na Portaria 1 deve gerar aviso visual na área Morador dizendo que a pessoa passou pela entrada principal e que o morador pode descer à Portaria 2. É uma simulação no mesmo navegador, não push real.
- O aviso da Portaria 1 é temporário e desaparece após 7 segundos. O aviso da Portaria 2 também é temporário.
- O ponto vermelho do menu Morador indica um aviso não lido; Portaria 2 indica chegadas pendentes; Chamados indica autorizações ativas.
- A Central apresenta métricas e movimentações do protótipo. Algumas métricas são fictícias para demonstração.

## Limitações conhecidas

Não há backend, banco de dados, autenticação, sincronização, notificação push, registro persistente, ligação automática nem QR escaneável. Ao atualizar a página, o estado em memória é reiniciado. Não usar como sistema real de controle de acesso sem implementação e testes próprios.
