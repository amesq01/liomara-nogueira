import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Sparkles, 
  LayoutDashboard, 
  Users, 
  Calendar,
  Menu,
  X,
  ArrowLeft,
  Clock,
  Scissors
} from 'lucide-react'

export default function NovoAgendamento() {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [procedimentos, setProcedimentos] = useState<Array<{ id: string; descricao: string; valor?: string }>>([])
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()

  const isEditMode = !!id

  const [formData, setFormData] = useState({
    cliente: 'Ana Paula Silva',
    procedimento: '',
    data: '',
    horario: '',
    observacoes: ''
  })

  useEffect(() => {
    // Verificar se há um usuário autenticado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
      } else {
        navigate('/login')
      }
    })

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
      } else {
        navigate('/login')
      }
    })

    // Carregar procedimentos do localStorage
    const stored = localStorage.getItem('procedimentos')
    if (stored) {
      setProcedimentos(JSON.parse(stored))
    }

    // Verificar se há parâmetros na query string (quando vem da página de Clientes)
    const searchParams = new URLSearchParams(location.search)
    const clienteNome = searchParams.get('nome')
    
    // Se estiver editando, carregar dados do agendamento
    if (isEditMode) {
      // Aqui você carregaria os dados do agendamento do Supabase
      // Por enquanto, dados mockados
      setFormData(prev => ({
        ...prev,
        cliente: prev.cliente,
        procedimento: '1',
        data: '2026-01-24',
        horario: '14:00',
        observacoes: 'Primeira sessão do tratamento'
      }))
    } else if (clienteNome) {
      // Se veio da página de Clientes, preencher o nome do cliente
      setFormData(prev => ({
        ...prev,
        cliente: decodeURIComponent(clienteNome)
      }))
    }

    return () => subscription.unsubscribe()
  }, [navigate, id, isEditMode, location.search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditMode) {
        // Aqui você fará a atualização no Supabase
        // await supabase.from('agendamentos').update(formData).eq('id', id)
        
        // Atualizar no localStorage também
        const stored = localStorage.getItem('agendamentos')
        if (stored) {
          const agendamentos: any[] = JSON.parse(stored)
          const updated = agendamentos.map(ag => 
            ag.id === parseInt(id || '0') 
              ? { ...ag, ...formData, servico: procedimentos.find(p => p.id === formData.procedimento)?.descricao || ag.servico }
              : ag
          )
          localStorage.setItem('agendamentos', JSON.stringify(updated))
        }
      } else {
        // Criar novo agendamento
        const procedimentoSelecionado = procedimentos.find(p => p.id === formData.procedimento)
        const novoAgendamento = {
          id: Date.now(), // ID temporário - será substituído pelo ID do Supabase
          cliente: formData.cliente,
          servico: procedimentoSelecionado?.descricao || 'Procedimento não selecionado',
          data: new Date(formData.data).toLocaleDateString('pt-BR'),
          horario: formData.horario,
          status: 'Agendado' as const, // Sempre criar com status "Agendado"
          telefone: '(11) 99999-0000' // Este será preenchido quando integrar com Supabase
        }

        // Aqui você fará a inserção no Supabase
        // const { data, error } = await supabase.from('agendamentos').insert([novoAgendamento])
        // if (error) throw error

        // Salvar no localStorage também (temporário até integrar com Supabase)
        const stored = localStorage.getItem('agendamentos')
        if (stored) {
          const agendamentos: any[] = JSON.parse(stored)
          agendamentos.push(novoAgendamento)
          localStorage.setItem('agendamentos', JSON.stringify(agendamentos))
        } else {
          localStorage.setItem('agendamentos', JSON.stringify([novoAgendamento]))
        }
      }
      
      navigate('/agendamentos')
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (path: string) => location.pathname === path

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FBFAF9' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
          <p className="text-slate-700 text-lg">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex relative" style={{ backgroundColor: '#FBFAF9' }}>
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gradient-to-b from-amber-50 to-white border-r border-amber-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-6 w-6 text-amber-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">Estética</h1>
              <p className="text-xs text-slate-500">Gestão de Clientes</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/dashboard') 
                ? 'bg-rose-100 border border-rose-200 text-slate-800 font-medium' 
                : 'text-slate-600 hover:bg-amber-50 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => navigate('/clientes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/clientes') 
                ? 'bg-rose-100 border border-rose-200 text-slate-800 font-medium' 
                : 'text-slate-600 hover:bg-amber-50 hover:text-slate-800'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Clientes</span>
          </button>
          <button 
            onClick={() => navigate('/agendamentos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/agendamentos') 
                ? 'bg-rose-100 border border-rose-200 text-slate-800 font-medium' 
                : 'text-slate-600 hover:bg-amber-50 hover:text-slate-800'
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span>Agendamentos</span>
          </button>
          <button 
            onClick={() => navigate('/procedimentos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/procedimentos') 
                ? 'bg-rose-100 border border-rose-200 text-slate-800 font-medium' 
                : 'text-slate-600 hover:bg-amber-50 hover:text-slate-800'
            }`}
          >
            <Scissors className="h-5 w-5" />
            <span>Procedimentos</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-amber-200">
          <p className="text-xs text-slate-500">© 2024 Estética Pro</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header Mobile */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <Menu className="h-6 w-6 text-slate-700" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <h1 className="text-lg font-bold text-slate-800">Estética</h1>
            </div>
            <div className="w-10" />
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/agendamentos')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm sm:text-base">Voltar</span>
          </button>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
            {isEditMode ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h1>
          <p className="text-slate-600 mb-8">
            {isEditMode ? 'Altere os dados do agendamento' : 'Agende um novo procedimento para o cliente'}
          </p>

          {/* Form Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-sm">
            <CardHeader className="flex items-center gap-3 pb-6">
              <div className="p-2 bg-rose-100 rounded-lg">
                <Calendar className="h-6 w-6 text-rose-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                {isEditMode ? 'Editar Agendamento' : 'Novo Agendamento'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 mb-6">Agendando para: <span className="font-semibold">{formData.cliente}</span></p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Procedimento */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Procedimento
                    </label>
                    <div className="relative">
                      <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <select
                        value={formData.procedimento}
                        onChange={(e) => setFormData(prev => ({ ...prev, procedimento: e.target.value }))}
                        className="w-full h-10 pl-10 pr-10 rounded-md border border-slate-200 bg-white text-slate-800 focus:border-amber-500 focus:ring-amber-500/20 appearance-none"
                        required
                      >
                        <option value="">Selecione o procedimento</option>
                        {procedimentos.map((proc) => (
                          <option key={proc.id} value={proc.id}>
                            {proc.descricao}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Data */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Data
                    </label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={formData.data}
                        onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                        className="pr-10 bg-white border-slate-200 text-slate-800 focus:border-amber-500 focus:ring-amber-500/20"
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Horário */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Horário
                    </label>
                    <div className="relative">
                      <Input
                        type="time"
                        value={formData.horario}
                        onChange={(e) => setFormData(prev => ({ ...prev, horario: e.target.value }))}
                        className="pr-10 bg-white border-slate-200 text-slate-800 focus:border-amber-500 focus:ring-amber-500/20"
                        required
                      />
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Informações adicionais sobre o agendamento..."
                    className="w-full min-h-[120px] px-3 py-2 rounded-md border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-rose-500 hover:bg-rose-600 text-white shadow-md"
                  >
                    {loading ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
