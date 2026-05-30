import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Room from './pages/Room/Room';
import ProtectedRoute from './components/common/ProtectedRoute';
import VerifyEmail from './pages/VerifyEmail/VerifyEmail';
import GoogleCallback from './pages/GoogleCallback/GoogleCallback';
import Settings from './pages/Settings/Settings';

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(91, 61, 245, 0.3)',
            borderRadius: '16px',
            padding: '16px 24px',
            fontSize: '16px',
            fontWeight: '500',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(91, 61, 245, 0.1)',
            maxWidth: '500px',
          },
          success: {
            iconTheme: {
              primary: '#43B581',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(67, 181, 129, 0.4)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(67, 181, 129, 0.15)',
            },
          },
          error: {
            iconTheme: {
              primary: '#F04747',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(240, 71, 71, 0.4)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(240, 71, 71, 0.15)',
            },
          },
        }}
      />
      <Routes>
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/register" element={<Register />} />
        <Route path="/room/:roomCode" element={<ProtectedRoute><Room /></ProtectedRoute>} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/room/:roomId" 
          element={
            <ProtectedRoute>
              <Room />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;