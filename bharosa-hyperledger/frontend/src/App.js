import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import KYCForm from './components/KYCForm';
import VerificationStatus from './components/VerificationStatus';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData && userData !== 'undefined') {
      try {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false); // Set loading to false after checking auth
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    window.location.reload();
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {isAuthenticated && (
          <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-0 sm:h-16">
                <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto">
                  <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-600 mb-2 sm:mb-0">
                    🔐 Bharosa KYC
                  </Link>
                  <div className="flex flex-wrap gap-2 sm:ml-10 sm:flex sm:space-x-4">
                    <Link to="/" className="px-3 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                      Dashboard
                    </Link>
                    <Link to="/kyc" className="px-3 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                      Submit KYC
                    </Link>
                    <Link to="/status" className="px-3 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                      Status
                    </Link>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4 mt-2 sm:mt-0">
                  <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[120px] sm:max-w-none">Welcome, {user?.fullName}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
            <Route path="/" element={isAuthenticated ? <DashboardPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/kyc" element={isAuthenticated ? <KYCPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/status" element={isAuthenticated ? <StatusPage user={user} /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Login Page
function LoginPage({ setIsAuthenticated, setUser }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        setIsAuthenticated(true);
        setUser(data.data.user);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-blue-600 mb-6">Login to Bharosa</h2>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}

// Register Page
function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', phoneNumber: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-blue-600 mb-6">Register for Bharosa</h2>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">Registration successful! Redirecting to login...</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              minLength="6"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

// Dashboard Page
function DashboardPage({ user }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-6 sm:mb-8">Welcome to Bharosa KYC</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-blue-600 mb-2">📄 Submit KYC</h3>
          <p className="text-gray-600 mb-4">Upload your documents for verification</p>
          <Link to="/kyc" className="text-blue-600 hover:underline">Get Started →</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-green-600 mb-2">✅ Check Status</h3>
          <p className="text-gray-600 mb-4">View your verification status</p>
          <Link to="/status" className="text-green-600 hover:underline">View Status →</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-purple-600 mb-2">👤 Profile</h3>
          <p className="text-gray-600 mb-4">Email: {user?.email}</p>
          <p className="text-gray-600">Name: {user?.fullName}</p>
        </div>
      </div>
    </div>
  );
}

// KYC Submission Page
function KYCPage({ user }) {
  const navigate = useNavigate();

  const handleSuccess = (response) => {
    // Redirect to status page after successful submission
    setTimeout(() => navigate('/status'), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <KYCForm user={user} onSuccess={handleSuccess} />
    </div>
  );
}

// Status Page
function StatusPage({ user }) {
  return <VerificationStatus />;
}

export default App;