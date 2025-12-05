import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, Star, Users, Award, Clock, ArrowRight, ChevronRight, Headphones, BookOpen, Target, Zap, Globe, Shield, CreditCard } from 'lucide-react';
import { auth } from '../lib/firebase';
import AsaasPayment from './AsaasPayment';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [user, setUser] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handlePurchase = (plan: string, price: number) => {
    setSelectedPlanName(plan);
    setSelectedPrice(price);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    // Redirect to success page or show success message
    alert('Pagamento realizado com sucesso! Redirecionando para a plataforma...');
    window.location.href = '/';
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  const features = [
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Aprendizado Imersivo",
      description: "Método único que integra inglês ao seu dia a dia, transformando atividades rotineiras em oportunidades de aprendizado"
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Áudios Práticos",
      description: "Mais de 100 horas de conteúdo em áudio para aprender enquanto faz suas atividades diárias"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Progresso Garantido",
      description: "Sistema de gamificação com conquistas e recompensas que mantêm você motivado"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Comunidade Ativa",
      description: "Acesso exclusivo a grupo de alunos para prática e troca de experiências"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Certificado Reconhecido",
      description: "Certificado de conclusão com validade nacional para comprovar seu nível"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Garantia de 30 dias",
      description: "Teste por 30 dias. Se não gostar, devolvemos 100% do seu dinheiro"
    }
  ];

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

  const plans = [
    {
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
      ],
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F3F4F6] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#0B0B0B]/95 backdrop-blur-xl border-b border-white/[0.06] z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF6A00] to-[#E15B00] rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#F3F4F6]">Fluentoria</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Recursos</a>
            <a href="#testimonials" className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Depoimentos</a>
            <a href="#pricing" className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Preços</a>
            {user ? (
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-white/[0.1] text-[#F3F4F6] px-6 py-2 rounded-xl hover:bg-white/[0.15] transition-all"
              >
                Acessar Plataforma
              </button>
            ) : (
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-[#FF6A00] text-white px-6 py-2 rounded-xl hover:bg-[#E15B00] transition-all"
              >
                Entrar
              </button>
            )}
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-[#F3F4F6]"
          >
            <div className="space-y-1">
              <div className="w-6 h-0.5 bg-current"></div>
              <div className="w-6 h-0.5 bg-current"></div>
              <div className="w-6 h-0.5 bg-current"></div>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-[#0B0B0B] z-40 pt-20">
            <div className="flex flex-col items-center gap-8 p-6">
              <a href="#features" className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Recursos</a>
              <a href="#testimonials" className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Depoimentos</a>
              <a href="#pricing" className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">Preços</a>
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-[#FF6A00] text-white px-6 py-2 rounded-xl hover:bg-[#E15B00] transition-all"
              >
                {user ? 'Acessar Plataforma' : 'Entrar'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("/instructor-photo.png"), url("/instructor-photo.jpg")',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            opacity: 0.15
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0B] via-[#0B0B0B]/90 to-[#0B0B0B] z-10" />
        
        <div className="relative z-20 max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] px-4 py-2 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4" />
              Método Revolucionário de Aprendizado
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-[#F3F4F6] mb-6 leading-tight">
            Aprenda Inglês Enquanto
            <span className="block text-[#FF6A00]">Faz Suas Atividades</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#9CA3AF] mb-8 max-w-3xl mx-auto leading-relaxed">
            Transforme tarefas diárias como lavar louças, cozinhar ou dirigir em poderosas aulas de inglês. 
            Método prático que se adapta à sua rotina, não o contrário.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#FF6A00] hover:bg-[#E15B00] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_8px_24px_rgba(255,106,0,0.3)] flex items-center justify-center gap-2"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsPlaying(true)}
              className="bg-white/[0.1] hover:bg-white/[0.15] text-[#F3F4F6] px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 border border-white/[0.2]"
            >
              <Play className="w-5 h-5" />
              Assistir Demonstração
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 text-[#9CA3AF]">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF6A00]" />
              <span><strong className="text-[#F3F4F6]">2.847</strong> alunos satisfeitos</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-[#FF6A00]" />
              <span><strong className="text-[#F3F4F6]">4.9</strong>/5 avaliação média</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FF6A00]" />
              <span><strong className="text-[#F3F4F6]">98%</strong> de aprovação</span>
            </div>
          </div>
        </div>

        {/* Video Modal */}
        {isPlaying && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
            <div className="relative w-full max-w-4xl aspect-video">
              <button 
                onClick={() => setIsPlaying(false)}
                className="absolute -top-12 right-0 text-white hover:text-[#FF6A00] transition-colors"
              >
                Fechar
              </button>
              <div className="w-full h-full bg-[#111111] rounded-xl flex items-center justify-center">
                <p className="text-white">Vídeo demonstrativo será integrado aqui</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#F3F4F6] mb-4">
              Por Que o Fluentoria é
              <span className="text-[#FF6A00]"> Diferente?</span>
            </h2>
            <p className="text-xl text-[#9CA3AF] max-w-3xl mx-auto">
              Esqueça salas de aula tradicionais. Aprenda de forma natural, integrada ao seu dia a dia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-[#111111] border border-white/[0.06] rounded-2xl p-8 hover:border-[#FF6A00]/50 transition-all hover:scale-105 group">
                <div className="w-14 h-14 bg-[#FF6A00]/10 rounded-xl flex items-center justify-center text-[#FF6A00] mb-6 group-hover:bg-[#FF6A00] group-hover:text-white transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-[#F3F4F6] mb-3">{feature.title}</h3>
                <p className="text-[#9CA3AF] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-[#111111]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#F3F4F6] mb-4">
              Alunos que
              <span className="text-[#FF6A00]"> Transformaram</span> seu Inglês
            </h2>
            <p className="text-xl text-[#9CA3AF] max-w-3xl mx-auto">
              Histórias reais de pessoas que alcançaram a fluência com nosso método
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-[#0B0B0B] border border-white/[0.06] rounded-2xl p-8 hover:border-[#FF6A00]/50 transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#FF6A00] fill-current" />
                  ))}
                </div>
                <p className="text-[#F3F4F6] mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-[#F3F4F6]">{testimonial.name}</p>
                    <p className="text-sm text-[#9CA3AF]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#F3F4F6] mb-4">
              Investimento que
              <span className="text-[#FF6A00]"> Vale a Pena</span>
            </h2>
            <p className="text-xl text-[#9CA3AF] max-w-3xl mx-auto">
              Preço único de acesso vitalício. Sem mensalidades escondidas.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <div key={index} className="bg-[#111111] border-2 border-[#FF6A00] rounded-3xl p-10 relative hover:scale-105 transition-all">
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#FF6A00] text-white px-6 py-2 rounded-full text-sm font-semibold">
                      MAIS POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-[#F3F4F6] mb-4">{plan.name}</h3>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-[#FF6A00]">
                        R$ {selectedPlan === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-[#9CA3AF] text-lg">única vez</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[#9CA3AF] line-through">
                      <span className="text-xl">R$ {plan.originalPrice}</span>
                      <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-sm">
                        ECONOMIA DE {Math.round((1 - (selectedPlan === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice) / plan.originalPrice) * 100)}%
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handlePurchase(plan.name, selectedPlan === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice)}
                    className="w-full bg-[#FF6A00] hover:bg-[#E15B00] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_8px_24px_rgba(255,106,0,0.3)] flex items-center justify-center gap-2 mb-8"
                  >
                    <CreditCard className="w-5 h-5" />
                    Comprar Agora com Asaas
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="text-center mb-6">
                    <p className="text-sm text-[#9CA3AF] mb-2">Ou em até 12x no cartão</p>
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">Compra 100% segura</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[#F3F4F6]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] px-6 py-3 rounded-full">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">Garantia de 30 dias ou seu dinheiro de volta</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#FF6A00] to-[#E15B00]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para Transformar
            <span className="block">Seu Inglês Hoje?</span>
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de alunos que já estão aprendendo inglês de forma prática e eficiente.
          </p>
          <button 
            onClick={() => handlePurchase('Acesso Vitalício', 97)}
            className="bg-white text-[#FF6A00] px-10 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-2 mx-auto"
          >
            <Zap className="w-6 h-6" />
            Garantir Minha Vaga Agora
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className="text-white/80 mt-4">
            Vagas limitadas. Próxima turma em breve.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FF6A00] to-[#E15B00] rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-[#F3F4F6]">Fluentoria</span>
              </div>
              <p className="text-[#9CA3AF]">
                Aprenda inglês de forma prática e integrada ao seu dia a dia.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#F3F4F6] mb-4">Produto</h4>
              <ul className="space-y-2 text-[#9CA3AF]">
                <li><a href="#features" className="hover:text-[#FF6A00] transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-[#FF6A00] transition-colors">Preços</a></li>
                <li><a href="#testimonials" className="hover:text-[#FF6A00] transition-colors">Depoimentos</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#F3F4F6] mb-4">Suporte</h4>
              <ul className="space-y-2 text-[#9CA3AF]">
                <li><a href="#" className="hover:text-[#FF6A00] transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="href="#" className="hover:text-[#FF6A00] transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-[#FF6A00] transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#F3F4F6] mb-4">Empresa</h4>
              <ul className="space-y-2 text-[#9CA3AF]">
                <li><a href="#" className="hover:text-[#FF6A00] transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-[#FF6A00] transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-[#FF6A00] transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-8 text-center text-[#9CA3AF]">
            <p>&copy; 2024 Fluentoria. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      {showPayment && (
        <AsaasPayment
          plan={selectedPlanName}
          price={selectedPrice}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
};

export default LandingPage;