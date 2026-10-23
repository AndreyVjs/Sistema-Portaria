# Controle de Acesso — Portaria

## O que esta versão entrega
- Interface renovada e responsiva para computador e celular.
- Navegação por cinco áreas: Morador, Portaria 1, Central, Portaria 2 e Chamados; cada área funcional abre isoladamente.
- Dashboard da Central com métricas da sessão, movimentações recentes e indicadores fictícios claramente sinalizados.
- Fluxo de demonstração para abertura, validação e fechamento de chamados.
- Manifesto e service worker para permitir instalação como aplicativo web (PWA) em hospedagem HTTPS compatível.
- Cache dos arquivos da interface para abrir o app shell novamente após uma primeira visita online.

## Limitação importante antes de usar com moradores reais
Esta é uma demonstração local: os chamados ficam apenas na memória JavaScript do navegador. Ao atualizar/fechar a página, os registros podem desaparecer. Celulares e computadores não compartilham os chamados. As mensagens de notificação são apenas visuais, não são notificações push reais. O código do chamado é um identificador em texto, não um QR Code.

**Não usar como sistema operacional real de controle de acesso até implementar e testar backend compartilhado, autenticação/perfis, persistência de dados, logs e notificações reais.**

## Publicação e instalação
1. Publique todos os arquivos desta pasta em uma hospedagem estática com HTTPS.
2. Abra a URL publicada e teste os fluxos em desktop e celular.
3. Android: Chrome → menu → Instalar app / Adicionar à tela inicial.
4. iPhone: Safari → Compartilhar → Adicionar à Tela de Início.
5. Faça um teste completo em cada aparelho. A instalação não sincroniza dados entre aparelhos; isso depende do backend.

## Arquivos
- `index.html`: interface.
- `style.css`: estilos responsivos.
- `app.js`: fluxo demonstrativo no navegador.
- `manifest.json` e `sw.js`: suporte de instalação/cache do app shell.
- `icon.svg` e `icon-192.png`: ícones.
- `backup-antes-do-visual/`: cópia dos arquivos anteriores ao redesign.
