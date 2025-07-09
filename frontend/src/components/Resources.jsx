import React, { useState, useEffect } from "react";
import axios from "axios";
import { getCsrfToken } from "../utils/api"; // Adjust the import path
import { BookOpen, Sparkles, GraduationCap, AlertCircle, Play, ExternalLink, Loader2 } from "lucide-react";
import ResultsView from "./ResultsView"; // Adjust the import path
import {getFirebaseIdToken} from "../utils/firebase"; // Adjust the import path
import Model1history from "./Model1history";


function Resources() {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [websites, setWebsites] = useState([]);
   const [activeTab, setActiveTab] = useState("form"); 
  
  const gradeOptions = [
    { value: "school", label: "Elementary School", icon: "🎒" },
    { value: "high school", label: "High School", icon: "📚" },
    { value: "college", label: "College", icon: "🎓" },
    { value: "phd", label: "PhD Level", icon: "🔬" },
  ];

  const API_BASE = import.meta.env.VITE_API_BASE;

  

  const generateChapters = async () => {
    if (!topic.trim() || !grade.trim()) {
      setFormError("Please fill in both the topic and grade.");
      setChapters([]);
      return;
    }
    const idToken = await getFirebaseIdToken();
    const csrfToken = await getCsrfToken();

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
            Authorization: `Bearer ${idToken}`, // Include Firebase ID token if needed
          },
        }
      );
      console.log("Response from server:", res.data);

      setChapters(res.data?.data?.chapters || []);
      setError("");
      setFormError("");
      setActiveTab("results");
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
      const idToken = await getFirebaseIdToken();
      const csrfToken = await getCsrfToken();

      const res = await axios.post(
        `${API_BASE}/videos/`,
        { topic, grade, chapter },
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`, // Include Firebase ID token if needed
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
    const idToken = await getFirebaseIdToken();
    const res = await axios.post(
      `${API_BASE}/websites/`,
      { topic, grade, chapter },
      {
        withCredentials: true,
        headers: {
          "X-CSRFToken": csrfToken,
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`, // Include Firebase ID token if needed
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
    setVideos([]);
    setWebsites([]);

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
      {/* ---------------- TAB 1 : INPUT FORM ---------------- */}
      {activeTab === "form" && (
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 space-y-6">
          {/* header */}
          <div className="flex items-center gap-4">
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* error and button … */}
          {formError && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-400 text-sm">
                {formError}
              </p>
            </div>
          )}
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
          <Model1history />
        </section>
      )}

      {/* ---------------- TAB 2 : RESULTS ---------------- */}
      {activeTab === "results" && (
  <ResultsView
    chapters={chapters}
    videos={videos}
    websites={websites}
    loading={loading}
    error={error}
    topic={topic}
    grade={grade}
    handleChapterClick={handleChapterClick}
    onBack={() => setActiveTab("form")}
  />
      )}
    </div>
  );
}

export default Resources;