// Scanner.jsx
import React, { useState, useEffect } from "react";
import { uploadPdf, analyzeYoutube } from "../utils/contentScan";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
import { askPdfQuestion } from "../utils/contentScan";
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

/**
 * If you're working with Django + CSRF, keep your existing util:
 *   import { getCsrfToken } from "../utils/api";
 * and add an X‑CSRFToken header the same way you already do.
 */

const API_BASE = import.meta.env.VITE_API_BASE;
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
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
      if (mode === "pdf" && !file) {
        return setError("Please choose a PDF file to analyze.");
      } else {
        let data = await uploadPdf(file);
        setIsLoading(true);
        setResponse(data);
        setActiveTab("results");
        return;
      }
      if (mode === "yt" && !url.trim()) {
        return setError("Please paste a YouTube link to analyze.");
      } else {
        let data = await analyzeYoutube(url);
        setIsLoading(true);
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

  /* ---------- render ---------- */

  const handleSend = async () => {
    if (!question.trim()) return;
    console.log("Sending question:", question);
    
    const pdfId = response?.data?.id;

    const userMessage = { type: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    

    try {
      console.log("Sending question to backend:", question);
      console.log("Sending question to backend:", pdfId);
      
      const res = await askPdfQuestion(pdfId, question);
      const aiMessage = {
        type: "ai",
        text: res?.data || "No response from server.",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: "⚠️ Error getting answer." },
      ]);
    } finally {
      setIsLoading(false);
      setQuestion("");
    }
  };

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
                    value={url}
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

      {/* ---------------- TAB 2 : RESULTS ---------------- */}
      {activeTab === "results" && (
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border overflow-hidden">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Analysis Results
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {mode === "pdf" ? `${file?.name}` : "YouTube video analysis"}
                </p>
              </div>
            </div>
            <button
              onClick={handleNewScan}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              New Scan
            </button>
          </div>

          {/* Two-Panel Layout */}
          <div className="flex h-[80vh]">
            {/* Left Panel - Chat Section */}
            <div className="flex flex-col h-full">
              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-3">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`${
                          msg.type === "user"
                            ? "bg-green-100 dark:bg-green-700"
                            : "bg-slate-100 dark:bg-slate-700"
                        } rounded-lg p-3 max-w-[80%]`}
                      >
                        <p className="text-sm text-slate-900 dark:text-slate-100">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm text-slate-900 dark:text-slate-100">
                          Thinking...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask a question about the content..."
                    className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Content Display */}
            <div className="w-1/2 flex flex-col">
              {/* Content Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  {mode === "pdf" ? "PDF Viewer" : "Video Player"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {mode === "pdf"
                    ? "Original document content"
                    : "YouTube video content"}
                </p>
              </div>

              {/* Content Display Area */}
              <div className="flex-1 overflow-hidden">
                {mode === "pdf" ? (
                  <div className="h-full bg-slate-100 dark:bg-slate-700 overflow-y-auto p-4">
                    {file ? (
                      <Document
                        file={file}
                        onLoadError={(error) =>
                          console.error("Error while loading PDF:", error)
                        }
                        className="space-y-4"
                      >
                        {Array.from(new Array(10), (el, index) => (
                          <Page
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                          />
                        ))}
                      </Document>
                    ) : (
                      <div className="text-center text-slate-500 dark:text-slate-400">
                        PDF not loaded
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <div className="text-center">
                      <LinkIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600 dark:text-slate-400">
                        Video Player
                      </p>
                      <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                        {url}
                      </p>
                      {/* You can embed YouTube player here */}
                    </div>
                  </div>
                )}
              </div>

              {/* Analysis Summary Panel */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 max-h-48 overflow-y-auto">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Analysis Summary
                </h4>
                {response && response.data ? (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <span
                        className={
                          response.ok ? "text-green-600" : "text-red-600"
                        }
                      >
                        {response.ok
                          ? "✅ Analysis completed"
                          : "❌ Analysis failed"}
                      </span>
                    </div>
                    {response.data.summary && (
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {response.data.summary}
                      </p>
                    )}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                        View raw data
                      </summary>
                      <pre className="mt-2 text-xs bg-slate-200 dark:bg-slate-800 p-2 rounded overflow-x-auto">
                        {prettyJson(response)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    No analysis data available
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Scanner;
