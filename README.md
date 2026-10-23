# Sistema Portaria

Protótipo web responsivo para simular autorizações de visitantes e o fluxo entre o morador, a portaria principal e a portaria do grupo.

## Como executar

1. Baixe ou clone este repositório.
2. Abra `index.html` no navegador, ou inicie um servidor HTTP local na pasta do projeto.
3. Para testar em um celular pela internet, publique em um serviço HTTPS de hospedagem estática.

## Fluxo demonstrado

1. O morador cria uma autorização com apartamento, tipo de visitante, código e validade.
2. A Portaria 1 valida o código ou a placa e confirma a passagem pela entrada principal.
3. A tela do morador mostra um aviso demonstrativo para descer à Portaria 2.
4. A Portaria 2 registra a chegada ao grupo e conclui o chamado.

## Tecnologias

- HTML
- CSS responsivo
- JavaScript sem framework
- Manifesto e service worker para recursos básicos de web app

## Limitações importantes

Este projeto é um **protótipo de demonstração**, não um sistema de controle de acesso pronto para uso real. Não possui backend, banco de dados, autenticação, sincronização entre dispositivos ou notificações push. Os dados dos chamados ficam na memória da página e são perdidos ao recarregar. O QR exibido é ilustrativo e não pode ser escaneado para validar uma autorização. Não use este protótipo como única forma de segurança de um condomínio.

## Documentação para continuidade

Consulte [`GUIA-PARA-IA.md`](GUIA-PARA-IA.md) antes de alterar o código. Ele descreve a estrutura, os estados dos chamados e as regras para manter o fluxo funcionando.
