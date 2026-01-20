import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Sparkles, 
  LayoutDashboard, 
  Users, 
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Plus,
  Menu,
  X,
  Scissors
} from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClientes: 0,
    agendamentosHoje: 0,
    concluidosMes: 0,
    proximo: {
      horario: '--:--',
      cliente: 'Nenhum',
      servico: 'agendamento'
    }
  })
  const [agendamentosHoje, setAgendamentosHoje] = useState<Array<{
    id: string
    servico: string
    cliente: string
    data: string
    horario: string
    status: string
    observacoes?: string | null
  }>>([])
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

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

    // Carregar dados do dashboard
    loadDashboardData()

    return () => subscription.unsubscribe()
  }, [navigate])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Data de hoje
      const hoje = new Date()
      const hojeISO = hoje.toISOString().split('T')[0]
      
      // Primeiro dia do mês atual
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const primeiroDiaMesISO = primeiroDiaMes.toISOString().split('T')[0]

      // Carregar total de clientes
      const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })

      // Carregar agendamentos de hoje
      const { data: agendamentosHojeData, error: errorAgendamentos } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes!agendamentos_cliente_id_fkey(nome),
          procedimentos!agendamentos_procedimento_id_fkey(descricao)
        `)
        .eq('data', hojeISO)
        .eq('status', 'Agendado')
        .order('horario', { ascending: true })

      if (errorAgendamentos) throw errorAgendamentos

      // Carregar agendamentos concluídos do mês
      const { count: concluidosMes } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Concluído')
        .gte('data', primeiroDiaMesISO)

      // Organizar agendamentos de hoje por proximidade da data/hora atual
      const agora = new Date()
      const agendamentosFormatados = (agendamentosHojeData || []).map(ag => {
        const clienteData = Array.isArray(ag.clientes) ? ag.clientes[0] : ag.clientes
        const procedimentoData = Array.isArray(ag.procedimentos) ? ag.procedimentos[0] : ag.procedimentos
        
        // Criar objeto Date para o agendamento
        const [horas, minutos] = ag.horario.split(':').map(Number)
        const dataAgendamento = new Date(hoje)
        dataAgendamento.setHours(horas, minutos, 0, 0)

        return {
          id: ag.id,
          servico: procedimentoData?.descricao || 'Procedimento não encontrado',
          cliente: clienteData?.nome || 'Cliente não encontrado',
          data: hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
          horario: ag.horario,
          status: ag.status,
          observacoes: ag.observacoes,
          dataAgendamento: dataAgendamento.getTime() // Para ordenação
        }
      }).sort((a, b) => {
        // Ordenar por proximidade da data/hora atual (mais próximo primeiro)
        const diffA = Math.abs(a.dataAgendamento - agora.getTime())
        const diffB = Math.abs(b.dataAgendamento - agora.getTime())
        return diffA - diffB
      }).map(({ dataAgendamento, ...rest }) => rest) // Remover campo auxiliar

      // Encontrar próximo agendamento (mais próximo no futuro)
      const proximosFuturos = agendamentosFormatados.filter(ag => {
        const [horas, minutos] = ag.horario.split(':').map(Number)
        const dataAgendamento = new Date(hoje)
        dataAgendamento.setHours(horas, minutos, 0, 0)
        return dataAgendamento > agora
      })

      const proximo = proximosFuturos.length > 0 
        ? {
            horario: proximosFuturos[0].horario,
            cliente: proximosFuturos[0].cliente,
            servico: proximosFuturos[0].servico
          }
        : {
            horario: '--:--',
            cliente: 'Nenhum',
            servico: 'agendamento'
          }

      setStats({
        totalClientes: totalClientes || 0,
        agendamentosHoje: agendamentosFormatados.length,
        concluidosMes: concluidosMes || 0,
        proximo
      })

      setAgendamentosHoje(agendamentosFormatados)
    } catch (error: any) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

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
            <Button 
              size="sm" 
              onClick={() => navigate('/clientes/novo')}
              className="bg-rose-500 hover:bg-rose-600 text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Header Desktop */}
          <div className="hidden lg:flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-2">Dashboard</h1>
              <p className="text-slate-600">Bem-vinda! Aqui está o resumo da sua clínica.</p>
            </div>
            <Button 
              onClick={() => navigate('/clientes/novo')}
              className="bg-rose-500 hover:bg-rose-600 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>

          {/* Header Mobile - Título */}
          <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h1>
            <p className="text-sm text-slate-600">Bem-vinda! Aqui está o resumo da sua clínica.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8">
            {/* Total de Clientes */}
            <Card className="bg-white border-amber-200/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-600 mb-1">Total de Clientes</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.totalClientes}</p>
                    <p className="text-xs text-slate-500 mt-1">Cadastrados no sistema</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-amber-100 rounded-lg flex-shrink-0 ml-2">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agendamentos Hoje */}
            <Card className="bg-white border-amber-200/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-600 mb-1">Agendamentos Hoje</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.agendamentosHoje}</p>
                    <p className="text-xs text-slate-500 mt-1">Procedimentos programados</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-amber-100 rounded-lg flex-shrink-0 ml-2">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Concluídos */}
            <Card className="bg-white border-amber-200/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-600 mb-1">Concluídos</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.concluidosMes}</p>
                    <p className="text-xs text-slate-500 mt-1">Este mês</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-amber-100 rounded-lg flex-shrink-0 ml-2">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Próximo */}
            <Card className="bg-white border-amber-200/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-600 mb-1">Próximo</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.proximo.horario}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">{stats.proximo.cliente} - {stats.proximo.servico}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-amber-100 rounded-lg flex-shrink-0 ml-2">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agendamentos de Hoje */}
          <Card className="bg-white border-amber-200/50 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Agendamentos de Hoje</h2>
                <button 
                  onClick={() => navigate('/agendamentos')}
                  className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  Ver todos
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
                </div>
              ) : agendamentosHoje.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhum agendamento para hoje</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {agendamentosHoje.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-white to-amber-50/30 rounded-lg border border-amber-200/50 hover:border-amber-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 mb-2 sm:mb-1 text-sm sm:text-base">{agendamento.servico}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500 flex-shrink-0" />
                              <span className="font-medium text-slate-800 text-xs sm:text-sm truncate">{agendamento.cliente}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500 flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-slate-600">{agendamento.data}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500 flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-slate-600 font-medium">{agendamento.horario}</span>
                            </div>
                          </div>
                          {agendamento.observacoes && (
                            <p className="text-xs sm:text-sm text-slate-500">{agendamento.observacoes}</p>
                          )}
                        </div>
                      </div>
                      <span className="px-2 sm:px-3 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full border border-rose-200 self-start sm:self-auto">
                        {agendamento.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
