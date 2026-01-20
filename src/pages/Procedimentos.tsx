import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  Plus,
  Scissors
} from 'lucide-react'

export default function Procedimentos() {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [procedimentos, setProcedimentos] = useState<Array<{ id: string; descricao: string; valor?: string }>>([])
  const [formData, setFormData] = useState({
    descricao: ''
  })
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

    // Carregar procedimentos do Supabase
    loadProcedimentos()

    return () => subscription.unsubscribe()
  }, [navigate])

  const loadProcedimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('procedimentos')
        .select('*')
        .order('descricao', { ascending: true })

      if (error) throw error
      if (data) {
        setProcedimentos(data)
      }
    } catch (error: any) {
      console.error('Erro ao carregar procedimentos:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('procedimentos')
        .insert([{ descricao: formData.descricao }])
        .select()
        .single()

      if (error) throw error

      if (data) {
        setProcedimentos(prev => [...prev, data])
        setFormData({ descricao: '' })
      }
    } catch (error: any) {
      console.error('Erro ao cadastrar procedimento:', error)
      alert('Erro ao cadastrar procedimento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este procedimento?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('procedimentos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProcedimentos(prev => prev.filter(p => p.id !== id))
    } catch (error: any) {
      console.error('Erro ao excluir procedimento:', error)
      alert('Erro ao excluir procedimento. Tente novamente.')
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

          {/* Header Desktop */}
          <div className="hidden lg:flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-2">Procedimentos</h1>
              <p className="text-slate-600">Gerencie os procedimentos disponíveis</p>
            </div>
            <Button 
              onClick={() => setFormData({ descricao: '' })}
              className="bg-rose-500 hover:bg-rose-600 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Procedimento
            </Button>
          </div>

          {/* Header Mobile - Título */}
          <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Procedimentos</h1>
            <p className="text-sm text-slate-600">Gerencie os procedimentos disponíveis</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário de Cadastro */}
            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-rose-600" />
                  Cadastrar Procedimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Descrição
                    </label>
                    <Input
                      type="text"
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Nome do procedimento"
                      className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white shadow-md"
                  >
                    {loading ? 'Cadastrando...' : 'Cadastrar Procedimento'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista de Procedimentos */}
            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Procedimentos Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                {procedimentos.length === 0 ? (
                  <div className="text-center py-12">
                    <Scissors className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nenhum procedimento cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {procedimentos.map((procedimento) => (
                      <div
                        key={procedimento.id}
                        className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{procedimento.descricao}</p>
                        </div>
                        <Button
                          onClick={() => handleDelete(procedimento.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Excluir
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
