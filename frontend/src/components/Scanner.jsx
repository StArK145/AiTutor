// Scanner.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { uploadPdf, analyzeYoutube } from "../utils/contentScan";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { highlightPlugin } from "@react-pdf-viewer/highlight";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import Model2history from "./Model2history";

import {fetchUserPDFList} from "../utils/contentScan";
import {
  Upload,
  FileText,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  ScanLine,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import Model2results from "./Model2results";

/**
 * If you're working with Django + CSRF, keep your existing util:
 *   import { getCsrfToken } from "../utils/api";
 * and add an X‑CSRFToken header the same way you already do.
 */

const API_BASE = import.meta.env.VITE_API_BASE;

/**
 * Endpoints (adjust to match your backend):
 *   POST `${API_BASE}/analyze/pdf`   – multipart/form‑data with key `file`
 *   POST `${API_BASE}/analyze/yt`    – JSON { "url": "<YouTube link>" }
 * Your backend should return JSON like { ok: true, data: … } or { error: "…" }.
 */

function Scanner() {
  const [mode, setMode] = useState("pdf"); // "pdf" | "yt"
  const [file, setFile] = useState(null); // File object for PDF
  const [url, setUrl] = useState(""); // YouTube URL
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null); // Backend result
  const [error, setError] = useState("");
  const viewerRef = useRef(null);

  const [activeTab, setActiveTab] = useState("form");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "ai",
      text: `Hello! I've analyzed your ${
        mode === "pdf" ? "PDF document" : "YouTube video"
      }. What would you like to know about it?`,
    },
  ]); // "form" | "results"
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const modeOptions = [
    {
      value: "pdf",
      label: "PDF Document",
      icon: FileText,
      description: "Analyze PDF files for content extraction",
      placeholder: "Choose a PDF file to analyze",
    },
    {
      value: "yt",
      label: "YouTube Video",
      icon: LinkIcon,
      description: "Extract information from YouTube videos",
      placeholder: "https://www.youtube.com/watch?v=...",
    },
  ];
  const fileUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.zoom(SpecialZoomLevel.ActualSize); // 100% zoom
    }
  }, [fileUrl]);
  const highlightPluginInstance = highlightPlugin();
  const { jumpToHighlightArea, highlightAreas, setHighlightAreas } =
    highlightPluginInstance;

  /* ---------- handlers ---------- */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0] ?? null;
    setFile(selectedFile);
    console.log("Selected file:", selectedFile);

    setError("");
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setError("");
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    // clear previous inputs so user doesn't accidentally send wrong thing
    setFile(null);
    setUrl("");
    setResponse(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResponse(null);

    try {
      if (mode === "pdf") {
        if (!file) return setError("Please choose a PDF file to analyze.");
        let data = await uploadPdf(file);
        setIsLoading(true);
        setResponse(data);
        setActiveTab("results");
        return;
      }

      if (mode === "yt") {
        if (!url.trim())
          return setError("Please paste a YouTube link to analyze.");
        let data = await analyzeYoutube(url);
        setIsLoading(true);
        console.log("YouTube analysis response:", data);
        
        setResponse(data);
        setActiveTab("results");
        return;
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentModeConfig = () => {
    return modeOptions.find((option) => option.value === mode);
  };

  const handleNewScan = () => {
    setActiveTab("form");
    setResponse(null);
    setError("");
    setFile(null);
    setUrl("");
  };

  /* ---------- helpers ---------- */
  const prettyJson = (json) => JSON.stringify(json, null, 2);


  return (
    <div className="space-y-6">
      {/* ---------------- TAB 1 : SCANNER FORM ---------------- */}
      {activeTab === "form" && (
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg">
              <ScanLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                AI Content Scanner
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Analyze PDFs and YouTube videos with AI-powered extraction
              </p>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Content Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleModeChange(option.value)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      mode === option.value
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 ${
                          mode === option.value
                            ? "text-green-600 dark:text-green-400"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      />
                      <div>
                        <h3
                          className={`font-medium ${
                            mode === option.value
                              ? "text-green-900 dark:text-green-100"
                              : "text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {option.label}
                        </h3>
                        <p
                          className={`text-sm ${
                            mode === option.value
                              ? "text-green-700 dark:text-green-300"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {mode === "pdf" ? "Upload File" : "Video URL"}
              </label>

              {mode === "pdf" ? (
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full p-3 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  <Upload className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder={getCurrentModeConfig()?.placeholder}
                    value={url || ""}
                    onChange={handleUrlChange}
                    className="w-full p-3 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>

            {/* File Info Display */}
            {mode === "pdf" && file && (
              <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                isLoading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
              } text-white`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Content...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ScanLine className="w-4 h-4" />
                  Start Analysis
                </span>
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
        </section>
      )}
      <Model2history/>

      {/* ---------------- TAB 2 : RESULTS ---------------- */}
      {activeTab === "results" && (
        <Model2results
          file={file}
          url={url}
          mode={mode}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onNewScan={handleNewScan}
          viewerRef={viewerRef}
          fileUrl={fileUrl}
          response={response}
        />
      )}
    </div>
  );
}

export default Scanner;
