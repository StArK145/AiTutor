import React, { useState, useEffect } from "react";
import { fetchUserPDFList } from "../utils/contentScan";
import { History, FileText, Youtube, Clock, MessageSquare } from "lucide-react";

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #e2e8f0;
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #10b981, #14b8a6);
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #059669, #0d9488);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-track {
    background: #334155;
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #34d399, #5eead4);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #6ee7b7, #7dd3fc);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = scrollbarStyles;
  document.head.appendChild(styleElement);
}

const Model2history = () => {
  const [activeTab, setActiveTab] = useState("pdf"); // 'pdf' or 'youtube'
  const [pdfHistory, setPdfHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch PDF upload history
  useEffect(() => {
    if (activeTab === "pdf") {
      setLoading(true);
      fetchUserPDFList()
        .then((data) => setPdfHistory(data))
        .catch((err) => console.error("Failed to fetch PDF history", err))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg">
          <History className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Analysis History
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            View your previously analyzed content
          </p>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveTab("pdf")}
          className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
            activeTab === "pdf"
              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
              : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
          }`}
        >
          <div className="flex items-center gap-3">
            <FileText
              className={`w-5 h-5 ${
                activeTab === "pdf"
                  ? "text-green-600 dark:text-green-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            />
            <div>
              <h3
                className={`font-medium ${
                  activeTab === "pdf"
                    ? "text-green-900 dark:text-green-100"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                PDF History
              </h3>
              <p
                className={`text-sm ${
                  activeTab === "pdf"
                    ? "text-green-700 dark:text-green-300"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Previously analyzed documents
              </p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab("youtube")}
          className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
            activeTab === "youtube"
              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
              : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
          }`}
        >
          <div className="flex items-center gap-3">
            <Youtube
              className={`w-5 h-5 ${
                activeTab === "youtube"
                  ? "text-green-600 dark:text-green-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            />
            <div>
              <h3
                className={`font-medium ${
                  activeTab === "youtube"
                    ? "text-green-900 dark:text-green-100"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                YouTube History
              </h3>
              <p
                className={`text-sm ${
                  activeTab === "youtube"
                    ? "text-green-700 dark:text-green-300"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Previously analyzed videos
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* History Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-2 text-slate-600 dark:text-slate-400">Loading...</span>
          </div>
        ) : activeTab === "pdf" ? (
          pdfHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No PDFs uploaded yet.</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Upload your first PDF to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
              {pdfHistory.map((pdf) => (
                <div
                  key={pdf.id}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {pdf.file_name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(pdf.upload_time).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>
                            {pdf.conversation_count} chat{pdf.conversation_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {pdf.conversation_count} chat{pdf.conversation_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <Youtube className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">YouTube history coming soon...</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              This feature will be available in a future update
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Model2history;