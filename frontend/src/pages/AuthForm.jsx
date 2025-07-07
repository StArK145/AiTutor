import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth } from '../utils/firebase';
import axios from 'axios';
import { User, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE;

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  // ───────────── Auth Handlers ─────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const token = await user.getIdToken();
      localStorage.setItem('token', token);

      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert(`Login failed: ${error.message}`);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );


      // Register user in Django backend with UID in headers
      await axios.post(
        `${API_BASE}/login/`,
        {
          username: formData.username,
          email: user.email,
        },
        {
          headers: {
            'X-Firebase-Uid': user.uid,
          },
        },
      );

      setIsLogin(true);
    } catch (error) {
      console.error(error);
      alert(`Signup failed: ${error.message}`);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const { user } = result;
  

      const signInMethods = await fetchSignInMethodsForEmail(auth, user.email);
      if (signInMethods.length != 1 && signInMethods[0] != 'google.com') {
        
        await axios.post(
          `${API_BASE}/login/`,
          {
            username: user.email,
            email: user.email,
          },
          {
            headers: {
              'X-Firebase-UID': user.uid,
            },
          },
        );
      }
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert(`Google login failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-center space-x-2">
              {isLogin ? (
                <LogIn className="h-8 w-8 text-white" />
              ) : (
                <UserPlus className="h-8 w-8 text-white" />
              )}
              <h2 className="text-2xl font-bold text-white">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
            </div>
            <p className="text-blue-100 text-center mt-2">
              {isLogin ? 'Sign in to your account' : 'Join us today'}
            </p>
          </div>

          {/* Form */}
          <form className="px-8 py-6 space-y-6" onSubmit={isLogin ? handleLogin : handleSignup}>
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Username</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 placeholder-gray-400"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 placeholder-gray-400"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Password</span>
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 placeholder-gray-400"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full mt-2 border-2 border-red-500 text-red-600 py-3 px-4 rounded-lg font-medium hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200"
            >
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              className="w-full border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
