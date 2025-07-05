import React, { useState, useEffect } from "react";
import axios from "axios";
import { getCsrfToken } from "../utils/api"; // Adjust the import path
import { BookOpen, Sparkles, GraduationCap, AlertCircle } from 'lucide-react';

function Dashboard() {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false); // ⬅️ new
  const [csrfToken, setCsrfToken] = useState(null);
  const gradeOptions = [
    { value: 'school', label: 'Elementary School', icon: '🎒' },
    { value: 'high school', label: 'High School', icon: '📚' },
    { value: 'college', label: 'College', icon: '🎓' },
    { value: 'phd', label: 'PhD Level', icon: '🔬' }
  ];

  const API_BASE = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    (async () => {
      const token = await getCsrfToken();
      if (token) setCsrfToken(token);
    })();
  }, []);

  const generateChapters = async () => {
    if (!topic.trim() || !grade.trim()) {
      setFormError("Please fill in both the topic and grade.");
      setChapters([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/chapters/`,
        { topic, grade },
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Response from server:", res.data);

      // 👇 grab the array from res.data.data.chapters
      setChapters(res.data?.data?.chapters || []);
      setError("");
      setFormError("");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-2xl rounded-3xl border border-blue-100">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          AI Chapter Generator
        </h2>
        <p className="text-gray-600 text-sm">
          Generate comprehensive chapter outlines for any topic
        </p>
      </div>

      <div className="space-y-6">
        {/* Topic Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter your topic (e.g., Machine Learning, History of Rome)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
            />
            <Sparkles className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Grade Level Select */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Academic Level
          </label>
          <div className="relative">
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md appearance-none cursor-pointer"
            >
              <option value="">Select academic level</option>
              {gradeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
            <GraduationCap className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
            <div className="absolute right-4 top-4 w-5 h-5 text-gray-400 pointer-events-none">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {formError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{formError}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generateChapters}
          disabled={loading}
          className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg
            ${
              loading
                ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed scale-100"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
            } text-white`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8"
                  strokeWidth="4"
                />
              </svg>
              <span>Generating Chapters...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Generate Chapters
            </span>
          )}
        </button>
      </div>

      {/* General Error Message */}
      {error && (
        <div className="mt-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Generated Chapters */}
      {chapters.length > 0 && (
        <div className="mt-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-semibold text-gray-800">
              Generated Chapters
            </h3>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
              {chapters.length}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {chapters.map((chapter, i) => (
              <div
                key={i}
                className="group bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md transform hover:scale-[1.02]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 group-hover:text-indigo-700 transition-colors">
                      {chapter}
                    </h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
