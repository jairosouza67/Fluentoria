import React, { useState } from 'react';
import {
  User,
  Bell,
  Lock,
  CreditCard,
  Mail,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Save,
  Camera
} from 'lucide-react';

const Settings: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
  });

  const settingsSections = [
    {
      id: 'profile',
      title: 'Perfil',
      icon: User,
      description: 'Gerencie suas informações pessoais',
    },
    {
      id: 'notifications',
      title: 'Notificações',
      icon: Bell,
      description: 'Configure suas preferências de notificação',
    },
    {
      id: 'security',
      title: 'Segurança',
      icon: Lock,
      description: 'Senha e autenticação de dois fatores',
    },
    {
      id: 'billing',
      title: 'Cobrança',
      icon: CreditCard,
      description: 'Métodos de pagamento e faturamento',
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-2">Gerencie suas preferências e configurações da conta.</p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {settingsSections.map((section) => (
          <div
            key={section.id}
            className="bg-card border-border rounded-xl p-6 shadow-card-custom hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <section.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Settings */}
      <div className="bg-card border-border rounded-xl shadow-card-custom overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Informações do Perfil</h2>
          <p className="text-sm text-muted-foreground mt-1">Atualize suas informações pessoais</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                A
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Foto de Perfil</h3>
              <p className="text-sm text-muted-foreground mb-2">JPG, GIF ou PNG. Máx 1MB</p>
              <button className="text-sm text-primary hover:text-primary/80 font-medium">
                Fazer upload
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
              <input
                type="text"
                defaultValue="Admin User"
                className="input-pluma w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                defaultValue="admin@fluentoria.com"
                className="input-pluma w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Telefone</label>
              <input
                type="tel"
                defaultValue="+55 11 98765-4321"
                className="input-pluma w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Idioma</label>
              <select className="input-pluma w-full">
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Bio</label>
            <textarea
              rows={4}
              defaultValue="Educador apaixonado por tecnologia e aprendizado contínuo."
              className="input-pluma w-full resize-none"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-card border-border rounded-xl shadow-card-custom overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Notificações</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie como você recebe notificações</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-medium text-foreground">Notificações por Email</h3>
                <p className="text-sm text-muted-foreground">Receba updates por email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-medium text-foreground">Notificações Push</h3>
                <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-medium text-foreground">Marketing</h3>
                <p className="text-sm text-muted-foreground">Receba novidades e promoções</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.marketing}
                onChange={(e) => setNotifications({ ...notifications, marketing: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-card border-border rounded-xl shadow-card-custom overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Segurança</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie sua senha e segurança da conta</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Senha Atual</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-pluma w-full pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nova Senha</label>
              <input
                type="password"
                className="input-pluma w-full"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Confirmar Senha</label>
              <input
                type="password"
                className="input-pluma w-full"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="p-4 bg-secondary/30 rounded-lg border border-border flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground mb-1">Autenticação de Dois Fatores</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Adicione uma camada extra de segurança à sua conta
              </p>
              <button className="text-sm text-primary hover:text-primary/80 font-medium">
                Ativar 2FA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button className="px-6 py-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
          Cancelar
        </button>
        <button className="btn-primary-pluma flex items-center gap-2">
          <Save className="w-4 h-4" />
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default Settings;
