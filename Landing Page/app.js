// Landing Page App - Fluentoria
// Standalone implementation without React dependencies

class LandingPage {
  constructor() {
    this.state = {
      isMenuOpen: false,
      isPlaying: false,
      selectedPlan: 'yearly',
      showPayment: false,
      selectedPlanName: '',
      selectedPrice: 0,
      formData: {
        name: '',
        email: '',
        phone: '',
        cpf: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        installments: 1
      },
      errors: {},
      processing: false,
      paymentStep: 'form'
    };
    
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
    this.loadLucideIcons();
  }

  async loadLucideIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  render() {
    const root = document.getElementById('root');
    root.innerHTML = this.getLandingPageHTML();
  }

  getLandingPageHTML() {
    return `
      <!-- Navigation -->
      <nav class="fixed top-0 w-full bg-[#0B0B0B]/95 backdrop-blur-xl border-b border-white/[0.06] z-50">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 bg-gradient-to-br from-[#FF6A00] to-[#E15B00] rounded-xl flex items-center justify-center">
              <i data-lucide="globe" class="w-6 h-6 text-white"></i>
            </div>
            <span class="text-xl font-bold text-[#F3F4F6]">Fluentoria</span>
          </div>

          <div class="hidden md:flex items-center gap-8">
            <a href="#features" class="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Recursos</a>
            <a href="#testimonials" class="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Depoimentos</a>
            <a href="#pricing" class="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Preços</a>
            <button 
              onclick="window.location.href='/'"
              class="bg-[#FF6A00] text-white px-6 py-2 rounded-xl hover:bg-[#E15B00] transition-all"
            >
              Entrar
            </button>
          </div>

          <button 
            onclick="app.toggleMenu()"
            class="md:hidden text-[#F3F4F6]"
          >
            <div class="space-y-1">
              <div class="w-6 h-0.5 bg-current"></div>
              <div class="w-6 h-0.5 bg-current"></div>
              <div class="w-6 h-0.5 bg-current"></div>
            </div>
          </button>
        </div>

        <!-- Mobile Menu -->
        <div id="mobileMenu" class="md:hidden fixed inset-0 bg-[#0B0B0B] z-40 pt-20 hidden">
          <div class="flex flex-col items-center gap-8 p-6">
            <a href="#features" class="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Recursos</a>
            <a href="#testimonials" class="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Depoimentos</a>
            <a href="#pricing" class="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Preços</a>
            <button 
              onclick="window.location.href='/'"
              class="bg-[#FF6A00] text-white px-6 py-2 rounded-xl hover:bg-[#E15B00] transition-all"
            >
              Entrar
            </button>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <!-- Background Image Overlay -->
        <div 
          class="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("instructor-photo.png"), url("instructor-photo.jpg")',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            opacity: 0.15
          }}
        />
        
        <!-- Gradient Overlay -->
        <div class="absolute inset-0 bg-gradient-to-br from-[#0B0B0B] via-[#0B0B0B]/90 to-[#0B0B0B] z-10"></div>
        
        <div class="relative z-20 max-w-6xl mx-auto text-center">
          <div class="mb-8">
            <span class="inline-flex items-center gap-2 bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] px-4 py-2 rounded-full text-sm font-medium">
              <i data-lucide="zap" class="w-4 h-4"></i>
              Método Revolucionário de Aprendizado
            </span>
          </div>

          <h1 class="text-5xl md:text-7xl font-bold text-[#F3F4F6] mb-6 leading-tight">
            Aprenda Inglês Enquanto
            <span class="block text-[#FF6A00]">Faz Suas Atividades</span>
          </h1>

          <p class="text-xl md:text-2xl text-[#9CA3AF] mb-8 max-w-3xl mx-auto leading-relaxed">
            Transforme tarefas diárias como lavar louças, cozinhar ou dirigir em poderosas aulas de inglês. 
            Método prático que se adapta à sua rotina, não o contrário.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button 
              onclick="document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })"
              class="bg-[#FF6A00] hover:bg-[#E15B00] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_8px_24px_rgba(255,106,0,0.3)] flex items-center justify-center gap-2"
            >
              Começar Agora
              <i data-lucide="arrow-right" class="w-5 h-5"></i>
            </button>
            <button 
              onclick="app.playVideo()"
              class="bg-white/[0.1] hover:bg-white/[0.15] text-[#F3F4F6] px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 border border-white/[0.2]"
            >
              <i data-lucide="play" class="w-5 h-5"></i>
              Assistir Demonstração
            </button>
          </div>

          <div class="flex items-center justify-center gap-8 text-[#9CA3AF]">
            <div class="flex items-center gap-2">
              <i data-lucide="users" class="w-5 h-5 text-[#FF6A00]"></i>
              <span><strong class="text-[#F3F4F6]">2.847</strong> alunos satisfeitos</span>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="star" class="w-5 h-5 text-[#FF6A00]"></i>
              <span><strong class="text-[#F3F4F6]">4.9</strong>/5 avaliação média</span>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="award" class="w-5 h-5 text-[#FF6A00]"></i>
              <span><strong class="text-[#F3F4F6]">98%</strong> de aprovação</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-20 px-6">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-bold text-[#F3F4F6] mb-4">
              Por Que o Fluentoria é
              <span class="text-[#FF6A00]"> Diferente?</span>
            </h2>
            <p class="text-xl text-[#9CA3AF] max-w-3xl mx-auto">
              Esqueça salas de aula tradicionais. Aprenda de forma natural, integrada ao seu dia a dia
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${this.getFeaturesHTML()}
          </div>
        </div>
      </section>

      <!-- Testimonials Section -->
      <section id="testimonials" class="py-20 px-6 bg-[#111111]">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-bold text-[#F3F4F6] mb-4">
              Alunos que
              <span class="text-[#FF6A00]"> Transformaram</span> seu Inglês
            </h2>
            <p class="text-xl text-[#9CA3AF] max-w-3xl mx-auto">
              Histórias reais de pessoas que alcançaram a fluência com nosso método
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            ${this.getTestimonialsHTML()}
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section id="pricing" class="py-20 px-6">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-4xl md:text-5xl font-bold text-[#F3F4F6] mb-4">
              Investimento que
              <span class="text-[#FF6A00]"> Vale a Pena</span>
            </h2>
            <p class="text-xl text-[#9CA3AF] max-w-3xl mx-auto">
              Preço único de acesso vitalício. Sem mensalidades escondidas.
            </p>
          </div>

          <div class="max-w-4xl mx-auto">
            ${this.getPricingHTML()}
          </div>

          <div class="text-center mt-12">
            <div class="inline-flex items-center gap-2 bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] px-6 py-3 rounded-full">
              <i data-lucide="shield" class="w-5 h-5"></i>
              <span class="font-semibold">Garantia de 30 dias ou seu dinheiro de volta</span>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-20 px-6 bg-gradient-to-r from-[#FF6A00] to-[#E15B00]">
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para Transformar
            <span class="block">Seu Inglês Hoje?</span>
          </h2>
          <p class="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de alunos que já estão aprendendo inglês de forma prática e eficiente.
          </p>
          <button 
            onclick="app.handlePurchase('Acesso Vitalício', 97)"
            class="bg-white text-[#FF6A00] px-10 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-2 mx-auto"
          >
            <i data-lucide="zap" class="w-6 h-6"></i>
            Garantir Minha Vaga Agora
            <i data-lucide="arrow-right" class="w-6 h-6"></i>
          </button>
          <p class="text-white/80 mt-4">
            Vagas limitadas. Próxima turma em breve.
          </p>
        </div>
      </section>

      <!-- Footer -->
      <footer class="py-12 px-6 border-t border-white/[0.06]">
        <div class="max-w-6xl mx-auto">
          <div class="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 bg-gradient-to-br from-[#FF6A00] to-[#E15B00] rounded-lg flex items-center justify-center">
                  <i data-lucide="globe" class="w-5 h-5 text-white"></i>
                </div>
                <span class="text-lg font-bold text-[#F3F4F6]">Fluentoria</span>
              </div>
              <p class="text-[#9CA3AF]">
                Aprenda inglês de forma prática e integrada ao seu dia a dia.
              </p>
            </div>

            <div>
              <h4 class="font-semibold text-[#F3F4F6] mb-4">Produto</h4>
              <ul class="space-y-2 text-[#9CA3AF]">
                <li><a href="#features" class="hover:text-[#FF6A00] transition-colors">Recursos</a></li>
                <li><a href="#pricing" class="hover:text-[#FF6A00] transition-colors">Preços</a></li>
                <li><a href="#testimonials" class="hover:text-[#FF6A00] transition-colors">Depoimentos</a></li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold text-[#F3F4F6] mb-4">Suporte</h4>
              <ul class="space-y-2 text-[#9CA3AF]">
                <li><a href="#" class="hover:text-[#FF6A00] transition-colors">Central de Ajuda</a></li>
                <li><a href="#" class="hover:text-[#FF6A00] transition-colors">Contato</a></li>
                <li><a href="#" class="hover:text-[#FF6A00] transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold text-[#F3F4F6] mb-4">Empresa</h4>
              <ul class="space-y-2 text-[#9CA3AF]">
                <li><a href="#" class="hover:text-[#FF6A00] transition-colors">Sobre Nós</a></li>
                <li><a href="#" class="hover:text-[#FF6A00] transition-colors">Termos de Uso</a></li>
                <li><a href="#" class="hover:text-[#FF6A00] transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div class="border-t border-white/[0.06] pt-8 text-center text-[#9CA3AF]">
            <p>&copy; 2024 Fluentoria. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <!-- Payment Modal -->
      <div id="paymentModal" class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 hidden">
        <div class="bg-[#111111] border border-white/[0.06] rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h2 class="text-2xl font-bold text-[#F3F4F6] mb-2">Finalizar Compra</h2>
              <p class="text-[#9CA3AF]">Plano: <span id="paymentPlanName"></span> - R$ <span id="paymentPrice"></span></p>
            </div>
            <button onclick="app.closePayment()" class="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">
              ✕
            </button>
          </div>

          <form onsubmit="app.handlePaymentSubmit(event)" class="space-y-6">
            <!-- Personal Information -->
            <div>
              <h3 class="text-lg font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
                <i data-lucide="user" class="w-5 h-5 text-[#FF6A00]"></i>
                Dados Pessoais
              </h3>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-[#F3F4F6] mb-2">Nome Completo</label>
                  <input
                    type="text"
                    id="paymentName"
                    required
                    class="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-[#F3F4F6] mb-2">Email</label>
                  <input
                    type="email"
                    id="paymentEmail"
                    required
                    class="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-[#F3F4F6] mb-2">Telefone</label>
                  <input
                    type="tel"
                    id="paymentPhone"
                    required
                    class="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-[#F3F4F6] mb-2">CPF</label>
                  <input
                    type="text"
                    id="paymentCPF"
                    required
                    class="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </div>

            <!-- Credit Card Information -->
            <div>
              <h3 class="text-lg font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
                <i data-lucide="credit-card" class="w-5 h-5 text-[#FF6A00]"></i>
                Dados do Cartão
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-[#F3F4F6] mb-2">Número do Cartão</label>
                  <input
                    type="text"
                    id="paymentCardNumber"
                    required
                    class="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors"
                    placeholder="0000 0000 0000 0000"
                    maxlength="19"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-[#F3F4F6] mb-2">Validade</label>
                    <input
                      type="text"
                      id="paymentExpiryDate"
                      required
                      class="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors"
                      placeholder="MM/AA"
                      maxlength="5"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-[#F3F4F6] mb-2">CVV</label>
                    <input
                      type="text"
                      id="paymentCVV"
                      required
                      class="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors"
                      placeholder="123"
                      maxlength="4"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[#F3F4F6] mb-2">Parcelas</label>
                  <select
                    id="paymentInstallments"
                    class="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#FF6A00] transition-colors"
                  >
                    ${this.getInstallmentOptionsHTML()}
                  </select>
                </div>
              </div>
            </div>

            <!-- Security Badges -->
            <div class="flex items-center justify-center gap-4 py-4 border-t border-white/[0.06]">
              <div class="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <i data-lucide="shield" class="w-4 h-4 text-green-500"></i>
                <span>Pagamento 100% seguro</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <i data-lucide="lock" class="w-4 h-4 text-blue-500"></i>
                <span>Dados criptografados</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4 pt-4">
              <button
                type="button"
                onclick="app.closePayment()"
                class="flex-1 bg-white/[0.1] hover:bg-white/[0.15] text-[#F3F4F6] px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="paymentSubmitBtn"
                class="flex-1 bg-[#FF6A00] hover:bg-[#E15B00] text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <i data-lucide="credit-card" class="w-5 h-5"></i>
                Pagar Agora
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Video Modal -->
      <div id="videoModal" class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 hidden">
        <div class="relative w-full max-w-4xl aspect-video">
          <button 
            onclick="app.closeVideo()"
            class="absolute -top-12 right-0 text-white hover:text-[#FF6A00] transition-colors"
          >
            Fechar
          </button>
          <div class="w-full h-full bg-[#111111] rounded-xl flex items-center justify-center">
            <p class="text-white">Vídeo demonstrativo será integrado aqui</p>
          </div>
        </div>
      </div>
    `;
  }

  getFeaturesHTML() {
    const features = [
      {
        icon: 'globe',
        title: "Aprendizado Imersivo",
        description: "Método único que integra inglês ao seu dia a dia, transformando atividades rotineiras em oportunidades de aprendizado"
      },
      {
        icon: 'headphones',
        title: "Áudios Práticos",
        description: "Mais de 100 horas de conteúdo em áudio para aprender enquanto faz suas atividades diárias"
      },
      {
        icon: 'target',
        title: "Progresso Garantido",
        description: "Sistema de gamificação com conquistas e recompensas que mantêm você motivado"
      },
      {
        icon: 'users',
        title: "Comunidade Ativa",
        description: "Acesso exclusivo a grupo de alunos para prática e troca de experiências"
      },
      {
        icon: 'award',
        title: "Certificado Reconhecido",
        description: "Certificado de conclusão com validade nacional para comprovar seu nível"
      },
      {
        icon: 'shield',
        title: "Garantia de 30 dias",
        description: "Teste por 30 dias. Se não gostar, devolvemos 100% do seu dinheiro"
      }
    ];

    return features.map((feature, index) => `
      <div class="bg-[#111111] border border-white/[0.06] rounded-2xl p-8 hover:border-[#FF6A00]/50 transition-all hover:scale-105 group">
        <div class="w-14 h-14 bg-[#FF6A00]/10 rounded-xl flex items-center justify-center text-[#FF6A00] mb-6 group-hover:bg-[#FF6A00] group-hover:text-white transition-all">
          <i data-lucide="${feature.icon}" class="w-6 h-6"></i>
        </div>
        <h3 class="text-xl font-bold text-[#F3F4F6] mb-3">${feature.title}</h3>
        <p class="text-[#9CA3AF] leading-relaxed">${feature.description}</p>
      </div>
    `).join('');
  }

  getTestimonialsHTML() {
    const testimonials = [
      {
        name: "Maria Silva",
        role: "Designer Gráfico",
        image: "https://ui-avatars.com/api/?name=Maria+Silva&background=FF6A00&color=fff&size=64",
        content: "O Fluentoria transformou meu aprendizado. Agora pratico inglês enquanto cozinho e limpo a casa. Incrível!",
        rating: 5
      },
      {
        name: "João Santos",
        role: "Desenvolvedor",
        image: "https://ui-avatars.com/api/?name=João+Santos&background=FF6A00&color=fff&size=64",
        content: "Finalmente um método que funciona na minha rotina corrida. Os áudios práticos são geniais!",
        rating: 5
      },
      {
        name: "Ana Costa",
        role: "Marketing Digital",
        image: "https://ui-avatars.com/api/?name=Ana+Costa&background=FF6A00&color=fff&size=64",
        content: "Aprendi mais em 2 meses com Fluentoria do que em 2 anos de cursos tradicionais. Recomendo!",
        rating: 5
      }
    ];

    return testimonials.map((testimonial, index) => `
      <div class="bg-[#0B0B0B] border border-white/[0.06] rounded-2xl p-8 hover:border-[#FF6A00]/50 transition-all">
        <div class="flex items-center gap-1 mb-4">
          ${Array(testimonial.rating).fill('').map(() => 
            '<i data-lucide="star" class="w-5 h-5 text-[#FF6A00] fill-current"></i>'
          ).join('')}
        </div>
        <p class="text-[#F3F4F6] mb-6 italic">"${testimonial.content}"</p>
        <div class="flex items-center gap-4">
          <img 
            src="${testimonial.image}" 
            alt="${testimonial.name}"
            class="w-12 h-12 rounded-full"
          />
          <div>
            <p class="font-semibold text-[#F3F4F6]">${testimonial.name}</p>
            <p class="text-sm text-[#9CA3AF]">${testimonial.role}</p>
          </div>
        </div>
      </div>
    `).join('');
  }

  getPricingHTML() {
    const plan = {
      name: "Acesso Vitalício",
      monthlyPrice: 197,
      yearlyPrice: 97,
      originalPrice: 997,
      features: [
        "Acesso vitalício a todo o conteúdo",
        "Todos os áudios e vídeos práticos",
        "Comunidade exclusiva no WhatsApp",
        "Certificado de conclusão",
        "Suporte prioritário 24/7",
        "Atualizações gratuitas para sempre"
      ]
    };

    const currentPrice = this.state.selectedPlan === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const economy = Math.round((1 - currentPrice / plan.originalPrice) * 100);

    return `
      <div class="bg-[#111111] border-2 border-[#FF6A00] rounded-3xl p-10 relative hover:scale-105 transition-all">
        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span class="bg-[#FF6A00] text-white px-6 py-2 rounded-full text-sm font-semibold">
            MAIS POPULAR
          </span>
        </div>

        <div class="text-center mb-8">
          <h3 class="text-2xl font-bold text-[#F3F4F6] mb-4">${plan.name}</h3>
          
          <div class="mb-6">
            <div class="flex items-baseline justify-center gap-2">
              <span class="text-5xl font-bold text-[#FF6A00]">
                R$ ${currentPrice}
              </span>
              <span class="text-[#9CA3AF] text-lg">única vez</span>
            </div>
            <div class="flex items-center justify-center gap-2 text-[#9CA3AF] line-through">
              <span class="text-xl">R$ ${plan.originalPrice}</span>
              <span class="bg-red-500/20 text-red-400 px-2 py-1 rounded text-sm">
                ECONOMIA DE ${economy}%
              </span>
            </div>
          </div>

          <button 
            onclick="app.handlePurchase('${plan.name}', ${currentPrice})"
            class="w-full bg-[#FF6A00] hover:bg-[#E15B00] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_8px_24px_rgba(255,106,0,0.3)] flex items-center justify-center gap-2 mb-8"
          >
            <i data-lucide="credit-card" class="w-5 h-5"></i>
            Comprar Agora com Asaas
            <i data-lucide="chevron-right" class="w-5 h-5"></i>
          </button>

          <div class="text-center mb-6">
            <p class="text-sm text-[#9CA3AF] mb-2">Ou em até 12x no cartão</p>
            <div class="flex items-center justify-center gap-2">
              <i data-lucide="shield" class="w-4 h-4 text-green-500"></i>
              <span class="text-sm text-green-500">Compra 100% segura</span>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          ${plan.features.map((feature, index) => `
            <div class="flex items-start gap-3">
              <i data-lucide="check-circle" class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"></i>
              <span class="text-[#F3F4F6]">${feature}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  getInstallmentOptionsHTML() {
    const options = Array.from({ length: 12 }, (_, i) => i + 1);
    return options.map(num => 
      `<option value="${num}">${num}x de R$ ${(97 / num).toFixed(2)} ${num === 1 ? '(à vista)' : ''}</option>`
    ).join('');
  }

  attachEventListeners() {
    // Add input formatting listeners
    this.setupInputFormatting();
  }

  setupInputFormatting() {
    // Phone formatting
    const phoneInput = document.getElementById('paymentPhone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        e.target.value = this.formatPhone(e.target.value);
      });
    }

    // CPF formatting
    const cpfInput = document.getElementById('paymentCPF');
    if (cpfInput) {
      cpfInput.addEventListener('input', (e) => {
        e.target.value = this.formatCPF(e.target.value);
      });
    }

    // Card number formatting
    const cardInput = document.getElementById('paymentCardNumber');
    if (cardInput) {
      cardInput.addEventListener('input', (e) => {
        e.target.value = this.formatCardNumber(e.target.value);
      });
    }

    // Expiry date formatting
    const expiryInput = document.getElementById('paymentExpiryDate');
    if (expiryInput) {
      expiryInput.addEventListener('input', (e) => {
        e.target.value = this.formatExpiryDate(e.target.value);
      });
    }
  }

  formatPhone(value) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  }

  formatCPF(value) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    }
    return value;
  }

  formatCardNumber(value) {
    const cleaned = value.replace(/\D/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  }

  formatExpiryDate(value) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  }

  toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    this.state.isMenuOpen = !this.state.isMenuOpen;
    
    if (this.state.isMenuOpen) {
      menu.classList.remove('hidden');
    } else {
      menu.classList.add('hidden');
    }
  }

  playVideo() {
    const modal = document.getElementById('videoModal');
    modal.classList.remove('hidden');
    this.state.isPlaying = true;
  }

  closeVideo() {
    const modal = document.getElementById('videoModal');
    modal.classList.add('hidden');
    this.state.isPlaying = false;
  }

  handlePurchase(planName, price) {
    this.state.selectedPlanName = planName;
    this.state.selectedPrice = price;
    this.state.showPayment = true;
    
    // Update modal content
    document.getElementById('paymentPlanName').textContent = planName;
    document.getElementById('paymentPrice').textContent = price.toFixed(2);
    
    // Show modal
    document.getElementById('paymentModal').classList.remove('hidden');
  }

  closePayment() {
    document.getElementById('paymentModal').classList.add('hidden');
    this.state.showPayment = false;
    
    // Reset form
    this.resetPaymentForm();
  }

  resetPaymentForm() {
    this.state.formData = {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      installments: 1
    };
    this.state.errors = {};
    this.state.processing = false;
    this.state.paymentStep = 'form';
  }

  async handlePaymentSubmit(event) {
    event.preventDefault();
    
    if (!this.validatePaymentForm()) {
      return;
    }

    this.state.processing = true;
    this.state.paymentStep = 'processing';
    
    // Update UI
    const submitBtn = document.getElementById('paymentSubmitBtn');
    submitBtn.innerHTML = `
      <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      Processando...
    `;
    submitBtn.disabled = true;

    try {
      // Simulate payment processing
      await this.simulatePayment();
      
      // Show success
      this.state.paymentStep = 'success';
      this.showPaymentSuccess();
      
    } catch (error) {
      console.error('Payment error:', error);
      this.state.paymentStep = 'error';
      this.showPaymentError();
    } finally {
      this.state.processing = false;
    }
  }

  validatePaymentForm() {
    const form = this.state.formData;
    const errors = {};

    if (!form.name.trim()) errors.name = 'Nome é obrigatório';
    if (!form.email.trim()) errors.email = 'Email é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email inválido';
    if (!form.phone.trim()) errors.phone = 'Telefone é obrigatório';
    if (!form.cpf.trim()) errors.cpf = 'CPF é obrigatório';
    if (!/^\d{11}$/.test(form.cpf.replace(/\D/g, ''))) errors.cpf = 'CPF inválido';
    if (!form.cardNumber.trim()) errors.cardNumber = 'Número do cartão é obrigatório';
    if (!form.expiryDate.trim()) errors.expiryDate = 'Data de validade é obrigatória';
    if (!form.cvv.trim()) errors.cvv = 'CVV é obrigatório';

    this.state.errors = errors;
    return Object.keys(errors).length === 0;
  }

  async simulatePayment() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random success/failure
    const success = Math.random() > 0.2; // 80% success rate
    
    if (!success) {
      throw new Error('Erro ao processar pagamento');
    }
    
    return { status: 'CONFIRMED' };
  }

  showPaymentSuccess() {
    const modal = document.getElementById('paymentModal');
    modal.innerHTML = `
      <div class="bg-[#111111] border border-white/[0.06] rounded-2xl p-8 max-w-md w-full text-center">
        <i data-lucide="check-circle" class="w-16 h-16 text-green-500 mx-auto mb-6"></i>
        <h3 class="text-2xl font-bold text-[#F3F4F6] mb-4">Pagamento Aprovado!</h3>
        <p class="text-[#9CA3AF] mb-6">
          Parabéns! Sua compra foi realizada com sucesso. Você receberá um email com os detalhes de acesso.
        </p>
        <div class="space-y-3 text-left bg-white/[0.02] rounded-xl p-4">
          <p class="text-sm text-[#9CA3AF]"><strong>Plano:</strong> ${this.state.selectedPlanName}</p>
          <p class="text-sm text-[#9CA3AF]"><strong>Valor:</strong> R$ ${this.state.selectedPrice.toFixed(2)}</p>
          <p class="text-sm text-[#9CA3AF]"><strong>Parcelas:</strong> ${this.state.formData.installments}x</p>
        </div>
        <button 
          onclick="app.closePayment(); setTimeout(() => window.location.href='/', 3000);"
          class="bg-[#FF6A00] hover:bg-[#E15B00] text-white px-6 py-3 rounded-xl font-semibold transition-all mt-6"
        >
          Continuar para Plataforma
        </button>
      </div>
    `;
    
    // Re-initialize icons
    this.loadLucideIcons();
  }

  showPaymentError() {
    const modal = document.getElementById('paymentModal');
    modal.innerHTML = `
      <div class="bg-[#111111] border border-white/[0.06] rounded-2xl p-8 max-w-md w-full text-center">
        <i data-lucide="alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-6"></i>
        <h3 class="text-2xl font-bold text-[#F3F4F6] mb-4">Erro no Pagamento</h3>
        <p class="text-[#9CA3AF] mb-6">
          Ocorreu um erro ao processar seu pagamento. Por favor, verifique seus dados e tente novamente.
        </p>
        <div class="flex gap-4">
          <button
            onclick="app.resetPaymentForm(); app.render();"
            class="flex-1 bg-[#FF6A00] hover:bg-[#E15B00] text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Tentar Novamente
          </button>
          <button
            onclick="app.closePayment()"
            class="flex-1 bg-white/[0.1] hover:bg-white/[0.15] text-[#F3F4F6] px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    `;
    
    // Re-initialize icons
    this.loadLucideIcons();
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new LandingPage();
});