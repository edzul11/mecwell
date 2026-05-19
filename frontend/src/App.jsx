import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FaenaProvider } from './context/FaenaContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import WorkersList from './pages/WorkersList'
import WorkerProfile from './pages/WorkerProfile'
import Recruitment from './pages/Recruitment'
import SitesList from './pages/SitesList'
import SiteProfile from './pages/SiteProfile'
import PayslipsList from './pages/PayslipsList'
import DocumentsList from './pages/DocumentsList'
import InventoryList from './pages/InventoryList'
import ExpensesList from './pages/ExpensesList'
import ContractsList from './pages/ContractsList'
import VacationsList from './pages/VacationsList'
import VacationRegistrationPage from './pages/VacationRegistrationPage'
import FiniquitosList from './pages/FiniquitosList'
import FiniquitoWizardPage from './pages/FiniquitoWizardPage'
import AdvancesList from './pages/AdvancesList'
import Login from './pages/Login'
import Attendance from './pages/Attendance'

const ProtectedRoute = () => {
  const { session } = useAuth()
  if (!session) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function App() {
  return (
    <AuthProvider>
      <FaenaProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="workers" element={<WorkersList />} />
              <Route path="workers/:id" element={<WorkerProfile />} />
              <Route path="hiring" element={<Recruitment />} />
              <Route path="sites" element={<SitesList />} />
              <Route path="sites/:id" element={<SiteProfile />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="payslips" element={<PayslipsList />} />
              <Route path="advances" element={<AdvancesList />} />
              <Route path="documents" element={<DocumentsList />} />
              <Route path="contracts" element={<ContractsList />} />
              <Route path="vacations" element={<VacationsList />} />
              <Route path="vacations/new" element={<VacationRegistrationPage />} />
              <Route path="finiquitos" element={<FiniquitosList />} />
              <Route path="finiquitos/new" element={<FiniquitoWizardPage />} />
              <Route path="inventory" element={<InventoryList />} />
              <Route path="expenses" element={<ExpensesList />} />
            </Route>
          </Route>
        </Routes>
        </BrowserRouter>
      </FaenaProvider>
    </AuthProvider>
  )
}

export default App
