import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, Mail } from 'lucide-react'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login attempt:', { email, password })
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-neutral-900"  style={{
          backgroundImage: 'url(/assets/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}>
      {/* Left Section - Liomara's Image (Desktop Only) */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative"
        style={{
          backgroundImage: 'url(/assets/liomara-bg-.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundPositionY:'-50px',
        }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-neutral-900/40 to-transparent" />
      </div>

      {/* Right Section - Mobile Card Overlay + Desktop Login Card */}
      <div 
        className="w-full lg:w-1/2 relative flex lg:items-center items-end justify-center px-2 py-8 lg:px-8 lg:py-0 overflow-y-auto lg:overflow-hidden bg-[url(/assets/liomara-bg-.png)] bg-cover bg-center bg-no-repeat bg-fixed lg:bg-none"
      
      >
        {/* Mobile/Tablet Background Overlay */}
        <div className="absolute inset-0 lg:hidden bg-linear-to-b from-neutral-900/10 via-neutral-950/60 to-neutral-950/80" />
        
        {/* Desktop Background - Subtle */}
        <div className=" lg:absolute lg:inset-0 bg-linear-to-l from-neutral-900 via-neutral-900/95 to-transparent" />

        {/* Login Card */}
        <Card className="relative z-10 flex flex-col items-center w-full lg:w-124  bg-linear-to-b from-amber-50/0 to-amber-50/3 border-0 shadow-2xl overflow-hidden group">

          {/* Decorative wave at bottom
          
           <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-r from-amber-100 to-amber-200 opacity-50 transform skew-y-1" 
            style={{
              clipPath: 'polygon(0 50%, 100% 0%, 100% 100%, 0 100%)',
            }}
          />
          
          */}
         

          <CardHeader className="space-y-1 pt-8 pb-6 px-6 lg:px-8">
            {/* Logo Section */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-36 h-36 md:w-64 md:h-48  lg:w-48 lg:h-48">
                <img 
                  src="/assets/logo.png" 
                  alt="Logomarca Liomara Nogueira Estética Avançada" 
                  className="w-full h-full object-contain"
                />
              </div>
              {/* <div className="text-center space-y-1">
                <h1 className="text-2xl lg:text-xl font-medium text-gray-200 tracking-widest">
                  LIOMARA NOGUEIRA
                </h1>
                <p className="text-xs font-medium text-gray-300 tracking-widest uppercase">
                  Estética Avançada
                </p>
              </div>d Tagline */}
                            
            </div>

            {/* Title */}
            <div className="text-center pt-2">
              <h2 className="text-xl lg:text-xl font-light text-neutral-300">
                Acesso exclusivo
              </h2>
            </div>
          </CardHeader>

          <CardContent className=" w-full md:w-[90%] lg:w-full space-y-5 px-6 pb-8 lg:px-8 lg:pb-12 relative z-20">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-700/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 lg:h-14 bg-white border-amber-300/60 text-neutral-700 placeholder:text-neutral-500 focus:border-amber-400 focus:ring-amber-200/50 rounded-lg shadow-sm"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-700/60" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 lg:h-14 bg-white border-amber-300/60 text-neutral-700 placeholder:text-neutral-500 focus:border-amber-400 focus:ring-amber-200/50 rounded-lg shadow-sm"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 lg:h-14 text-base font-semibold bg-linear-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-800 hover:via-amber-700 hover:to-amber-800 text-amber-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg mt-4 lg:mt-6"
              >
                Entrar no sistema
              </Button>
            </form>

            {/* Forgot Password Link */}
            <div className="text-center pt-2">
              <a 
                href="#" 
                className="text-sm text-slate-400 hover:text-amber-700 transition-colors duration-200"
              >
                Esqueci minha senha
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App
