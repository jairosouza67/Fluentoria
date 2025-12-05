# Landing Page - Fluentoria

## Visão Geral

Uma landing page elegante e persuasiva desenvolvida para venda do curso Fluentoria, com integração completa com o sistema de pagamento Asaas.

## Características

### Design e UX
- **Design Dark Theme**: Mantém a identidade visual sofisticada da marca
- **Responsivo**: Totalmente adaptado para mobile, tablet e desktop
- **Imagem em Overlay**: Foto do instrutor com transparência sutil no hero section
- **Animações Suaves**: Transições elegantes e micro-interações
- **Navegação Intuitiva**: Menu fixo com scroll suave para seções

### Seções Principais

1. **Hero Section**
   - Título persuasivo com destaque para o principal benefício
   - Imagem de overlay do instrutor (praticando atividades do dia a dia)
   - Call-to-action principal e secundário
   - Prova social (número de alunos, avaliação, taxa de aprovação)

2. **Recursos (Features)**
   - 6 diferenciais principais com ícones animados
   - Cards com hover effects e gradientes
   - Foco nos benefícios práticos do método

3. **Depoimentos**
   - 3 depoimentos reais com fotos e avaliações
   - Design em grid responsivo
   - Estrelas de avaliação visíveis

4. **Preços (Pricing)**
   - Plano único com desconto destacado
   - Comparação de preços (original vs. promocional)
   - Badge "MAIS POPULAR" para o plano principal
   - Lista de benefícios inclusos

5. **CTA Final**
   - Seção com gradiente chamativo
   - Botão de ação com urgência
   - Texto de escassez ("Vagas limitadas")

### Integração com Asaas

#### Componente AsaasPayment
- **Formulário Completo**: Dados pessoais e do cartão
- **Validação em Tempo Real**: Validação de CPF, email, telefone
- **Formatação Automática**: Máscaras para CPF, telefone, cartão
- **Processamento Seguro**: Integração direta com API do Asaas
- **Múltiplos Estados**: Loading, success, error, processing
- **Parcelamento**: Opção de até 12x no cartão

#### Fluxo de Pagamento
1. Usuário clica em "Comprar Agora"
2. Modal de pagamento abre com formulário
3. Validação dos dados em tempo real
4. Criação de cliente no Asaas
5. Processamento do pagamento
6. Feedback visual do resultado

#### Segurança
- **Token de Acesso**: Configurado via variável de ambiente
- **Dados Criptografados**: SSL e validação frontend
- **Ambiente Sandbox**: Para testes sem transações reais
- **Validações**: CPF, email, número do cartão

## Configuração

### Variáveis de Ambiente
```bash
# Copie .env.example para .env
cp .env.example .env

# Configure as variáveis:
VITE_ASAAS_ACCESS_TOKEN=seu_token_aqui
VITE_ASAAS_ENVIRONMENT=sandbox  # ou production
```

### Como Usar

1. **Acessar a Landing Page**
   - Acesse `http://localhost:5173`
   - A landing page é a página inicial por padrão

2. **Testar Pagamento**
   - Clique em "Comprar Agora" ou "Garantir Minha Vaga"
   - Preencha o formulário de teste
   - Use dados de teste do Asaas sandbox

3. **Dados de Teste (Sandbox)**
   - Nome: Qualquer nome
   - Email: Qualquer email válido
   - CPF: 123.456.789-09
   - Cartão: 4111 1111 1111 1111
   - Validade: 12/25
   - CVV: 123

## Personalização

### Cores e Tema
- **Primária**: #FF6A00 (laranja)
- **Background**: #0B0B0B (preto suave)
- **Texto**: #F3F4F6 (branco suave)
- **Secundária**: #9CA3AF (cinza)

### Imagens
- **Instructor Photo**: Adicione `instructor-photo.png` ou `instructor-photo.jpg` na pasta `public/`
- **Logo**: Já configurado como `logo.png`

## Performance

### Otimizações
- **Lazy Loading**: Componentes carregados sob demanda
- **Imagens Otimizadas**: Formato WebP com fallback
- **CSS Minimal**: Apenas estilos necessários
- **JavaScript Eficiente**: Sem dependências desnecessárias

### SEO
- **Meta Tags**: Título, descrição, keywords
- **Open Graph**: Para compartilhamento social
- **Structured Data**: Schema.org para produtos
- **Canonical URL**: Para evitar conteúdo duplicado

## Deploy

### Produção
1. **Configurar Variáveis**: Defina tokens de produção
2. **Build**: `npm run build`
3. **Deploy**: Envie para seu servidor/Vercel/Netlify
4. **DNS**: Configure domínio personalizado
5. **SSL**: Certifique-se de HTTPS ativo

### Testes
- **Formulário**: Teste todas as validações
- **Pagamento**: Use ambiente sandbox
- **Responsivo**: Teste em diversos dispositivos
- **Cross-browser**: Chrome, Firefox, Safari, Edge

## Suporte

### Problemas Comuns
1. **Pagamento Falha**: Verifique token do Asaas
2. **CORS**: Configure domínios no painel Asaas
3. **Imagens**: Verifique caminhos no public/
4. **Responsivo**: Teste com devtools mobile

### Contato
- **Documentação Asaas**: https://asaasv3.docs.apiary.io/
- **Suporte Fluentoria**: suporte@fluentoria.com

---

## Próximos Passos

1. **A/B Testing**: Testar diferentes CTAs e preços
2. **Analytics**: Google Analytics para conversões
3. **Pixel Facebook**: Para remarketing
4. **Email Marketing**: Captura de leads
5. **Otimização**: Baseado em dados de conversão