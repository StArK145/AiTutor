import React, { useEffect, useState } from 'react';
import { fetchChapterGenerationHistory } from '../utils/contentScan'; // Adjust path
import { Clock, BookOpen, Calendar, Hash } from 'lucide-react';

function Model1history() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchChapterGenerationHistory();
        console.log("History data:", data); // Optional debug
        setHistory(data);
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };

    loadHistory();
  }, []);

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Chapter Generation History
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            View your previously generated chapter outlines
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              No history available yet.
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
              Generate your first chapter outline to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-2">
                      {item.topic}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Grade: {item.grade}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        <span>{item.chapter_count} chapters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Model1history;