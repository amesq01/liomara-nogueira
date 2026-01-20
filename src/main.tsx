import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Clientes from './pages/Clientes.tsx'
import NovoCliente from './pages/NovoCliente.tsx'
import EditarCliente from './pages/EditarCliente.tsx'
import PerfilCliente from './pages/PerfilCliente.tsx'
import Agendamentos from './pages/Agendamentos.tsx'
import NovoAgendamento from './pages/NovoAgendamento.tsx'
import Procedimentos from './pages/Procedimentos.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<App />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/novo" element={<NovoCliente />} />
        <Route path="/clientes/:id/editar" element={<EditarCliente />} />
        <Route path="/clientes/:id/anamnese" element={<PerfilCliente />} />
        <Route path="/agendamentos" element={<Agendamentos />} />
        <Route path="/agendamentos/novo" element={<NovoAgendamento />} />
        <Route path="/agendamentos/:id/editar" element={<NovoAgendamento />} />
        <Route path="/procedimentos" element={<Procedimentos />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
