import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Sparkles, 
  LayoutDashboard, 
  Users, 
  Calendar,
  Menu,
  X,
  Plus,
  Edit,
  Clock,
  User,
  Scissors,
  Search,
  CheckCircle2,
  XCircle
} from 'lucide-react'

type Status = 'Todos' | 'Agendado' | 'Concluído' | 'Cancelado'

interface Agendamento {
  id: number
  cliente: string
  servico: string
  data: string
  horario: string
  status: 'Agendado' | 'Concluído' | 'Cancelado'
  telefone: string
}

export default function Agendamentos() {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status>('Todos')
  const navigate = useNavigate()
  const location = useLocation()

  // Dados mockados iniciais - substituir por dados reais do Supabase
  const agendamentosIniciais: Agendamento[] = [
    {
      id: 1,
      cliente: 'Ana Paula Silva',
      servico: 'Limpeza de Pele',
      data: '24/01/2026',
      horario: '14:00',
      status: 'Agendado',
      telefone: '(11) 99999-1111'
    },
    {
      id: 2,
      cliente: 'Maria Santos',
      servico: 'Microagulhamento',
      data: '24/01/2026',
      horario: '16:30',
      status: 'Agendado',
      telefone: '(11) 99999-2222'
    },
    {
      id: 3,
      cliente: 'Juliana Costa',
      servico: 'Tratamento Facial',
      data: '25/01/2026',
      horario: '09:00',
      status: 'Concluído',
      telefone: '(11) 99999-3333'
    },
    {
      id: 4,
      cliente: 'Carla Oliveira',
      servico: 'Depilação',
      data: '25/01/2026',
      horario: '11:00',
      status: 'Agendado',
      telefone: '(11) 99999-4444'
    },
    {
      id: 5,
      cliente: 'Fernanda Lima',
      servico: 'Massagem Relaxante',
      data: '26/01/2026',
      horario: '15:00',
      status: 'Cancelado',
      telefone: '(11) 99999-5555'
    }
  ]

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])

  // Carregar agendamentos do localStorage ou usar os iniciais
  const loadAgendamentos = () => {
    const stored = localStorage.getItem('agendamentos')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setAgendamentos(parsed)
      } catch {
        // Se houver erro ao parsear, usar os iniciais
        setAgendamentos(agendamentosIniciais)
        localStorage.setItem('agendamentos', JSON.stringify(agendamentosIniciais))
      }
    } else {
      setAgendamentos(agendamentosIniciais)
      localStorage.setItem('agendamentos', JSON.stringify(agendamentosIniciais))
    }
  }

  useEffect(() => {
    loadAgendamentos()
  }, [])

  // Recarregar quando voltar para esta página
  useEffect(() => {
    if (location.pathname === '/agendamentos') {
      loadAgendamentos()
    }
  }, [location.pathname])

  // Escutar mudanças no localStorage (quando um novo agendamento é criado em outra aba/página)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('agendamentos')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setAgendamentos(parsed)
        } catch {
          // Ignora erros
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    // Também verificar quando a página recebe foco (para atualizar se outra aba criou um agendamento)
    window.addEventListener('focus', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleStorageChange)
    }
  }, [])

  const updateStatus = (id: number, newStatus: 'Concluído' | 'Cancelado') => {
    setAgendamentos(prev => {
      const updated = prev.map(ag => ag.id === id ? { ...ag, status: newStatus } : ag)
      localStorage.setItem('agendamentos', JSON.stringify(updated))
      return updated
    })
    // Aqui você fará a atualização no Supabase
    // await supabase.from('agendamentos').update({ status: newStatus }).eq('id', id)
  }

  // Filtrar e ordenar agendamentos
  const agendamentosFiltrados = agendamentos
    .filter(ag => {
      // Filtro por status
      if (statusFilter !== 'Todos' && ag.status !== statusFilter) {
        return false
      }
      
      // Filtro por busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          ag.cliente.toLowerCase().includes(query) ||
          ag.servico.toLowerCase().includes(query) ||
          ag.telefone.includes(query) ||
          ag.data.includes(query)
        )
      }
      
      return true
    })
    .sort((a, b) => {
      // Se estiver na aba "Todos", ordenar primeiro por status, depois por data/hora
      if (statusFilter === 'Todos') {
        // Primeiro ordena por status: Agendado (1), Concluído (2), Cancelado (3)
        const statusOrder: Record<string, number> = {
          'Agendado': 1,
          'Concluído': 2,
          'Cancelado': 3
        }
        const statusComparison = (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999)
        if (statusComparison !== 0) {
          return statusComparison
        }
        
        // Se o status for igual, ordena por proximidade da data/hora atual
        const parseDateTime = (dateStr: string, timeStr: string) => {
          // Converter data de "DD/MM/AAAA" e hora "HH:MM" para timestamp
          const [day, month, year] = dateStr.split('/').map(Number)
          const [hours, minutes] = timeStr.split(':').map(Number)
          return new Date(year, month - 1, day, hours, minutes).getTime()
        }
        
        const now = Date.now()
        const dateTimeA = parseDateTime(a.data, a.horario)
        const dateTimeB = parseDateTime(b.data, b.horario)
        
        // Calcular diferença absoluta em relação ao tempo atual
        const diffA = Math.abs(dateTimeA - now)
        const diffB = Math.abs(dateTimeB - now)
        
        // Menor diferença = mais próximo do atual = aparece primeiro
        return diffA - diffB
      }
      
      // Se não estiver na aba "Todos", ordenar apenas por data/hora (mais próximo primeiro)
      const parseDateTime = (dateStr: string, timeStr: string) => {
        const [day, month, year] = dateStr.split('/').map(Number)
        const [hours, minutes] = timeStr.split(':').map(Number)
        return new Date(year, month - 1, day, hours, minutes).getTime()
      }
      
      const now = Date.now()
      const dateTimeA = parseDateTime(a.data, a.horario)
      const dateTimeB = parseDateTime(b.data, b.horario)
      
      const diffA = Math.abs(dateTimeA - now)
      const diffB = Math.abs(dateTimeB - now)
      
      return diffA - diffB
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'Agendado':
        return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'Cancelado':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

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

    return () => subscription.unsubscribe()
  }, [navigate])

  // Atualizar lista quando a página receber foco (quando voltar de criar/editar agendamento)
  useEffect(() => {
    const handleFocus = () => {
      const stored = localStorage.getItem('agendamentos')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setAgendamentos(parsed)
        } catch {
          // Ignora erros
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const isActive = (path: string) => location.pathname === path

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/30">
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

          {/* Header Desktop */}
          <div className="hidden lg:flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-2">Agendamentos</h1>
              <p className="text-slate-600">Gerencie os agendamentos e procedimentos</p>
            </div>
            <Button 
              onClick={() => navigate('/clientes')}
              className="bg-rose-500 hover:bg-rose-600 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>

          {/* Header Mobile - Título */}
          <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Agendamentos</h1>
            <p className="text-sm text-slate-600">Gerencie os agendamentos e procedimentos</p>
          </div>

          {/* Botão Novo Agendamento Mobile */}
          <div className="lg:hidden mb-6">
            <Button 
              onClick={() => navigate('/clientes')}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por cliente, serviço, data ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 h-12"
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => setStatusFilter('Todos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'Todos'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('Agendado')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'Agendado'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              Agendados
            </button>
            <button
              onClick={() => setStatusFilter('Concluído')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'Concluído'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              Concluídos
            </button>
            <button
              onClick={() => setStatusFilter('Cancelado')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'Cancelado'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              Cancelados
            </button>
          </div>

          {/* Lista de Agendamentos */}
          {agendamentosFiltrados.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-sm">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg mb-2">Nenhum agendamento encontrado</p>
                  <p className="text-sm text-slate-400">
                    {searchQuery || statusFilter !== 'Todos' 
                      ? 'Tente ajustar os filtros de busca' 
                      : 'Os agendamentos aparecerão aqui'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {agendamentosFiltrados.map((agendamento) => (
                <Card 
                  key={agendamento.id}
                  className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-sm hover:shadow-md transition-all"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      {/* Informações do Agendamento */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                              <Calendar className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-800 text-lg mb-1">{agendamento.cliente}</h3>
                              <p className="text-slate-700 font-medium mb-2">{agendamento.servico}</p>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-slate-400" />
                                  <span>{agendamento.data}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-slate-400" />
                                  <span className="font-medium">{agendamento.horario}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-slate-400" />
                                  <span>{agendamento.telefone}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex-shrink-0">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(agendamento.status)}`}>
                            {agendamento.status}
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-100">
                        <Button
                          onClick={() => navigate(`/agendamentos/${agendamento.id}/editar`)}
                          variant="outline"
                          size="sm"
                          className="border-amber-600/50 text-amber-700 hover:bg-amber-50 hover:border-amber-600"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Alterar
                        </Button>
                        {agendamento.status === 'Agendado' && (
                          <>
                            <Button
                              onClick={() => updateStatus(agendamento.id, 'Concluído')}
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Concluir
                            </Button>
                            <Button
                              onClick={() => updateStatus(agendamento.id, 'Cancelado')}
                              size="sm"
                              variant="outline"
                              className="border-red-600/50 text-red-700 hover:bg-red-50 hover:border-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
