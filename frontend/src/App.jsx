import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Calls from './pages/Calls';
import Transcripts from './pages/Transcripts';
import Assistants from './pages/Assistants';
import Campaigns from './pages/Campaigns';
import Settings from './pages/Settings';
import Login from './pages/Login';

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calls"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Calls />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transcripts"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Transcripts />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistants"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Assistants />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Campaigns />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
