import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';

// Set base URL for API calls
axios.defaults.baseURL = 'http://localhost:8000/api';

function App() {
  return (
    <Router>
      <div className="container mt-4">
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">Decentral Tutor</Link>
            <div className="navbar-nav">
              <Link className="nav-link" to="/login">Login</Link>
              <Link className="nav-link" to="/signup">Signup</Link>
              <Link className="nav-link" to="/dashboard">Dashboard</Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div>
      <h1>Welcome to Decentral Tutor</h1>
      <p>Basic React frontend for testing Django API</p>
    </div>
  );
}

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/login/', formData);
      localStorage.setItem('token', response.data.access);
      alert('Login successful!');
      window.location.href = '/dashboard';
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
      </div>
    </div>
  );
}

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/signup/', formData);
      localStorage.setItem('token', response.data.access);
      alert('Signup successful!');
      window.location.href = '/dashboard';
    } catch (error) {
      alert('Signup failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h2>Signup</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button type="submit" className="btn btn-primary">Sign Up</button>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const connectWallet = async () => {
    try {
      // This is a simplified version - you'll need to implement actual MetaMask connection
      const mockAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      
      await axios.patch('/wallet/', { address: mockAddress }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setWallet(mockAddress);
      alert('Wallet connected successfully!');
    } catch (error) {
      alert('Wallet connection failed: ' + error.message);
    }
  };

  const disconnectWallet = async () => {
    try {
      await axios.patch('/wallet/', { address: null }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setWallet(null);
      alert('Wallet disconnected successfully!');
    } catch (error) {
      alert('Disconnection failed: ' + error.message);
    }
  };

  // Load wallet data on component mount
  React.useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await axios.get('/dashboard/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setWallet(response.data.address);
      } catch (error) {
        console.error('Error fetching wallet:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card">
      <div className="card-body">
        <h2>Dashboard</h2>
        <div className="mb-3">
          <h4>Wallet Status</h4>
          {wallet ? (
            <>
              <p>Connected Wallet: {wallet}</p>
              <button onClick={disconnectWallet} className="btn btn-danger">
                Disconnect Wallet
              </button>
            </>
          ) : (
            <>
              <p>No wallet connected</p>
              <button onClick={connectWallet} className="btn btn-primary">
                Connect Wallet (Mock)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;