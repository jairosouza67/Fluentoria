import React, { useState } from 'react';
import {
  Search,
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  Phone,
  ChevronRight,
  ExternalLink,
  FileText,
  Video,
  Headphones
} from 'lucide-react';

const Help: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const faqCategories = [
    {
      title: 'Primeiros Passos',
      icon: Book,
      questions: [
        'Como criar minha primeira aula?',
        'Como adicionar alunos à plataforma?',
        'Como fazer upload de vídeos?',
        'Como configurar métodos de pagamento?',
      ],
    },
    {
      title: 'Gerenciamento de Aulas',
      icon: Video,
      questions: [
        'Como organizar módulos e aulas?',
        'Como definir pré-requisitos?',
        'Como adicionar materiais complementares?',
        'Como criar certificados?',
      ],
    },
    {
      title: 'Alunos e Matrículas',
      icon: MessageCircle,
      questions: [
        'Como matricular alunos manualmente?',
        'Como acompanhar o progresso dos alunos?',
        'Como enviar notificações?',
        'Como gerar relatórios?',
      ],
    },
    {
      title: 'Pagamentos e Faturamento',
      icon: FileText,
      questions: [
        'Quais formas de pagamento são aceitas?',
        'Como configurar preços de cursos?',
        'Como emitir notas fiscais?',
        'Quando recebo os pagamentos?',
      ],
    },
  ];

  const supportOptions = [
    {
      title: 'Central de Ajuda',
      description: 'Artigos e guias detalhados',
      icon: Book,
      action: 'Acessar',
      color: 'primary',
    },
    {
      title: 'Chat ao Vivo',
      description: 'Suporte online em tempo real',
      icon: MessageCircle,
      action: 'Iniciar Chat',
      color: 'green',
    },
    {
      title: 'Email',
      description: 'suporte@fluentoria.com',
      icon: Mail,
      action: 'Enviar Email',
      color: 'blue',
    },
    {
      title: 'Telefone',
      description: '+55 11 3000-0000',
      icon: Phone,
      action: 'Ligar',
      color: 'purple',
    },
  ];

  const resources = [
    {
      title: 'Guia de Início Rápido',
      description: 'Aprenda o básico em 10 minutos',
      icon: FileText,
      duration: '10 min',
    },
    {
      title: 'Tutoriais em Vídeo',
      description: 'Vídeos passo a passo',
      icon: Video,
      duration: '15 vídeos',
    },
    {
      title: 'Webinars',
      description: 'Sessões ao vivo com especialistas',
      icon: Headphones,
      duration: 'Toda semana',
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Como podemos ajudar?</h1>
        <p className="text-muted-foreground mb-6">
          Busque em nossa base de conhecimento ou entre em contato conosco
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por tutoriais, guias, perguntas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-all shadow-card-custom"
          />
        </div>
      </div>

      {/* Support Options */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {supportOptions.map((option, index) => (
          <div
            key={index}
            className="bg-card border-border rounded-xl p-6 shadow-card-custom hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
          >
            <div className={`w-12 h-12 rounded-lg bg-${option.color === 'primary' ? 'primary' : option.color + '-500'}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <option.icon className={`w-6 h-6 text-${option.color === 'primary' ? 'primary' : option.color + '-500'}`} />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{option.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
            <button className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              {option.action} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* FAQ Categories */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Perguntas Frequentes</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {faqCategories.map((category, index) => (
            <div
              key={index}
              className="bg-card border-border rounded-xl shadow-card-custom overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{category.title}</h3>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {category.questions.map((question, qIndex) => (
                  <button
                    key={qIndex}
                    className="w-full text-left p-3 rounded-lg hover:bg-secondary/30 transition-colors group flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground group-hover:text-foreground">
                      {question}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Recursos de Aprendizado</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {resources.map((resource, index) => (
            <div
              key={index}
              className="bg-card border-border rounded-xl p-6 shadow-card-custom hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <resource.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {resource.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                {resource.duration}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-border rounded-xl p-8 text-center shadow-card-custom">
        <h2 className="text-2xl font-bold text-foreground mb-3">Ainda precisa de ajuda?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Nossa equipe de suporte está sempre pronta para ajudar você. Entre em contato conosco.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="btn-primary-pluma flex items-center gap-2 justify-center">
            <MessageCircle className="w-4 h-4" />
            Iniciar Chat
          </button>
          <button className="btn-ghost-pluma flex items-center gap-2 justify-center">
            <Mail className="w-4 h-4" />
            Enviar Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default Help;
