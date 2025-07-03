import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-200 p-6">
      <div className="max-w-2xl w-full bg-white shadow-xl rounded-2xl p-8 text-center">
        <h1 className="text-4xl font-bold text-indigo-700 mb-4">Welcome to AI Tutor</h1>
        <p className="text-gray-600 text-lg mb-8">
          Empowering education with intelligent tools. Learn smarter, grow faster.
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Join Us
        </button>
      </div>
    </div>
  );
};

export default Home;
