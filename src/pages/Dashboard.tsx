import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <p className="text-white">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-light text-slate-300">
            Bem-vinda, Liomara!
          </h2>
          <p className='text-slate-400 mt-1'>
            São Luís Gonzaga do Maranhão, {new Date().toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="bg-transparent border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
          >
            Sair
          </Button>
        </div>

        <div className="flex  flex-col bg-neutral-800 rounded-lg p-8 border border-neutral-700">
        <div className='flex gap-2  items-center w-full '>
          <input type="text" placeholder='Buscar cliente' className='bg-sky-100 px-4 h-12 rounded w-full ' />
          <Button className='cursor-pointer'>

          <Search className=' text-slate-500' />
          </Button>
        </div>


        </div>

        <div className="flex  flex-col bg-neutral-800 rounded-lg p-8 border border-neutral-700 mt-4">
          <p className='text-slate-200'>Últimos atendimentos</p>

        </div>

      </div>
      
    </div>
  )
}
