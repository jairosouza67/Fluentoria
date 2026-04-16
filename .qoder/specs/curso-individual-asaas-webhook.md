# Plano: Curso Individual R$97 + Webhook por Produto

## Contexto

Atualmente a Fluentoria vende apenas um produto ("Acesso Completo" por R$4.000) pela landing page. O webhook do Asaas concede acesso com `accessAuthorized: true` e cria um registro em `user_courses`, mas o `externalReference` enviado no pagamento e `fluentoria_${Date.now()}` -- sem courseId. Isso faz com que o webhook nao consiga mapear a compra a um curso especifico.

O usuario quer adicionar um segundo produto de R$97 (acesso de 30 dias) na mesma landing page, e garantir que cada compra libere apenas o curso correspondente.

**Boa noticia**: o backend (webhook `asaasWebhook` em `functions/src/index.js`) ja possui toda a logica multi-produto pronta -- `parseCourseIdFromExternalReference()` ja faz parse de JSON `{"courseId":"..."}` e cria o registro correto em `user_courses`. O unico problema e que o frontend nao envia o courseId.

---

## Arquivos a Modificar

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| `d:\VS Code\Landing Page\app.js` | Adicionar config de produtos, pricing duplo, enviar courseId no externalReference |
| `d:\VS Code\Landing Page\index.html` | Nenhuma alteracao (o HTML e gerado pelo app.js) |
| `d:\VS Code\Fluentoria\functions\src\index.js` | Nenhuma alteracao (ja suporta multi-produto) |

**Arquivo novo (opcional, para facilitar manutencao):**
| Arquivo | Descricao |
|---------|-----------|
| `d:\VS Code\Landing Page\products.js` | Configuracao centralizada dos produtos/cursos |

---

## Implementacao Passo a Passo

### Passo 1: Definir configuracao de produtos

Criar um arquivo `products.js` (ou adicionar como constante no topo de `app.js`) com a configuracao dos dois cursos:

```javascript
const PRODUCTS = {
  acesso_completo: {
    id: 'COURSE_ID_COMPLETO',  // ID do Firestore do curso completo
    name: 'Acesso Completo',
    description: 'Acesso vitalicio a todo o conteudo',
    price: 4000,
    originalPrice: 4997,
    maxInstallments: 12,
    features: [
      'Acesso completo a todo o conteudo',
      'Todos os audios e videos praticos',
      'Comunidade exclusiva no WhatsApp',
      'Atualizacoes gratuitas incluidas',
      'Aulas ao vivo semanais',
      'Call de Boas-Vindas',
      'Contatos diarios com feedback'
    ],
    badge: 'MAIS POPULAR',
    highlight: true
  },
  acesso_30dias: {
    id: 'COURSE_ID_30DIAS',  // ID do Firestore do curso de 30 dias
    name: 'Acesso 30 Dias',
    description: 'Experimente o metodo por 30 dias',
    price: 97,
    originalPrice: null,
    maxInstallments: 3,  // parcelas menores para valor baixo
    features: [
      'Acesso por 30 dias ao conteudo',
      'Audios e videos praticos',
      'Comunidade exclusiva no WhatsApp'
    ],
    badge: 'COMECE AGORA',
    highlight: false
  }
};
```

**Nota**: Os IDs dos cursos (`COURSE_ID_COMPLETO` e `COURSE_ID_30DIAS`) precisam ser preenchidos com os IDs reais do Firestore. O curso completo ja deve existir -- precisamos buscar seu ID. O curso de 30 dias sera criado pelo painel admin do app.

### Passo 2: Atualizar `handlePurchase()` para receber o courseId

**Arquivo**: `d:\VS Code\Landing Page\app.js`

Alterar a assinatura de `handlePurchase(planName, price)` para incluir o productKey:

```javascript
handlePurchase(productKey) {
  const product = PRODUCTS[productKey];
  if (!product) return;
  
  this.state.selectedProduct = product;
  this.state.selectedPlanName = product.name;
  this.state.selectedPrice = product.price;
  this.state.selectedCourseId = product.id;
  this.state.showPayment = true;
  
  // Atualizar modal
  document.getElementById('paymentPlanName').textContent = product.name;
  document.getElementById('paymentPrice').textContent = product.price.toFixed(2);
  
  // Atualizar opcoes de parcelamento conforme produto
  this.updateInstallmentOptions(product);
  
  document.getElementById('paymentModal').classList.remove('hidden');
}
```

### Passo 3: Corrigir `externalReference` em `processAsaasPayment()`

**Arquivo**: `d:\VS Code\Landing Page\app.js`, metodo `processAsaasPayment()` (linha ~1605)

Alterar de:
```javascript
externalReference: `fluentoria_${Date.now()}`
```

Para:
```javascript
externalReference: JSON.stringify({
  courseId: this.state.selectedCourseId,
  timestamp: Date.now()
})
```

Este e o ponto mais critico da mudanca. O webhook ja sabe fazer parse de `{"courseId":"..."}` via `parseCourseIdFromExternalReference()`.

### Passo 4: Adicionar metodo `updateInstallmentOptions()`

**Arquivo**: `d:\VS Code\Landing Page\app.js`

Novo metodo que recalcula as parcelas baseado no preco do produto selecionado:

```javascript
updateInstallmentOptions(product) {
  const select = document.getElementById('paymentInstallments');
  if (!select) return;
  
  const options = [];
  for (let i = 1; i <= product.maxInstallments; i++) {
    const value = (product.price / i).toFixed(2);
    const label = i === 1 
      ? `A vista (R$ ${product.price.toFixed(2)})` 
      : `Em ate ${i}x de R$ ${value}`;
    options.push(`<option value="${i}">${label}</option>`);
  }
  select.innerHTML = options.join('');
}
```

### Passo 5: Atualizar a secao de pricing no HTML (dentro de `getPricingHTML()`)

**Arquivo**: `d:\VS Code\Landing Page\app.js`, metodo `getPricingHTML()`

Redesenhar para mostrar DOIS cards lado a lado:

- **Card 1 (esquerda)**: "Acesso 30 Dias" - R$97
  - Badge: "COMECE AGORA"
  - Borda padrao (sem destaque)
  - Lista de features reduzida
  - Botao: `onclick="app.handlePurchase('acesso_30dias')"`

- **Card 2 (direita, destacado)**: "Acesso Completo" - R$4.000
  - Badge: "MAIS POPULAR" 
  - Borda laranja (destacado)
  - Lista de features completa
  - Opcoes de parcelamento
  - Botao: `onclick="app.handlePurchase('acesso_completo')"`

Layout: grid de 2 colunas em desktop, coluna unica em mobile.

### Passo 6: Atualizar secao CTA (final da pagina)

**Arquivo**: `d:\VS Code\Landing Page\app.js`, dentro de `getLandingPageHTML()`

A secao CTA no final (linha ~528-548) esta hardcoded com `handlePurchase('Acesso Completo', 4000)`. Atualizar para:
- Mostrar dois botoes ou
- Redirecionar para a secao de precos com `scrollTo('#pricing')`

Recomendacao: manter simples, so alterar o onclick para `document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })` em vez de abrir checkout diretamente.

### Passo 7: Adicionar `selectedCourseId` e `selectedProduct` ao state inicial

**Arquivo**: `d:\VS Code\Landing Page\app.js`, construtor da classe (linha ~14)

Adicionar ao `this.state`:
```javascript
selectedCourseId: null,
selectedProduct: null,
```

### Passo 8: Atualizar `getInstallmentOptionsHTML()` 

**Arquivo**: `d:\VS Code\Landing Page\app.js`

Tornar dinamico baseado no produto selecionado (inicialmente mostrar o produto padrao). Sera chamado novamente por `updateInstallmentOptions()` quando o usuario selecionar um plano.

---

## O Que NAO Precisa Mudar

- **Webhook** (`functions/src/index.js`): Ja suporta multi-produto via `parseCourseIdFromExternalReference()`. Nenhuma alteracao necessaria.
- **userCourses.ts**: CRUD ja funciona corretamente.
- **courses.ts**: `getCoursesForUser()` ja filtra cursos por user_courses.
- **Netlify Functions**: As funcoes de criar cliente e pagamento sao genricas - so repassam dados para a API do Asaas. Nenhuma alteracao necessaria.
- **sucesso.html**: Funciona para ambos os produtos sem alteracao.

---

## Configuracao Necessaria (Manual pelo Admin)

1. **Buscar o ID do curso completo existente**: Verificar no Firestore qual e o `id` do documento do curso principal na colecao `courses`.

2. **Criar o curso de 30 dias**: Usar o painel admin do app Fluentoria para criar o novo curso com o conteudo desejado. Anotar o ID gerado.

3. **Atualizar os IDs em `PRODUCTS`**: Substituir `COURSE_ID_COMPLETO` e `COURSE_ID_30DIAS` pelos IDs reais do Firestore.

---

## Verificacao / Testes

1. **Testar na landing page**:
   - Verificar que ambos os cards de preco aparecem corretamente
   - Clicar em "Comprar" no plano de R$97 e verificar que o modal abre com preco correto
   - Clicar em "Comprar" no plano de R$4.000 e verificar que o modal abre com preco e parcelas corretas
   - Verificar que as opcoes de parcelas mudam conforme o produto

2. **Testar o externalReference**:
   - Inspecionar o payload enviado ao Asaas (console.log ou network tab)
   - Confirmar que contem `{"courseId":"ID_REAL","timestamp":...}`

3. **Testar o webhook (sandbox)**:
   - Realizar pagamento de teste no sandbox do Asaas
   - Verificar nos logs do Firebase Functions que o courseId foi parseado corretamente
   - Verificar no Firestore que o registro `user_courses` foi criado com o courseId correto
   - Verificar que o usuario so ve o curso comprado no dashboard

4. **Testar acesso isolado**:
   - Comprar apenas o curso de R$97 com um email de teste
   - Fazer login no app e confirmar que so o curso de 30 dias aparece
   - O curso completo NAO deve aparecer

5. **Build e lint**:
   - Executar `pnpm run build` no projeto Fluentoria para garantir que nao ha erros
   - Verificar a landing page localmente abrindo `index.html` no navegador
