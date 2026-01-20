// Tipos TypeScript para o banco de dados Supabase

export interface Cliente {
  id: string
  nome: string
  data_nascimento: string | null
  ocupacao: string | null
  telefone: string | null
  endereco: string | null
  cpf: string | null
  cliente_desde: string
  created_at: string
  updated_at: string
}

export interface Procedimento {
  id: string
  descricao: string
  created_at: string
  updated_at: string
}

export interface Agendamento {
  id: string
  cliente_id: string
  procedimento_id: string | null
  data: string
  horario: string
  status: 'Agendado' | 'Concluído' | 'Cancelado'
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Anamnese {
  id: string
  cliente_id: string
  tipo: 'facial' | 'corporal'
  historico_saude: Record<string, any>
  avaliacao_pele?: Record<string, any>
  medidas_antropometricas?: Record<string, any>
  anotacoes: Array<{
    id: string
    data: string
    horario: string
    descricao: string
  }>
  created_at: string
  updated_at: string
}
