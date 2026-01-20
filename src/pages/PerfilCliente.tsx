import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  Sparkles, 
  LayoutDashboard, 
  Users, 
  Calendar,
  User,
  Menu,
  X,
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  Scissors
} from 'lucide-react'

interface QuestionState {
  value: 'sim' | 'nao' | null
  especifique?: string
}

export default function PerfilCliente() {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()

  // Estado para todas as perguntas
  const [questions, setQuestions] = useState<Record<string, QuestionState>>({})
  const [questionsCorporal, setQuestionsCorporal] = useState<Record<string, QuestionState>>({})
  const [skinAssessment, setSkinAssessment] = useState<Record<string, boolean | string>>({})
  
  // Estado para anotações
  interface Anotacao {
    id: string
    data: string
    horario: string
    descricao: string
  }
  const [anotacoesFacial, setAnotacoesFacial] = useState<Anotacao[]>([])
  const [anotacoesCorporal, setAnotacoesCorporal] = useState<Anotacao[]>([])
  const [novaAnotacaoFacial, setNovaAnotacaoFacial] = useState('')
  const [novaAnotacaoCorporal, setNovaAnotacaoCorporal] = useState('')
  
  // Estado para medidas antropométricas
  const [medidas, setMedidas] = useState({
    altura: '',
    pesoInicial: '',
    pesoFinal: '',
    observacoes: '',
    observacoesMedidas: '',
    medidas: {} as Record<string, { inicio?: string; termino?: string }>
  })

  const updateQuestion = (key: string, value: 'sim' | 'nao', especifique?: string) => {
    setQuestions(prev => ({
      ...prev,
      [key]: { value, especifique: especifique || prev[key]?.especifique }
    }))
  }

  const updateEspecifique = (key: string, value: string) => {
    setQuestions(prev => ({
      ...prev,
      [key]: { ...prev[key], especifique: value }
    }))
  }

  const updateQuestionCorporal = (key: string, value: 'sim' | 'nao', especifique?: string) => {
    setQuestionsCorporal(prev => ({
      ...prev,
      [key]: { value, especifique: especifique || prev[key]?.especifique }
    }))
  }

  const updateEspecifiqueCorporal = (key: string, value: string) => {
    setQuestionsCorporal(prev => ({
      ...prev,
      [key]: { ...prev[key], especifique: value }
    }))
  }

  const updateMedida = (parte: string, tipo: 'inicio' | 'termino', valor: string) => {
    setMedidas(prev => ({
      ...prev,
      medidas: {
        ...prev.medidas,
        [parte]: {
          ...prev.medidas[parte],
          [tipo]: valor
        }
      }
    }))
  }

  // Calcular IMC
  const calcularIMC = () => {
    const altura = parseFloat(medidas.altura) / 100 // converter cm para metros
    // Usar peso final se preenchido, senão usar peso inicial
    const peso = parseFloat(medidas.pesoFinal) || parseFloat(medidas.pesoInicial)
    
    if (!altura || !peso || altura <= 0 || peso <= 0) {
      return null
    }
    
    const imc = peso / (altura * altura)
    return imc
  }

  const getClassificacaoIMC = (imc: number) => {
    if (imc < 18.5) return { texto: 'Abaixo do peso', cor: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
    if (imc < 25) return { texto: 'Peso ideal', cor: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
    if (imc < 30) return { texto: 'Sobrepeso', cor: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
    if (imc < 35) return { texto: 'Obesidade Grau I', cor: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' }
    if (imc < 40) return { texto: 'Obesidade Grau II', cor: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
    return { texto: 'Obesidade Grau III', cor: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' }
  }

  // Funções para adicionar anotações
  const adicionarAnotacaoFacial = () => {
    if (novaAnotacaoFacial.trim()) {
      const agora = new Date()
      const dataAtual = agora.toLocaleDateString('pt-BR')
      const horarioAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      const novaAnotacao: Anotacao = {
        id: Date.now().toString(),
        data: dataAtual,
        horario: horarioAtual,
        descricao: novaAnotacaoFacial.trim()
      }
      setAnotacoesFacial(prev => [novaAnotacao, ...prev])
      setNovaAnotacaoFacial('')
    }
  }

  const adicionarAnotacaoCorporal = () => {
    if (novaAnotacaoCorporal.trim()) {
      const agora = new Date()
      const dataAtual = agora.toLocaleDateString('pt-BR')
      const horarioAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      const novaAnotacao: Anotacao = {
        id: Date.now().toString(),
        data: dataAtual,
        horario: horarioAtual,
        descricao: novaAnotacaoCorporal.trim()
      }
      setAnotacoesCorporal(prev => [novaAnotacao, ...prev])
      setNovaAnotacaoCorporal('')
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

  const [cliente, setCliente] = useState<{
    id: string
    nome: string
    telefone: string | null
    dataNascimento: string | null
    ocupacao: string | null
    endereco: string | null
    cpf: string | null
    clienteDesde: string
  } | null>(null)

  // Carregar dados do cliente e anamneses
  useEffect(() => {
    if (id) {
      loadCliente(id)
      loadAnamneses(id)
    }
  }, [id])

  const loadCliente = async (clienteId: string) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single()

      if (error) throw error
      if (data) {
        const dataNascimentoFormatada = data.data_nascimento 
          ? new Date(data.data_nascimento).toLocaleDateString('pt-BR')
          : null
        
        const clienteDesde = data.cliente_desde
          ? new Date(data.cliente_desde).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          : 'Data não disponível'

        setCliente({
          id: data.id,
          nome: data.nome,
          telefone: data.telefone,
          dataNascimento: dataNascimentoFormatada,
          ocupacao: data.ocupacao,
          endereco: data.endereco,
          cpf: data.cpf,
          clienteDesde
        })
      }
    } catch (error: any) {
      console.error('Erro ao carregar cliente:', error)
      alert('Erro ao carregar dados do cliente.')
    }
  }

  const loadAnamneses = async (clienteId: string) => {
    try {
      // Carregar anamnese facial
      const { data: facialData } = await supabase
        .from('anamneses')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('tipo', 'facial')
        .single()

      if (facialData) {
        // Preencher estados com dados da anamnese facial
        if (facialData.historico_saude) {
          setQuestions(facialData.historico_saude)
        }
        if (facialData.avaliacao_pele) {
          setSkinAssessment(facialData.avaliacao_pele)
        }
        if (facialData.anotacoes && Array.isArray(facialData.anotacoes)) {
          setAnotacoesFacial(facialData.anotacoes)
        }
      }

      // Carregar anamnese corporal
      const { data: corporalData } = await supabase
        .from('anamneses')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('tipo', 'corporal')
        .single()

      if (corporalData) {
        // Preencher estados com dados da anamnese corporal
        if (corporalData.historico_saude) {
          setQuestionsCorporal(corporalData.historico_saude)
        }
        if (corporalData.medidas_antropometricas) {
          const medidasData = corporalData.medidas_antropometricas
          setMedidas({
            altura: medidasData.altura || '',
            pesoInicial: medidasData.pesoInicial || '',
            pesoFinal: medidasData.pesoFinal || '',
            observacoes: medidasData.observacoes || '',
            observacoesMedidas: medidasData.observacoesMedidas || '',
            medidas: medidasData.medidas || {}
          })
        }
        if (corporalData.anotacoes && Array.isArray(corporalData.anotacoes)) {
          setAnotacoesCorporal(corporalData.anotacoes)
        }
      }
    } catch (error: any) {
      // Não é erro se não existir anamnese ainda
      if (error.code !== 'PGRST116') {
        console.error('Erro ao carregar anamneses:', error)
      }
    }
  }

  const isActive = (path: string) => location.pathname === path

  if (!user || !cliente) {
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
            onClick={() => navigate('/clientes')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm sm:text-base">Voltar para Clientes</span>
          </button>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-8">Perfil do Cliente</h1>

          {/* Client Information Card */}
          <Card className="bg-white border-amber-200/50 shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                {/* Avatar */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-10 w-10 sm:h-12 sm:w-12 text-rose-600" />
                </div>
                
                {/* Client Info */}
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">{cliente.nome}</h2>
                  <p className="text-slate-600">Cliente desde {cliente.clienteDesde}</p>
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-700">{cliente.telefone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-700">{cliente.dataNascimento}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-700">{cliente.endereco}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-700">{cliente.ocupacao}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-700">{cliente.cpf}</span>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                onClick={() => navigate(`/agendamentos/novo?cliente=${cliente.id}&nome=${encodeURIComponent(cliente.nome)}`)}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white shadow-md"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Procedimento
              </Button>
            </CardContent>
          </Card>

          {/* Anamnesis Form Section */}
          <Card className="bg-white border-amber-200/50 shadow-sm">
            <CardContent className="p-6">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-6 w-6 text-amber-600" />
                <h2 className="text-2xl font-bold text-slate-800">Ficha de Anamnese</h2>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="facial" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="facial">
                    Anamnese Facial
                  </TabsTrigger>
                  <TabsTrigger value="corporal">
                    Anamnese Corporal
                  </TabsTrigger>
                </TabsList>

                {/* Anamnese Facial Tab */}
                <TabsContent value="facial" className="space-y-6">
                  {/* Histórico de Saúde e Estilo de Vida */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Histórico de Saúde e Estilo de Vida</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Coluna Esquerda */}
                      <div className="space-y-4">
                        {/* Utiliza lentes de contato */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Utiliza lentes de contato?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('lentes_contato', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.lentes_contato?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('lentes_contato', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.lentes_contato?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Tem epilepsia / convulsões */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Tem epilepsia / convulsões?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('epilepsia', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.epilepsia?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('epilepsia', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.epilepsia?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Funcionamento intestinal regular */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Funcionamento intestinal regular?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('intestino', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.intestino?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('intestino', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.intestino?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Tratamento facial anterior */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Tratamento facial anterior?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('tratamento_facial', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.tratamento_facial?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('tratamento_facial', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.tratamento_facial?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questions.tratamento_facial?.especifique || ''}
                            onChange={(e) => updateEspecifique('tratamento_facial', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Ingere água com frequência */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Ingere água com frequência?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('agua', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.agua?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('agua', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.agua?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questions.agua?.especifique || ''}
                            onChange={(e) => updateEspecifique('agua', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Ingere bebida alcoólica */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Ingere bebida alcoólica?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('alcool', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.alcool?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('alcool', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.alcool?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questions.alcool?.especifique || ''}
                            onChange={(e) => updateEspecifique('alcool', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Exposição ao sol */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Exposição ao sol?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('sol', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.sol?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('sol', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.sol?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="FREQUÊNCIA:"
                            value={questions.sol?.especifique || ''}
                            onChange={(e) => updateEspecifique('sol', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Está no período menstrual */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Está no período menstrual?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('menstrual', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.menstrual?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('menstrual', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.menstrual?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="DATA DA MENSTRUAÇÃO:"
                            value={questions.menstrual?.especifique || ''}
                            onChange={(e) => updateEspecifique('menstrual', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Boa qualidade de sono */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Boa qualidade de sono?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('sono', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.sono?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('sono', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.sono?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="HORAS POR NOITE:"
                            value={questions.sono?.especifique || ''}
                            onChange={(e) => updateEspecifique('sono', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Possui prótese corporal/facial */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Possui prótese corporal/facial?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('protese', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.protese?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('protese', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.protese?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questions.protese?.especifique || ''}
                            onChange={(e) => updateEspecifique('protese', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      {/* Coluna Direita */}
                      <div className="space-y-4">
                        {/* Tabagismo */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Tabagismo?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('tabagismo', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.tabagismo?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('tabagismo', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.tabagismo?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Alterações cardíacas */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Alterações cardíacas?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('cardiacas', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.cardiacas?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('cardiacas', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.cardiacas?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Portador de marcapasso */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Portador de marcapasso?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('marcapasso', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.marcapasso?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('marcapasso', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.marcapasso?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Gestante */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Gestante?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('gestante', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.gestante?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('gestante', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.gestante?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="SEMANAS:"
                            value={questions.gestante?.especifique || ''}
                            onChange={(e) => updateEspecifique('gestante', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Cremes ou loções faciais */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Cremes ou loções faciais?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('cremes', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.cremes?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('cremes', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.cremes?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questions.cremes?.especifique || ''}
                            onChange={(e) => updateEspecifique('cremes', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Pratica atividade física */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Pratica atividade física?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('atividade_fisica', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.atividade_fisica?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('atividade_fisica', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.atividade_fisica?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questions.atividade_fisica?.especifique || ''}
                            onChange={(e) => updateEspecifique('atividade_fisica', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Utiliza anticoncepcional */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Utiliza anticoncepcional?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('anticoncepcional', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.anticoncepcional?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('anticoncepcional', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.anticoncepcional?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="QUAL?"
                            value={questions.anticoncepcional?.especifique || ''}
                            onChange={(e) => updateEspecifique('anticoncepcional', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Possui algum tipo de alergia */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Possui algum tipo de alergia?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('alergia', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.alergia?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('alergia', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.alergia?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questions.alergia?.especifique || ''}
                            onChange={(e) => updateEspecifique('alergia', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Possui uma boa alimentação */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Possui uma boa alimentação?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('alimentacao', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.alimentacao?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('alimentacao', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.alimentacao?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questions.alimentacao?.especifique || ''}
                            onChange={(e) => updateEspecifique('alimentacao', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Problemas de pele */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Problemas de pele?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestion('problemas_pele', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questions.problemas_pele?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestion('problemas_pele', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questions.problemas_pele?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questions.problemas_pele?.especifique || ''}
                            onChange={(e) => updateEspecifique('problemas_pele', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Declaração */}
                  <div className="border-t border-slate-200 pt-6 mt-6">
                    <p className="text-sm text-slate-600 mb-4 italic">
                      Declaro que as informações acima são verdadeiras, não cabendo ao profissional qualquer responsabilidades por informações omitidas nessa avaliação.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        placeholder="DATA: ___/___/___"
                        className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                      />
                      <Input
                        placeholder="ASSINATURA: _______________"
                        className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  {/* Avaliação da Pele */}
                  <div className="border-t-2 border-rose-300 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Avaliação da Pele</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Coluna Esquerda */}
                      <div className="space-y-4">
                        {/* Oleosidade */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Oleosidade:</label>
                          <div className="flex flex-wrap gap-2">
                            {['ALIPÍDICA', 'LIPÍDICA', 'NORMAL', 'SEBORRÉICA'].map((opcao) => (
                              <button
                                key={opcao}
                                onClick={() => setSkinAssessment(prev => ({ ...prev, oleosidade: opcao }))}
                                className={`px-3 py-1 text-xs rounded border ${
                                  skinAssessment.oleosidade === opcao
                                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                {opcao}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Espessura */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Espessura:</label>
                          <div className="flex flex-wrap gap-2">
                            {['ESPESSA', 'FINA', 'MUITO FINA'].map((opcao) => (
                              <button
                                key={opcao}
                                onClick={() => setSkinAssessment(prev => ({ ...prev, espessura: opcao }))}
                                className={`px-3 py-1 text-xs rounded border ${
                                  skinAssessment.espessura === opcao
                                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                {opcao}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Fototipo */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Fototipo:</label>
                          <div className="flex flex-wrap gap-2">
                            {['I', 'II', 'III', 'IV', 'V', 'VI'].map((opcao) => (
                              <button
                                key={opcao}
                                onClick={() => setSkinAssessment(prev => ({ ...prev, fototipo: opcao }))}
                                className={`px-3 py-1 text-xs rounded border ${
                                  skinAssessment.fototipo === opcao
                                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                {opcao}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Condições da Pele */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Condições da Pele:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['MILLIUM', 'COMEDÃO', 'PÁPULA', 'PÚSTULA', 'CISTOS', 'HIPERTRICOSE', 'PTOSE', 'RUGAS', 'ACROMIA', 'HIPERCROMIA', 'FOLICULITE', 'QUERATOSE', 'CICATRIZ', 'ATROFIA', 'XANTELASMA', 'QUELÓIDE', 'TUMOR', 'NEVO CARDÍACO', 'NEVO MELANÓCITO', 'VERRUGA PLANA'].map((condicao) => (
                              <button
                                key={condicao}
                                onClick={() => setSkinAssessment(prev => ({ ...prev, [condicao]: !prev[condicao] }))}
                                className={`px-2 py-1 text-xs rounded border text-left ${
                                  skinAssessment[condicao]
                                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                {condicao}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Coluna Direita */}
                      <div className="space-y-4">
                        {/* Acne Grau */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Acne Grau:</label>
                          <div className="flex flex-wrap gap-2">
                            {['I', 'II', 'III', 'IV', 'V'].map((opcao) => (
                              <button
                                key={opcao}
                                onClick={() => setSkinAssessment(prev => ({ ...prev, acne_grau: opcao }))}
                                className={`px-3 py-1 text-xs rounded border ${
                                  skinAssessment.acne_grau === opcao
                                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                {opcao}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Hidratação */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Hidratação:</label>
                          <div className="flex flex-wrap gap-2">
                            {['DESIDRATADA', 'NORMAL'].map((opcao) => (
                              <button
                                key={opcao}
                                onClick={() => setSkinAssessment(prev => ({ ...prev, hidratacao: opcao }))}
                                className={`px-3 py-1 text-xs rounded border ${
                                  skinAssessment.hidratacao === opcao
                                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                {opcao}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Outros */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Outros:</label>
                          <Input
                            placeholder=""
                            className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Mais Condições da Pele */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Outras Condições:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['PAPILOMA', 'EFÉLIDES', 'BOLHAS', 'ABCESSOS', 'HIRSUTISMO', 'NÓDULOS', 'VIBÍCES', 'TELANGIECTASIA', 'HIPOCROMIA', 'RETIRADA DE SINAL'].map((condicao) => (
                              <button
                                key={condicao}
                                onClick={() => setSkinAssessment(prev => ({ ...prev, [condicao]: !prev[condicao] }))}
                                className={`px-2 py-1 text-xs rounded border text-left ${
                                  skinAssessment[condicao]
                                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                {condicao}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Anotações */}
                  <div className="border-t border-slate-200 pt-6 mt-6">
                    <label className="block text-lg font-semibold text-slate-800 mb-4">Anotações:</label>
                    
                    {/* Lista de Anotações Cadastradas */}
                    {anotacoesFacial.length > 0 && (
                      <div className="mb-4 space-y-3">
                        {anotacoesFacial.map((anotacao) => (
                          <div key={anotacao.id} className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                            <p className="text-slate-800">
                              <span className="font-bold">{anotacao.data}</span>
                              <span className="font-bold"> - {anotacao.horario}</span>
                              <span className="italic"> - {anotacao.descricao}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Campo para Nova Anotação */}
                    <textarea
                      value={novaAnotacaoFacial}
                      onChange={(e) => setNovaAnotacaoFacial(e.target.value)}
                      placeholder="Digite uma nova anotação e clique em 'Salvar Anamnese' para adicioná-la..."
                      className="w-full min-h-[120px] px-3 py-2 rounded-md border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 resize-none"
                    />
                  </div>
                </TabsContent>

                {/* Anamnese Corporal Tab */}
                <TabsContent value="corporal" className="space-y-6">
                  {/* Histórico de Saúde e Estilo de Vida */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Histórico de Saúde e Estilo de Vida</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Coluna Esquerda */}
                      <div className="space-y-4">
                        {/* Diabetes */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Diabetes?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('diabetes', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.diabetes?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('diabetes', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.diabetes?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Tem epilepsia / convulsões */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Tem epilepsia / convulsões?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('epilepsia', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.epilepsia?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('epilepsia', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.epilepsia?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Funcionamento intestinal regular */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Funcionamento intestinal regular?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('intestino', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.intestino?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('intestino', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.intestino?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Tratamento corporal anterior */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Tratamento corporal anterior?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('tratamento_corporal', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.tratamento_corporal?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('tratamento_corporal', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.tratamento_corporal?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questionsCorporal.tratamento_corporal?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('tratamento_corporal', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Ingere água com frequência */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Ingere água com frequência?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('agua', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.agua?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('agua', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.agua?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questionsCorporal.agua?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('agua', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Ingere bebida alcoólica */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Ingere bebida alcoólica?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('alcool', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.alcool?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('alcool', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.alcool?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questionsCorporal.alcool?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('alcool', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Exposição ao sol */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Exposição ao sol?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('sol', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.sol?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('sol', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.sol?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="FREQUÊNCIA:"
                            value={questionsCorporal.sol?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('sol', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Está no período menstrual */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Está no período menstrual?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('menstrual', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.menstrual?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('menstrual', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.menstrual?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="DATA DA MENSTRUAÇÃO:"
                            value={questionsCorporal.menstrual?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('menstrual', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Boa qualidade de sono */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Boa qualidade de sono?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('sono', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.sono?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('sono', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.sono?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="HORAS POR NOITE:"
                            value={questionsCorporal.sono?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('sono', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Possui prótese corporal/facial */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Possui prótese corporal/facial?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('protese', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.protese?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('protese', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.protese?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questionsCorporal.protese?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('protese', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      {/* Coluna Direita */}
                      <div className="space-y-4">
                        {/* Tabagismo */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Tabagismo?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('tabagismo', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.tabagismo?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('tabagismo', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.tabagismo?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Alterações cardíacas */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Alterações cardíacas?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('cardiacas', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.cardiacas?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('cardiacas', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.cardiacas?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Portador de marcapasso */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Portador de marcapasso?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('marcapasso', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.marcapasso?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('marcapasso', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.marcapasso?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Gestante */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Gestante?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('gestante', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.gestante?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('gestante', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.gestante?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="SEMANAS:"
                            value={questionsCorporal.gestante?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('gestante', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Cremes ou loções corporais */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Cremes ou loções corporais?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('cremes', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.cremes?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('cremes', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.cremes?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questionsCorporal.cremes?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('cremes', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Pratica atividade física */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Pratica atividade física?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('atividade_fisica', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.atividade_fisica?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('atividade_fisica', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.atividade_fisica?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questionsCorporal.atividade_fisica?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('atividade_fisica', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Utiliza anticoncepcional */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Utiliza anticoncepcional?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('anticoncepcional', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.anticoncepcional?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('anticoncepcional', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.anticoncepcional?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="QUAL?"
                            value={questionsCorporal.anticoncepcional?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('anticoncepcional', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Possui algum tipo de alergia */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Possui algum tipo de alergia?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('alergia', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.alergia?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('alergia', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.alergia?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questionsCorporal.alergia?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('alergia', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Possui uma boa alimentação */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Possui uma boa alimentação?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('alimentacao', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.alimentacao?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('alimentacao', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.alimentacao?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questionsCorporal.alimentacao?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('alimentacao', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Problemas de pele */}
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <label className="text-sm font-medium text-slate-700 flex-1">Problemas de pele?</label>
                            <div className="flex gap-4">
                              <button
                                onClick={() => updateQuestionCorporal('problemas_pele', 'sim')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.problemas_pele?.value === 'sim'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                SIM
                              </button>
                              <button
                                onClick={() => updateQuestionCorporal('problemas_pele', 'nao')}
                                className={`px-3 py-1 rounded border ${
                                  questionsCorporal.problemas_pele?.value === 'nao'
                                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                NÃO
                              </button>
                            </div>
                          </div>
                          <Input
                            placeholder="ESPECIFIQUE:"
                            value={questionsCorporal.problemas_pele?.especifique || ''}
                            onChange={(e) => updateEspecifiqueCorporal('problemas_pele', e.target.value)}
                            className="mt-2 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Declaração */}
                  <div className="border-t border-slate-200 pt-6 mt-6">
                    <p className="text-sm text-slate-600 mb-4 italic">
                      Declaro que as informações acima são verdadeiras, não cabendo ao profissional qualquer responsabilidades por informações omitidas nessa avaliação.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        placeholder="DATA: ___/___/___"
                        className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                      />
                      <Input
                        placeholder="ASSINATURA: _______________"
                        className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  {/* Medidas Antropométricas */}
                  <div className="border-t-2 border-rose-300 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Medidas Antropométricas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                      {/* Silhueta e IMC - Coluna Esquerda */}
                      <div className="md:col-span-3 space-y-4">
                        {/* Silhueta do Corpo Humano */}
                        <div className="flex items-center justify-center">
                          <div className="w-32 h-80 bg-white flex items-center justify-center border-4 border-black p-2">
                            <svg
                              viewBox="0 0 100 200"
                              className="w-full h-full"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              {/* Silhueta Masculina/Neutra em Bege/Pêssego */}
                              {/* Cabeça */}
                              <ellipse cx="50" cy="12" rx="11" ry="13" fill="#F5D5C8" stroke="#E8C4B0" strokeWidth="2"/>
                              
                              {/* Orelhas */}
                              <ellipse cx="38" cy="15" rx="3" ry="5" fill="#F5D5C8" stroke="#E8C4B0" strokeWidth="1.5"/>
                              <ellipse cx="62" cy="15" rx="3" ry="5" fill="#F5D5C8" stroke="#E8C4B0" strokeWidth="1.5"/>
                              
                              {/* Pescoço */}
                              <rect x="46" y="22" width="8" height="6" fill="#F5D5C8" stroke="#E8C4B0" strokeWidth="1.5"/>
                              
                              {/* Torso - Ombro largo, cintura definida */}
                              <path
                                d="M 50 28 Q 32 28 28 45 Q 26 60 28 75 Q 30 90 32 100 Q 34 110 36 115 Q 38 120 40 122 L 60 122 Q 62 120 64 115 Q 66 110 68 100 Q 70 90 72 75 Q 74 60 72 45 Q 68 28 50 28 Z"
                                fill="#F5D5C8"
                                stroke="#E8C4B0"
                                strokeWidth="2"
                              />
                              
                              {/* Indicação de músculos abdominais */}
                              <path
                                d="M 40 85 L 60 85 M 40 95 L 60 95"
                                stroke="#E8C4B0"
                                strokeWidth="1"
                                opacity="0.5"
                              />
                              
                              {/* Braço Esquerdo - Musculoso */}
                              <path
                                d="M 28 45 Q 18 48 12 58 Q 8 68 10 78 Q 12 88 16 95"
                                fill="none"
                                stroke="#E8C4B0"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                              />
                              <ellipse cx="14" cy="98" rx="6" ry="9" fill="#F5D5C8" stroke="#E8C4B0" strokeWidth="2"/>
                              
                              {/* Mão Esquerda */}
                              <path
                                d="M 10 105 Q 8 108 9 110 Q 10 112 12 113 M 9 110 Q 7 112 8 114 Q 9 116 11 117 M 8 114 Q 6 116 7 118 Q 8 120 10 121 M 7 118 Q 5 120 6 122 Q 7 124 9 125"
                                fill="none"
                                stroke="#E8C4B0"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                              
                              {/* Braço Direito - Musculoso */}
                              <path
                                d="M 72 45 Q 82 48 88 58 Q 92 68 90 78 Q 88 88 84 95"
                                fill="none"
                                stroke="#E8C4B0"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                              />
                              <ellipse cx="86" cy="98" rx="6" ry="9" fill="#F5D5C8" stroke="#E8C4B0" strokeWidth="2"/>
                              
                              {/* Mão Direita */}
                              <path
                                d="M 90 105 Q 92 108 91 110 Q 90 112 88 113 M 91 110 Q 93 112 92 114 Q 91 116 89 117 M 92 114 Q 94 116 93 118 Q 92 120 90 121 M 93 118 Q 95 120 94 122 Q 93 124 91 125"
                                fill="none"
                                stroke="#E8C4B0"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                              
                              {/* Quadril */}
                              <path
                                d="M 40 122 Q 38 125 36 128 Q 34 131 36 134 Q 38 137 40 140 L 60 140 Q 62 137 64 134 Q 66 131 64 128 Q 62 125 60 122"
                                fill="#F5D5C8"
                                stroke="#E8C4B0"
                                strokeWidth="2"
                              />
                              
                              {/* Perna Esquerda - Musculosa */}
                              <path
                                d="M 40 140 Q 38 145 36 150 Q 34 155 36 160 Q 38 165 40 170"
                                fill="none"
                                stroke="#E8C4B0"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                              />
                              <ellipse cx="38" cy="175" rx="7" ry="12" fill="#F5D5C8" stroke="#E8C4B0" strokeWidth="2"/>
                              
                              {/* Pé Esquerdo */}
                              <ellipse cx="35" cy="190" rx="8" ry="5" fill="#F5D5C8" stroke="#E8C4B0" strokeWidth="2"/>
                              <path
                                d="M 27 190 Q 27 192 29 193 Q 31 194 33 193 M 29 193 Q 29 195 31 196 Q 33 197 35 196 M 31 196 Q 31 198 33 199 Q 35 200 37 199 M 33 199 Q 33 201 35 202 Q 37 203 39 202"
                                fill="none"
                                stroke="#E8C4B0"
                                strokeWidth="1"
                                strokeLinecap="round"
                              />
                              
                              {/* Perna Direita - Musculosa */}
                              <path
                                d="M 60 140 Q 62 145 64 150 Q 66 155 64 160 Q 62 165 60 170"
                                fill="none"
                                stroke="#E8C4B0"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                              />
                              <ellipse cx="62" cy="175" rx="7" ry="12" fill="#F5D5C8" stroke="#E8C4B0" strokeWidth="2"/>
                              
                              {/* Pé Direito */}
                              <ellipse cx="65" cy="190" rx="8" ry="5" fill="#F5D5C8" stroke="#E8C4B0" strokeWidth="2"/>
                              <path
                                d="M 73 190 Q 73 192 71 193 Q 69 194 67 193 M 71 193 Q 71 195 69 196 Q 67 197 65 196 M 69 196 Q 69 198 67 199 Q 65 200 63 199 M 67 199 Q 67 201 65 202 Q 63 203 61 202"
                                fill="none"
                                stroke="#E8C4B0"
                                strokeWidth="1"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Campo IMC */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">IMC:</label>
                          {(() => {
                            const imc = calcularIMC()
                            const classificacao = imc ? getClassificacaoIMC(imc) : null
                            
                            return (
                              <div className={`p-3 rounded-lg border-2 ${classificacao?.border || 'border-slate-200'} ${classificacao?.bg || 'bg-slate-50'}`}>
                                {imc ? (
                                  <>
                                    <div className="text-center mb-2">
                                      <span className={`text-2xl font-bold ${classificacao?.cor || 'text-slate-700'}`}>
                                        {imc.toFixed(1)}
                                      </span>
                                    </div>
                                    <div className="text-center">
                                      <span className={`text-sm font-semibold ${classificacao?.cor || 'text-slate-600'}`}>
                                        {classificacao?.texto}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center text-slate-400 text-sm">
                                    Preencha altura e peso
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>

                      {/* Altura e Peso - Coluna do Meio */}
                      <div className="md:col-span-3 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">ALTURA:</label>
                          <Input
                            type="text"
                            value={medidas.altura}
                            onChange={(e) => setMedidas(prev => ({ ...prev, altura: e.target.value }))}
                            placeholder="cm"
                            className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">PESO INICIAL:</label>
                          <Input
                            type="text"
                            value={medidas.pesoInicial}
                            onChange={(e) => setMedidas(prev => ({ ...prev, pesoInicial: e.target.value }))}
                            placeholder="kg"
                            className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">PESO FINAL:</label>
                          <Input
                            type="text"
                            value={medidas.pesoFinal}
                            onChange={(e) => setMedidas(prev => ({ ...prev, pesoFinal: e.target.value }))}
                            placeholder="kg"
                            className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">OBS:</label>
                          <Input
                            type="text"
                            value={medidas.observacoes}
                            onChange={(e) => setMedidas(prev => ({ ...prev, observacoes: e.target.value }))}
                            placeholder="Observações"
                            className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      {/* Tabela de Medidas - Coluna Direita */}
                      <div className="md:col-span-6">
                        {/* Tabela de Medidas */}
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-slate-200">
                            <thead>
                              <tr className="bg-white">
                                <th className="border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-800">Parte do Corpo</th>
                                <th className="border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-800">
                                  DATA DE INÍCIO:
                                </th>
                                <th className="border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-800">
                                  DATA FINAL:
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {['Busto', 'Braço E', 'Braço D', 'Abdômen', 'Cintura', 'Quadril', 'Culote', 'Coxa E', 'Coxa D', 'Panturrilha E', 'Panturrilha D'].map((parte) => (
                                <tr key={parte} className="hover:bg-amber-50/30">
                                  <td className="border border-slate-200 px-3 py-2 text-sm text-slate-700 font-medium bg-white">{parte}</td>
                                  <td className="border border-slate-200 px-2 py-2 bg-white">
                                    <Input
                                      type="text"
                                      value={medidas.medidas[parte]?.inicio || ''}
                                      onChange={(e) => updateMedida(parte, 'inicio', e.target.value)}
                                      className="w-full h-8 text-xs text-center bg-white border-slate-200 text-slate-800 focus:border-amber-500 focus:ring-amber-500/20"
                                      placeholder=""
                                    />
                                  </td>
                                  <td className="border border-slate-200 px-2 py-2 bg-white">
                                    <Input
                                      type="text"
                                      value={medidas.medidas[parte]?.termino || ''}
                                      onChange={(e) => updateMedida(parte, 'termino', e.target.value)}
                                      className="w-full h-8 text-xs text-center bg-white border-slate-200 text-slate-800 focus:border-amber-500 focus:ring-amber-500/20"
                                      placeholder=""
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Campo de Observações */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Observações:</label>
                      <textarea
                        value={medidas.observacoesMedidas}
                        onChange={(e) => setMedidas(prev => ({ ...prev, observacoesMedidas: e.target.value }))}
                        placeholder="Adicione observações sobre as medidas antropométricas..."
                        className="w-full min-h-[120px] px-3 py-2 rounded-md border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 resize-none"
                      />
                    </div>

                    {/* Anotações */}
                    <div className="border-t border-slate-200 pt-6 mt-6">
                      <label className="block text-lg font-semibold text-slate-800 mb-4">Anotações:</label>
                      
                      {/* Lista de Anotações Cadastradas */}
                      {anotacoesCorporal.length > 0 && (
                        <div className="mb-4 space-y-3">
                          {anotacoesCorporal.map((anotacao) => (
                            <div key={anotacao.id} className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                              <p className="text-slate-800">
                                <span className="font-bold">{anotacao.data}</span>
                                <span className="font-bold"> - {anotacao.horario}</span>
                                <span className="italic"> - {anotacao.descricao}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Campo para Nova Anotação */}
                      <textarea
                        value={novaAnotacaoCorporal}
                        onChange={(e) => setNovaAnotacaoCorporal(e.target.value)}
                        placeholder="Digite uma nova anotação e clique em 'Salvar Anamnese' para adicioná-la..."
                        className="w-full min-h-[120px] px-3 py-2 rounded-md border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 resize-none"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={async () => {
                    if (!id || !cliente) return

                    try {
                      // Adicionar anotação facial se houver texto
                      if (novaAnotacaoFacial.trim()) {
                        adicionarAnotacaoFacial()
                      }
                      // Adicionar anotação corporal se houver texto
                      if (novaAnotacaoCorporal.trim()) {
                        adicionarAnotacaoCorporal()
                      }

                      // Salvar anamnese facial
                      const anamneseFacialData = {
                        cliente_id: id,
                        tipo: 'facial',
                        historico_saude: questions,
                        avaliacao_pele: skinAssessment,
                        anotacoes: anotacoesFacial
                      }

                      const { error: errorFacial } = await supabase
                        .from('anamneses')
                        .upsert(anamneseFacialData, {
                          onConflict: 'cliente_id,tipo'
                        })

                      if (errorFacial) throw errorFacial

                      // Salvar anamnese corporal
                      const anamneseCorporalData = {
                        cliente_id: id,
                        tipo: 'corporal',
                        historico_saude: questionsCorporal,
                        medidas_antropometricas: {
                          altura: medidas.altura,
                          pesoInicial: medidas.pesoInicial,
                          pesoFinal: medidas.pesoFinal,
                          observacoes: medidas.observacoes,
                          observacoesMedidas: medidas.observacoesMedidas,
                          medidas: medidas.medidas
                        },
                        anotacoes: anotacoesCorporal
                      }

                      const { error: errorCorporal } = await supabase
                        .from('anamneses')
                        .upsert(anamneseCorporalData, {
                          onConflict: 'cliente_id,tipo'
                        })

                      if (errorCorporal) throw errorCorporal

                      alert('Anamnese salva com sucesso!')
                      setNovaAnotacaoFacial('')
                      setNovaAnotacaoCorporal('')
                    } catch (error: any) {
                      console.error('Erro ao salvar anamnese:', error)
                      alert('Erro ao salvar anamnese. Tente novamente.')
                    }
                  }}
                  className="bg-rose-500 hover:bg-rose-600 text-white shadow-md"
                >
                  Salvar Anamnese
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
