import React from "react";
import { useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Play,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import {generateMultiVideoMCQs} from "../utils/contentScan"; // Import the function to generate quizzes

function ResultsView({
  chapters,
  videos,
  websites,
  loading,
  error,
  topic,
  grade,
  fromHistory,
  setError,
  fetchVideoResources,
  fetchWebResources,
  setLoading,
  setVideos,
  setWebsites,
  activeTab,
  setActiveTab,
  chapterHistory,
  onBack,
}) {
  const handleChapterClick = async (e) => {
    const chapter = e.target.textContent; // More reliable than innerHTML

    if (!chapter) return setError("Chapter cannot be blank");

    setVideos([]);
    setWebsites([]);
    setError("");

    if (fromHistory) {
      // ✅ Find chapter object by matching name
      const found = chapterHistory.find((item) => item.name === chapter);

      if (found) {
        setVideos(found.videos || []);
        setWebsites(found.websites || []);
      } else {
        setError("Chapter not found in history.");
      }

      return; // ✅ Skip API calls
    }
    if (!topic?.trim()) return setError("Topic cannot be blank");
    if (!grade?.trim()) return setError("Grade cannot be blank");

    // 🔁 Live fetch from backend if not from history
    try {
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
  const  handleGenerateQuiz = async() => {
  console.log("Generating quiz for these videos:", videos);
  const res = await generateMultiVideoMCQs(videos);
  if (res.error) {
    setError(res.error);
  } else {
    console.log("Quiz generated successfully:", res);
  }

};


  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-blue-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to input
      </button>

      {/* Error */}
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
                      onClick={handleChapterClick}
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

      {/* Loading */}
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
          {/* Videos */}
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
          <div className="col-span-full flex justify-center mt-4">
            <button
              onClick={handleGenerateQuiz}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg transition duration-200"
            >
              Generate Quiz
            </button>
          </div>

          {/* Websites */}
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

export default ResultsView;
