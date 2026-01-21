import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  Users, 
  Calendar,
  User,
  Menu,
  ArrowLeft,
  Phone,
  MapPin,
  Briefcase,
  Calendar as CalendarIcon,
  Scissors,
  Trash2,
  Camera
} from 'lucide-react'

export default function EditarCliente() {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()

  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    ocupacao: '',
    telefone: '',
    endereco: '',
    cpf: ''
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

    // Carregar dados do cliente
    if (id) {
      loadCliente(id)
    }

    return () => subscription.unsubscribe()
  }, [navigate, id])

  const loadCliente = async (clienteId: string) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single()

      if (error) throw error
      if (data) {
        setFormData({
          nome: data.nome || '',
          dataNascimento: data.data_nascimento || '',
          ocupacao: data.ocupacao || '',
          telefone: data.telefone || '',
          endereco: data.endereco || '',
          cpf: data.cpf || ''
        })
        setFotoUrl(data.foto_url || null)
      }
    } catch (error: any) {
      console.error('Erro ao carregar cliente:', error)
      alert('Erro ao carregar dados do cliente.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    
    setLoading(true)

    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nome: formData.nome,
          data_nascimento: formData.dataNascimento || null,
          ocupacao: formData.ocupacao || null,
          telefone: formData.telefone || null,
          endereco: formData.endereco || null,
          cpf: formData.cpf || null,
          foto_url: fotoUrl || null
        })
        .eq('id', id)

      if (error) throw error
      
      navigate('/clientes')
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error)
      alert('Erro ao atualizar cliente. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    
    if (!window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeleting(true)

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      navigate('/clientes')
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error)
      alert('Erro ao excluir cliente. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !id) return
    
    const file = e.target.files[0]
    
    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem')
      return
    }

    setUploadingFoto(true)
    
    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${id}-${Date.now()}.${fileExt}`
      const filePath = `clientes/${fileName}`

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('fotos-clientes')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('fotos-clientes')
        .getPublicUrl(filePath)

      // Atualizar estado local
      setFotoUrl(publicUrl)
      
      alert('Foto atualizada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto:', error)
      alert('Erro ao fazer upload da foto. Tente novamente.')
    } finally {
      setUploadingFoto(false)
      // Limpar input
      if (e.target) {
        e.target.value = ''
      }
    }
  }
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
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
        <div className="p-4 lg:p-6 border-b border-amber-200 flex items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <div>
          <img src="/assets/logo.png" width={150} alt="" />
            </div>
          </div>
        
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/dashboard') 
                ? 'bg-rose-100 border border-rose-200 text-slate-800 font-medium' 
                : 'text-slate-600 hover:bg-rose-100 hover:text-slate-800'
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
                : 'text-slate-600 hover:bg-rose-100 hover:text-slate-800'
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
                : 'text-slate-600 hover:bg-rose-100 hover:text-slate-800'
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
                : 'text-slate-600 hover:bg-rose-100 hover:text-slate-800'
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
            <div className="w-10" />
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/clientes')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm sm:text-base">Voltar para Clientes</span>
          </button>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">Editar Cliente</h1>
          <p className="text-slate-600 mb-8">Altere os dados pessoais do cliente</p>

          {/* Form Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-sm">
            <CardHeader className="flex items-center gap-3 pb-6">
              
              <h2 className="text-2xl font-bold text-slate-800">Editar Cliente</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Upload de Foto */}
                <div className="flex flex-col items-center mb-6 pb-6 border-b border-amber-200">
                  
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden border-2 border-rose-200">
                      {fotoUrl ? (
                        <img 
                          src={fotoUrl} 
                          alt={formData.nome || 'Cliente'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-rose-600" />
                      )}
                    </div>
                    <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFotoUpload}
                        disabled={uploadingFoto}
                      />
                      {uploadingFoto ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Clique na foto para alterar (máx. 5MB)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Nome completo"
                        className="pl-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                        required
                      />
                    </div>
                  </div>

                  {/* Data de Nascimento */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Data de Nascimento
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        type="date"
                        value={formData.dataNascimento}
                        onChange={(e) => setFormData(prev => ({ ...prev, dataNascimento: e.target.value }))}
                        className="pl-10 bg-white border-slate-200 text-slate-800 focus:border-amber-500 focus:ring-amber-500/20"
                        required
                      />
                    </div>
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Telefone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        type="tel"
                        value={formData.telefone}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                        className="pl-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                        required
                      />
                    </div>
                  </div>

                  {/* CPF */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      CPF
                    </label>
                    <Input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                      placeholder="000.000.000-00"
                      className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                      required
                    />
                  </div>

                  {/* Ocupação */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ocupação
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        type="text"
                        value={formData.ocupacao}
                        onChange={(e) => setFormData(prev => ({ ...prev, ocupacao: e.target.value }))}
                        placeholder="Profissão ou ocupação"
                        className="pl-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                        required
                      />
                    </div>
                  </div>

                  {/* Endereço */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Endereço
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        type="text"
                        value={formData.endereco}
                        onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                        placeholder="Rua, número, complemento"
                        className="pl-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-slate-200">
                  <Button 
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    variant="outline"
                    className="border-red-600/50 text-red-700 hover:bg-red-50 hover:border-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting ? 'Excluindo...' : 'Excluir Cliente'}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-rose-500 hover:bg-rose-600 text-white shadow-md"
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
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
