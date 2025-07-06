import React, { useState, useEffect } from "react";
import axios from "axios";
import { getCsrfToken } from "../utils/api"; // Adjust the import path
import { BookOpen, Sparkles, GraduationCap, AlertCircle, Play, ExternalLink, Loader2 } from "lucide-react";

function Resources() {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState(null);
  const [videos, setVideos] = useState([]);
  const [websites, setWebsites] = useState([]);
  
  const gradeOptions = [
    { value: "school", label: "Elementary School", icon: "🎒" },
    { value: "high school", label: "High School", icon: "📚" },
    { value: "college", label: "College", icon: "🎓" },
    { value: "phd", label: "PhD Level", icon: "🔬" },
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

  const fetchVideoResources = async (chapter) => {
    if (!topic?.trim()) return setError("Topic cannot be blank");
    if (!grade?.trim()) return setError("Grade cannot be blank");
    if (!chapter) return setError("Chapter cannot be blank");

    try {
      setError("");

      const res = await axios.post(
        `${API_BASE}/videos/`,
        { topic, grade, chapter },
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Video response:", res.data);
      setVideos(res.data?.data?.videos || []);
    } catch (err) {
      const backendMsg = err?.response?.data?.error;
      setError(backendMsg || err.message || "Failed to fetch videos");
      setVideos([]);
    }
  };

  const fetchWebResources = async ({ topic, grade, chapter }) => {
    const csrfToken = await getCsrfToken();

    const res = await axios.post(
      `${API_BASE}/websites/`,
      { topic, grade, chapter },
      {
        withCredentials: true,
        headers: {
          "X-CSRFToken": csrfToken,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data?.data?.websites || [];
  };

  const handleChapterClick = async (e) => {
    const chapter = e.target.innerHTML;

    if (!topic?.trim()) return setError("Topic cannot be blank");
    if (!grade?.trim()) return setError("Grade cannot be blank");
    if (!chapter) return setError("Chapter cannot be blank");

    try {
      setError("");
      setLoading(true);

      await fetchVideoResources(chapter);

      const websitesArr = await fetchWebResources({ topic, grade, chapter });
      setWebsites(websitesArr);
    } catch (err) {
      const backendMsg = err?.response?.data?.error;
      setError(backendMsg || err.message || "Failed to fetch resources");
      setVideos([]);
      setWebsites([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              AI Chapter Generator
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Generate comprehensive chapter outlines for any topic
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Topic Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Topic
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your topic (e.g., Machine Learning, History of Rome)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
              <Sparkles className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Grade Level Select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Academic Level
            </label>
            <div className="relative">
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full p-3 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 appearance-none cursor-pointer"
              >
                <option value="">Select academic level</option>
                {gradeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
              <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <div className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {formError && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400 text-sm">{formError}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generateChapters}
          disabled={loading}
          className={`mt-6 w-full font-semibold py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${
              loading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            } text-white`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Chapters...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Chapters
            </span>
          )}
        </button>
      </div>

      {/* General Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Generated Chapters */}
      {chapters.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Generated Chapters
            </h3>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
              {chapters.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chapters.map((chapter, i) => (
              <div
                key={i}
                className="group bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 rounded-lg p-4 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h4 
                      onClick={(e) => handleChapterClick(e)}
                      className="text-slate-900 dark:text-slate-100 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors"
                    >
                      {chapter}
                    </h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading resources...</span>
          </div>
        </div>
      )}

      {/* Resources Grid */}
      {(videos.length > 0 || websites.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Videos Section */}
          {videos.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Play className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Videos
                </h3>
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                  {videos.length}
                </span>
              </div>
              <div className="space-y-3">
                {videos.map((v, i) => (
                  <a
                    key={i}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-slate-600 rounded-lg transition-all duration-200 border border-slate-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-500"
                  >
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 dark:text-slate-100 font-medium truncate">
                        {v.title}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Websites Section */}
          {websites.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <ExternalLink className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Websites
                </h3>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  {websites.length}
                </span>
              </div>
              <div className="space-y-3">
                {websites.map((w, i) => (
                  <a
                    key={i}
                    href={w.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 hover:bg-green-50 dark:hover:bg-slate-600 rounded-lg transition-all duration-200 border border-slate-200 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-500"
                  >
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 dark:text-slate-100 font-medium truncate">
                        {w.title}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Resources;