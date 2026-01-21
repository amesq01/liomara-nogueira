import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  Users, 
  Calendar,
  User,
  Plus,
  Menu,
  Search,
  ChevronRight,
  Scissors,
  Edit
} from 'lucide-react'

export default function Clientes() {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

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

  const [clientes, setClientes] = useState<Array<{
    id: string
    nome: string
    telefone: string | null
    endereco: string | null
    cpf: string | null
    dataNascimento: string | null
    ocupacao: string | null
    fotoUrl: string | null
  }>>([])

  // Carregar clientes do Supabase
  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error
      if (data) {
        setClientes(data.map(cliente => ({
          id: cliente.id,
          nome: cliente.nome,
          telefone: cliente.telefone || '',
          endereco: cliente.endereco || '',
          cpf: cliente.cpf || '',
          dataNascimento: cliente.data_nascimento 
            ? (() => {
                const [ano, mes, dia] = cliente.data_nascimento.split('-').map(Number)
                return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR')
              })()
            : null,
          ocupacao: cliente.ocupacao || '',
          fotoUrl: cliente.foto_url || null
        })))
      }
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  useEffect(() => {
    loadClientes()
  }, [])

  // Filtrar clientes baseado na busca
  const clientesFiltrados = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cliente.telefone && cliente.telefone.includes(searchQuery)) ||
    (cliente.cpf && cliente.cpf.includes(searchQuery))
  )

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
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
        <div className="p-4 lg:p-6 border-b border-amber-200 flex items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <div>
              <img src="/assets/logo.png" width={150} alt="" />
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-amber-100 rounded-lg transition-colors"
          >
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
                ? 'bg-rose-300 border border-rose-200 text-slate-800 font-medium' 
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
          <button onClick={handleLogout} className='bg-neutral-400 hover:bg-neutral-500 mt-5 text-white shadow-md w-full p-2 rounded-lg'>
            <p className='text-white font-medium'>Sair</p>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-amber-200">
          <p className="text-xs text-slate-500">© @amesq01</p>
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
              <img src="/assets/logo.png" width={25} alt="" />
              <h1 className="text-lg font-bold text-slate-800">Liomara Nogueira - Estética Avançada</h1>
            </div>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/clientes/novo')}
                  className="bg-rose-400 hover:bg-rose-600 text-white shadow-md"
                >
              <Plus className="h-4 w-4" />
              <p className='ml-2'>Novo Cliente</p>
            </Button>
          </div>

          {/* Header Desktop */}
          <div className="hidden lg:flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-2">Clientes</h1>
              <p className="text-slate-600">Gerencie seus clientes e fichas de anamnese</p>
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
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Clientes</h1>
            <p className="text-sm text-slate-600">Gerencie seus clientes e fichas de anamnese</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por nome, telefone ou CPF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 h-12"
              />
            </div>
          </div>

          {/* Client List */}
          <div className="space-y-3">
            {clientesFiltrados.length === 0 ? (
              <Card className="bg-white border-amber-200/50 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhum cliente encontrado</p>
                </CardContent>
              </Card>
            ) : (
              clientesFiltrados.map((cliente) => (
                <Card 
                  key={cliente.id}
                  className="bg-white border-amber-200/50 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-amber-300"
                  onClick={() => navigate(`/clientes/${cliente.id}/anamnese`)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden border-2 border-rose-200">
                          {cliente.fotoUrl ? (
                            <img 
                              src={cliente.fotoUrl} 
                              alt={cliente.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 sm:h-7 sm:w-7 text-rose-600" />
                          )}
                        </div>
                      </div>

                      {/* Client Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-1 truncate">
                          {cliente.nome}
                        </h3>
                        <p className="text-sm text-slate-600 mb-1 truncate">{cliente.telefone || 'Sem telefone'}</p>
                        <p className="text-sm text-slate-600 truncate">{cliente.endereco || 'Sem endereço'}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          onClick={() => navigate(`/clientes/${cliente.id}/editar`)}
                          variant="outline"
                          size="sm"
                          className="border-amber-600/50 text-amber-700 hover:bg-amber-50 hover:border-amber-600"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Editar Cliente</span>
                          <span className="sm:hidden">Editar</span>
                        </Button>
                        <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
