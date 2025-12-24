import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    TrendingDown,
    Calendar,
    AlertCircle,
    CheckCircle,
    MoreVertical,
    Download,
    Filter,
    CreditCard,
    X,
    RefreshCw
} from 'lucide-react';
import { getAllStudents, Student, updateStudent } from '../lib/db';

const FinancialReports: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'expiring'>('all');
    const [stats, setStats] = useState({
        totalRevenue: 0,
        activePlans: 0,
        expiringSoon: 0,
        expired: 0
    });

    // Edit Plan Modal
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [planType, setPlanType] = useState<string>('monthly');
    const [planStatus, setPlanStatus] = useState<string>('active');
    const [planEndDate, setPlanEndDate] = useState<string>('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            loadData();
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const loadData = async (showRefreshing = false) => {
        if (showRefreshing) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        
        const allStudents = await getAllStudents();

        // Calculate stats
        let revenue = 0;
        let active = 0;
        let expiring = 0;
        let expiredCount = 0;

        const infoStudents = allStudents.map(s => {
            // Use paymentStatus as primary source, fallback to planStatus
            let status = s.paymentStatus || s.planStatus || 'pending';
            
            // Normalize status for display
            let computedStatus = 'pending';
            if (status === 'active') {
                computedStatus = 'active';
            } else if (status === 'overdue') {
                computedStatus = 'expired';
            } else if (status === 'admin') {
                computedStatus = 'active'; // Admin always active
            } else {
                computedStatus = 'pending';
            }
            
            const endDate = s.planEndDate ? new Date(s.planEndDate) : null;
            const today = new Date();
            let isExpiring = false;

            // Check expiration based on planEndDate
            if (endDate && computedStatus === 'active') {
                const diffTime = endDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    computedStatus = 'expired';
                    expiredCount++;
                } else if (diffDays <= 7) {
                    isExpiring = true;
                    expiring++;
                    active++;
                } else {
                    active++;
                }
            } else if (computedStatus === 'active') {
                // Active but no end date (e.g., Asaas subscription)
                active++;
            } else if (computedStatus === 'expired') {
                expiredCount++;
            }

            if (s.planValue) revenue += s.planValue;

            return {
                ...s,
                computedStatus,
                isExpiring
            };
        });

        setStats({
            totalRevenue: revenue,
            activePlans: active,
            expiringSoon: expiring,
            expired: expiredCount
        });

        setStudents(infoStudents);
        setLoading(false);
        setRefreshing(false);
    };

    const handleEditClick = (student: Student) => {
        setEditingStudent(student);
        setPlanType(student.planType || 'monthly');
        setPlanStatus(student.planStatus || 'active');

        // Format date for input
        if (student.planEndDate) {
            try {
                const d = new Date(student.planEndDate);
                setPlanEndDate(d.toISOString().split('T')[0]);
            } catch (e) {
                setPlanEndDate('');
            }
        } else {
            // Default to 1 month from now if setting new
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setPlanEndDate(nextMonth.toISOString().split('T')[0]);
        }
    };

    const handleSavePlan = async () => {
        if (!editingStudent) return;
        setSaving(true);

        try {
            const endDate = new Date(planEndDate);

            await updateStudent(editingStudent.id, {
                planType: planType as any,
                planStatus: planStatus as any,
                planEndDate: endDate,
                planStartDate: editingStudent.planStartDate || new Date(), // Set start if missing
                planValue: planType === 'monthly' ? 97 : (planType === 'annual' ? 997 : 2997) // Mock values
            });

            alert('Plano atualizado com sucesso!');
            setEditingStudent(null);
            await loadData(true); // Reload with refresh indicator
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const student = s as any;
        if (filter === 'all') return true;
        if (filter === 'active') return student.computedStatus === 'active' && !student.isExpiring;
        if (filter === 'expired') return student.computedStatus === 'expired';
        if (filter === 'expiring') return student.isExpiring;
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#F3F4F6] flex items-center gap-3">
                        <DollarSign className="text-[#FF6A00]" size={32} />
                        Relatório Financeiro
                    </h1>
                    <p className="text-[#9CA3AF] mt-2">Gerencie assinaturas e previsões de receita.</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        className="w-full sm:w-auto bg-[#FF6A00] hover:bg-[#E15B00] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center sm:justify-start gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Atualizando...' : 'Atualizar'}
                    </button>
                    <button className="w-full sm:w-auto bg-[#111111] border border-white/[0.06] text-[#F3F4F6] px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/[0.05] transition-colors flex items-center justify-center sm:justify-start gap-2">
                        <Download size={16} />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#111111] p-6 rounded-xl border border-white/[0.06] shadow-card-custom">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[#9CA3AF] text-sm font-medium">Receita Estimada</p>
                            <h3 className="text-2xl font-bold text-[#F3F4F6] mt-1">
                                R$ {stats.totalRevenue.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-2 bg-[#FF6A00]/10 rounded-lg text-[#FF6A00]">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle size={12} /> Base atual
                    </p>
                </div>

                <div className="bg-[#111111] p-6 rounded-xl border border-white/[0.06] shadow-card-custom">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[#9CA3AF] text-sm font-medium">Planos Ativos</p>
                            <h3 className="text-2xl font-bold text-[#F3F4F6] mt-1">{stats.activePlans}</h3>
                        </div>
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-[#111111] p-6 rounded-xl border border-yellow-500/20 shadow-card-custom relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-bl-full -mr-8 -mt-8"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-[#9CA3AF] text-sm font-medium">Vencendo em 7 dias</p>
                            <h3 className="text-2xl font-bold text-yellow-500 mt-1">{stats.expiringSoon}</h3>
                        </div>
                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                            <AlertCircle size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-yellow-500/80 mt-1">Ação necessária</p>
                </div>

                <div className="bg-[#111111] p-6 rounded-xl border border-red-500/20 shadow-card-custom">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[#9CA3AF] text-sm font-medium">Expirados</p>
                            <h3 className="text-2xl font-bold text-red-500 mt-1">{stats.expired}</h3>
                        </div>
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 pb-2">
                {(['all', 'active', 'expiring', 'expired'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${filter === f
                                ? 'bg-[#FF6A00] text-white border-[#FF6A00]'
                                : 'bg-[#111111] text-[#9CA3AF] border-white/[0.06] hover:bg-white/[0.05]'
                            }`}
                    >
                        {f === 'all' && 'Todos'}
                        {f === 'active' && 'Ativos'}
                        {f === 'expiring' && 'Vencendo Logo'}
                        {f === 'expired' && 'Expirados'}
                    </button>
                ))}
            </div>

            {/* Mobile List (no horizontal scroll) */}
            <div className="space-y-3 md:hidden">
                {filteredStudents.map((student: any) => (
                    <div
                        key={student.id}
                        className={`bg-[#111111] border rounded-xl p-4 ${student.isExpiring
                                ? 'border-yellow-500/20'
                                : student.computedStatus === 'expired'
                                    ? 'border-red-500/20'
                                    : 'border-white/[0.06]'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00] text-xs font-bold shrink-0">
                                        {student.name?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-[#F3F4F6] truncate">{student.name}</div>
                                        <div className="text-xs text-[#9CA3AF] truncate">{student.email}</div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleEditClick(student)}
                                className="text-[#FF6A00] hover:text-[#FF6A00]/80 p-2 rounded-lg hover:bg-[#FF6A00]/10 transition-colors shrink-0"
                                title="Editar Plano"
                            >
                                <CreditCard size={18} />
                            </button>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="text-xs text-[#9CA3AF]">Plano</div>
                                <div className="text-[#F3F4F6] capitalize">{student.planType || '-'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[#9CA3AF]">Valor</div>
                                <div className="text-[#F3F4F6]">{student.planValue ? `R$ ${student.planValue}` : '-'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[#9CA3AF]">Status</div>
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-1 ${student.computedStatus === 'active' && !student.isExpiring
                                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                        : student.isExpiring
                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            : student.computedStatus === 'expired'
                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                    }`}
                                >
                                    {student.isExpiring
                                        ? 'Vencendo'
                                        : student.computedStatus === 'active'
                                            ? 'Ativo'
                                            : student.computedStatus === 'expired'
                                                ? 'Expirado'
                                                : 'Pendente'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-[#9CA3AF]">Vencimento</div>
                                <div className="flex items-center gap-2 text-sm text-[#9CA3AF] mt-1">
                                    <Calendar size={14} />
                                    <span className="text-[#F3F4F6]">
                                        {student.planEndDate ? new Date(student.planEndDate).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                            </div>
                            {student.asaasCustomerId && (
                                <div className="col-span-2">
                                    <div className="text-xs text-[#9CA3AF]">Asaas ID</div>
                                    <div className="text-[#F3F4F6] text-xs font-mono truncate">
                                        {student.asaasCustomerId}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="hidden md:block bg-[#111111] border border-white/[0.06] rounded-xl shadow-card-custom overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                            <tr>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF] whitespace-nowrap">Aluno</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF] whitespace-nowrap">Plano</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF] whitespace-nowrap">Valor</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF] whitespace-nowrap">Status</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-[#9CA3AF] whitespace-nowrap">Vencimento</th>
                                <th className="text-right py-4 px-6 text-sm font-semibold text-[#9CA3AF] whitespace-nowrap">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student: any) => (
                                <tr
                                    key={student.id}
                                    className={`border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors ${student.isExpiring ? 'bg-yellow-500/[0.03]' : ''
                                        } ${student.computedStatus === 'expired' ? 'bg-red-500/[0.03]' : ''
                                        }`}
                                >
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00] text-xs font-bold">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-[#F3F4F6]">{student.name}</div>
                                                <div className="text-xs text-[#9CA3AF]">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="capitalize text-sm text-[#F3F4F6]">{student.planType || '-'}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-sm text-[#F3F4F6]">{student.planValue ? `R$ ${student.planValue}` : '-'}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${student.computedStatus === 'active' && !student.isExpiring ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                student.isExpiring ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                    student.computedStatus === 'expired' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                            }`}>
                                            {student.isExpiring ? 'Vencendo' :
                                                student.computedStatus === 'active' ? 'Ativo' :
                                                    student.computedStatus === 'expired' ? 'Expirado' : 'Pendente'}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                                            <Calendar size={14} />
                                            {student.planEndDate ? new Date(student.planEndDate).toLocaleDateString() : '-'}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button
                                            onClick={() => handleEditClick(student)}
                                            className="text-[#FF6A00] hover:text-[#FF6A00]/80 p-2 rounded-lg hover:bg-[#FF6A00]/10 transition-colors"
                                            title="Editar Plano"
                                        >
                                            <CreditCard size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-[#9CA3AF]">
                                        Nenhum aluno encontrado neste filtro.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111111] border border-white/[0.1] rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-[#F3F4F6]">Editar Plano</h3>
                            <button onClick={() => setEditingStudent(null)} className="text-[#9CA3AF] hover:text-[#F3F4F6]">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Aluno</label>
                                <div className="text-[#F3F4F6] font-medium">{editingStudent.name}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Tipo de Plano</label>
                                <select
                                    value={planType}
                                    onChange={(e) => setPlanType(e.target.value)}
                                    className="w-full bg-[#1A1A1A] border border-white/[0.1] rounded-lg px-3 py-2 text-[#F3F4F6] focus:outline-none focus:border-[#FF6A00]"
                                >
                                    <option value="monthly">Mensal</option>
                                    <option value="annual">Anual</option>
                                    <option value="lifetime">Vitalício</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Status</label>
                                <select
                                    value={planStatus}
                                    onChange={(e) => setPlanStatus(e.target.value)}
                                    className="w-full bg-[#1A1A1A] border border-white/[0.1] rounded-lg px-3 py-2 text-[#F3F4F6] focus:outline-none focus:border-[#FF6A00]"
                                >
                                    <option value="active">Ativo</option>
                                    <option value="pending">Pendente</option>
                                    <option value="expired">Expirado</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Data de Vencimento</label>
                                <input
                                    type="date"
                                    value={planEndDate}
                                    onChange={(e) => setPlanEndDate(e.target.value)}
                                    className="w-full bg-[#1A1A1A] border border-white/[0.1] rounded-lg px-3 py-2 text-[#F3F4F6] focus:outline-none focus:border-[#FF6A00]"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setEditingStudent(null)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-white/[0.1] text-[#F3F4F6] hover:bg-white/[0.05]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSavePlan}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 rounded-lg bg-[#FF6A00] text-white hover:bg-[#E15B00] disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default FinancialReports;
