# Fluentoria Landing Page

## Visão Geral

Landing page independente e responsiva para venda do curso Fluentoria, desenvolvida com HTML, CSS e JavaScript vanilla.

## Características

### 🎨 **Design e UX**
- **Dark Theme Sofisticado**: Mantém a identidade visual da marca Fluentoria
- **Totalmente Responsiva**: Funciona perfeitamente em mobile, tablet e desktop
- **Imagem Overlay**: Foto do instrutor com transparência sutil no hero section
- **Animações Suaves**: Transições elegantes e micro-interações
- **Navegação Intuitiva**: Menu fixo com scroll suave para seções

### 📱 **Seções Principais**

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

### 💳 **Integração com Pagamento**

#### **Sistema de Pagamento**
- **Formulário Completo**: Dados pessoais e do cartão
- **Validação em Tempo Real**: Validação de CPF, email, telefone
- **Formatação Automática**: Máscaras para CPF, telefone, cartão
- **Múltiplos Estados**: Loading, success, error, processing
- **Parcelamento**: Opção de até 12x no cartão
- **Design Seguro**: Indicadores visuais de segurança

#### **Fluxo de Pagamento**
1. Cliente clica em "Comprar Agora"
2. Modal de pagamento abre com formulário
3. Validação dos dados em tempo real
4. Simulação de processamento (demo)
5. Feedback visual do resultado

## 🚀 **Como Usar**

### **Desenvolvimento Local**
1. **Clone ou baixe os arquivos** para a pasta desejada
2. **Abra o `index.html`** no navegador
3. **Pronto!** A landing page está funcionando

### **Personalização**
- **Imagens**: Adicione `instructor-photo.png` ou `instructor-photo.jpg` na pasta
- **Logo**: Já configurado como `logo.png`
- **Cores**: Edite as variáveis CSS no `<head>` do HTML
- **Textos**: Modifique diretamente no HTML ou JavaScript

### **Integração Real com Asaas**
Para integrar com o Asaas real, substitua a função `simulatePayment()` em `app.js`:

```javascript
async simulatePayment() {
  // Substitua este código pela integração real com Asaas
  const ASAAS_API_URL = 'https://api.asaas.com/v3';
  const ASAAS_ACCESS_TOKEN = 'seu_token_aqui';
  
  // Implemente a integração real aqui
  // ...
}
```

## 📁 **Estrutura de Arquivos**

```
Landing Page/
├── index.html          # Página principal
├── app.js              # Lógica da aplicação
├── README.md           # Este arquivo
├── logo.png            # Logo da marca (opcional)
└── instructor-photo.png # Foto do instrutor (opcional)
```

## 🎯 **Tecnologias Utilizadas**

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos com TailwindCSS via CDN
- **JavaScript Vanilla** - Lógica sem frameworks
- **Lucide Icons** - Ícones via CDN
- **TailwindCSS** - Utilitários de estilo via CDN

## 🔧 **Configuração**

### **Variáveis de Ambiente**
Para produção, configure as variáveis no JavaScript:

```javascript
const config = {
  ASAAS_API_URL: 'https://api.asaas.com/v3',
  ASAAS_ACCESS_TOKEN: 'seu_token_de_producao',
  ASAAS_ENVIRONMENT: 'production'
};
```

### **Personalização Visual**
Edite as configurações do Tailwind no `<script>` do HTML:

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: '#FF6A00',  // Cor principal
        background: '#0B0B0B', // Fundo
        // ...
      }
    }
  }
}
```

## 📊 **Performance**

### **Otimizações**
- **Carregamento Rápido**: Sem dependências externas pesadas
- **Imagens Otimizadas**: Use formatos WebP com fallback
- **CSS Minimal**: Apenas estilos necessários
- **JavaScript Eficiente**: Sem frameworks, código otimizado

### **SEO**
- **Meta Tags**: Título, descrição, keywords configurados
- **Open Graph**: Para compartilhamento social
- **Structured Data**: Schema.org para produtos
- **Canonical URL**: Evita conteúdo duplicado

## 🌐 **Deploy**

### **Produção**
1. **Configure o Asaas** com suas credenciais reais
2. **Faça upload** dos arquivos para seu servidor
3. **Configure domínio** personalizado
4. **Configure SSL** para HTTPS
5. **Teste** o fluxo de pagamento completo

### **Hospedagem Recomendada**
- **Vercel** - Excelente para sites estáticos
- **Netlify** - Ótimo para sites estáticos com CI/CD
- **GitHub Pages** - Gratuito para projetos open source
- **Servidor Próprio** - Upload dos arquivos via FTP

## 🧪 **Testes**

### **Teste Manual**
- **Formulário**: Teste todas as validações
- **Responsivo**: Teste em diversos dispositivos
- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Pagamento**: Teste o fluxo completo

### **Dados de Teste**
- **Nome**: Qualquer nome válido
- **Email**: Qualquer email válido
- **CPF**: 123.456.789-09
- **Telefone**: (11) 98765-4321
- **Cartão**: 4111 1111 1111 1111
- **Validade**: 12/25
- **CVV**: 123

## 🐛 **Problemas Comuns**

### **Soluções Rápidas**
1. **Ícones não aparecem**: Verifique a conexão com a CDN do Lucide
2. **Estilos não aplicam**: Confirme o TailwindCSS está carregando
3. **Formatação não funciona**: Verifique os event listeners no JavaScript
4. **Modal não abre**: Confirme se não há erros no console

### **Suporte**
- **Documentação Asaas**: https://asaasv3.docs.apiary.io/
- **TailwindCSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/

## 📈 **Métricas e Analytics**

### **Para Adicionar**
- **Google Analytics**: Adicione o script no `<head>`
- **Facebook Pixel**: Para remarketing
- **Hotjar**: Para mapas de calor
- **Google Tag Manager**: Para gerenciamento de tags

## 🔄 **Próximos Passos**

1. **A/B Testing**: Teste diferentes CTAs e preços
2. **Analytics**: Configure Google Analytics
3. **Pixel Facebook**: Para remarketing
4. **Email Marketing**: Capture de leads
5. **Otimização**: Baseado em dados de conversão

---

## 📞 **Contato**

- **Suporte Fluentoria**: suporte@fluentoria.com
- **Documentação**: Verifique o arquivo README.md
- **Issues**: Abra issues no repositório do projeto

---

**Fluentoria Landing Page** - Feita com ❤️ para converter visitantes em alunos!