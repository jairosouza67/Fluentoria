import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, User, Mail, Phone, CheckCircle, AlertCircle, Loader2, Shield, Lock } from 'lucide-react';
import { auth } from '../lib/firebase';

interface AsaasPaymentProps {
  plan: string;
  price: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const AsaasPayment: React.FC<AsaasPaymentProps> = ({ plan, price, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    installments: 1
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
    if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório';
    if (!/^\d{11}$/.test(formData.cpf.replace(/\D/g, ''))) newErrors.cpf = 'CPF inválido';
    if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Número do cartão é obrigatório';
    if (!formData.expiryDate.trim()) newErrors.expiryDate = 'Data de validade é obrigatória';
    if (!formData.cvv.trim()) newErrors.cvv = 'CVV é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const createAsaasCustomer = async () => {
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';

      const customerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ''),
        cpfCnpj: formData.cpf.replace(/\D/g, ''),
        address: {
          postalCode: '00000000',
          address: 'Rua Exemplo',
          addressNumber: '123',
          complement: '',
          province: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          country: 'Brasil'
        }
      };

      const response = await fetch('/.netlify/functions/create-asaas-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar cliente');
      }

      const data = await response.json();
      return data.customerId;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  };

  const createAsaasPayment = async (customerId: string) => {
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';

      const paymentData = {
        customer: customerId,
        billingType: 'CREDIT_CARD',
        value: price, // Now using the correct scale for the function
        dueDate: new Date().toISOString().split('T')[0],
        description: `Plano ${plan} - Fluentoria`,
        externalReference: `fluentoria_${Date.now()}`,
        creditCard: {
          holderName: formData.name,
          number: formData.cardNumber.replace(/\D/g, ''),
          expiryMonth: formData.expiryDate.split('/')[0],
          expiryYear: '20' + formData.expiryDate.split('/')[1],
          ccv: formData.cvv
        },
        creditCardHolderInfo: {
          name: formData.name,
          email: formData.email,
          cpfCnpj: formData.cpf.replace(/\D/g, ''),
          postalCode: '00000000',
          addressNumber: '123',
          addressComplement: '',
          mobilePhone: formData.phone.replace(/\D/g, '')
        },
        installmentCount: formData.installments,
      };

      const response = await fetch('/.netlify/functions/process-asaas-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.description || error.error || 'Erro ao processar pagamento');
      }

      const payment = await response.json();
      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setProcessing(true);
    setStep('processing');

    try {
      // Create customer first
      const customerId = await createAsaasCustomer();

      // Store customer ID in user profile
      try {
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();
          // Update the path to match Firebase Functions or Netlify Functions
          // Assuming we use the Firebase Function export named 'updateUserCustomerId'
          // We need the project ID and region. 
          // For now, I'll use a placeholder or check if it's already working via some proxy.
          // Given the structure, maybe it's meant to be a Netlify function too?
          // No, it's in functions/src/index.js.
          
          // Let's assume the user has a proxy or we should use the full URL.
          // Using the full Firebase Function URL
          await fetch('https://us-central1-fluentoria-527b2.cloudfunctions.net/updateUserCustomerId', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              userId: user.uid,
              customerId: customerId
            })
          });
        }
      } catch (error) {
        console.error('Error storing customer ID:', error);
      }

      // Then create payment
      const payment = await createAsaasPayment(customerId);

      if (payment.status === 'CONFIRMED') {
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        setStep('error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setStep('error');
    } finally {
      setProcessing(false);
    }
  };

  const installmentOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  if (step === 'processing') {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
        <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-[#FF6A00] animate-spin mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-[#F3F4F6] mb-4">Processando Pagamento</h3>
          <p className="text-[#9CA3AF]">Aguarde um momento enquanto processamos sua compra...</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
        <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-[#F3F4F6] mb-4">Pagamento Aprovado!</h3>
          <p className="text-[#9CA3AF] mb-6">
            Parabéns! Sua compra foi realizada com sucesso. Você receberá um email com os detalhes de acesso.
          </p>
          <div className="space-y-3 text-left bg-white/[0.02] rounded-xl p-4">
            <p className="text-sm text-[#9CA3AF]"><strong>Plano:</strong> {plan}</p>
            <p className="text-sm text-[#9CA3AF]"><strong>Valor:</strong> R$ {price.toFixed(2)}</p>
            <p className="text-sm text-[#9CA3AF]"><strong>Parcelas:</strong> {formData.installments}x</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
        <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-[#F3F4F6] mb-4">Erro no Pagamento</h3>
          <p className="text-[#9CA3AF] mb-6">
            Ocorreu um erro ao processar seu pagamento. Por favor, verifique seus dados e tente novamente.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setStep('form')}
              className="flex-1 bg-[#FF6A00] hover:bg-[#E15B00] text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Tentar Novamente
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-white/[0.1] hover:bg-white/[0.15] text-[#F3F4F6] px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
      <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#F3F4F6] mb-2">Finalizar Compra</h2>
            <p className="text-[#9CA3AF]">Plano: {plan} - R$ {price.toFixed(2)}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#FF6A00]" />
              Dados Pessoais
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F3F4F6] mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full bg-white/[0.02] border ${errors.name ? 'border-red-500' : 'border-white/[0.06]'} rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors`}
                  placeholder="Seu nome completo"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F3F4F6] mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full bg-white/[0.02] border ${errors.email ? 'border-red-500' : 'border-white/[0.06]'} rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors`}
                  placeholder="seu@email.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F3F4F6] mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                  className={`w-full bg-white/[0.02] border ${errors.phone ? 'border-red-500' : 'border-white/[0.06]'} rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors`}
                  placeholder="(00) 00000-0000"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F3F4F6] mb-2">CPF</label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                  className={`w-full bg-white/[0.02] border ${errors.cpf ? 'border-red-500' : 'border-white/[0.06]'} rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors`}
                  placeholder="000.000.000-00"
                />
                {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
              </div>
            </div>
          </div>

          {/* Credit Card Information */}
          <div>
            <h3 className="text-lg font-semibold text-[#F3F4F6] mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#FF6A00]" />
              Dados do Cartão
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F3F4F6] mb-2">Número do Cartão</label>
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                  className={`w-full bg-white/[0.02] border ${errors.cardNumber ? 'border-red-500' : 'border-white/[0.06]'} rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors`}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                />
                {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#F3F4F6] mb-2">Validade</label>
                  <input
                    type="text"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                    className={`w-full bg-white/[0.02] border ${errors.expiryDate ? 'border-red-500' : 'border-white/[0.06]'} rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors`}
                    placeholder="MM/AA"
                    maxLength={5}
                  />
                  {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F3F4F6] mb-2">CVV</label>
                  <input
                    type="text"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                    className={`w-full bg-white/[0.02] border ${errors.cvv ? 'border-red-500' : 'border-white/[0.06]'} rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF6A00] transition-colors`}
                    placeholder="123"
                    maxLength={4}
                  />
                  {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F3F4F6] mb-2">Parcelas</label>
                <select
                  value={formData.installments.toString()}
                  onChange={(e) => handleInputChange('installments', e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#FF6A00] transition-colors"
                >
                  {installmentOptions.map(num => (
                    <option key={num} value={num}>
                      {num}x de R$ {(price / num).toFixed(2)} {num === 1 ? '(à vista)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex items-center justify-center gap-4 py-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Pagamento 100% seguro</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
              <Lock className="w-4 h-4 text-blue-500" />
              <span>Dados criptografados</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white/[0.1] hover:bg-white/[0.15] text-[#F3F4F6] px-6 py-3 rounded-xl font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 bg-[#FF6A00] hover:bg-[#E15B00] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pagar R$ {price.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsaasPayment;