import React, { useState, useRef, useEffect } from "react";
import { useCSVGeneration } from "../lib/csv";
import { DataTable } from "../components/DataTable";

const CSVGenerator: React.FC = () => {
  const { messages, isLoading, generateData } = useCSVGeneration({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
  });

  const [prompt, setPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    await generateData(prompt);
    setPrompt("");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-200">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-8 pt-8">
        {/* Intro Message */}
        {messages.length === 0 && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/10">
              <svg
                className="w-12 h-12 text-lime-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight">
                CSV Data Generator
              </h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Describe any data set or list you need. I'll generate it instantly
                and let you export it to CSV.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {[
                {
                  title: "Easy Integration",
                  desc: "Simple React hook API",
                  icon: "⚡",
                },
                {
                  title: "Customizable",
                  desc: "Generate any data format",
                  icon: "🎨",
                },
                {
                  title: "CSV Export",
                  desc: "Download instantly",
                  icon: "📊",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="glass-card p-4 rounded-xl text-left border-l-2 border-l-lime-500/50"
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="font-bold text-sm">{item.title}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {[
                "10 fictional space explorers with their home planet and specialty",
                "Comparison of popular programming languages with release year",
                "Top 15 healthy breakfast ideas with main ingredients",
                "Historical events of the 20th century with dates",
              ].map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(example)}
                  className="px-4 py-2 glass-card hover:bg-white/5 text-slate-300 text-sm rounded-full transition-colors border border-white/10"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Log */}
        <div className="flex-1 overflow-y-auto space-y-6 mb-8 scrollbar-hide">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              } animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-lime-500 text-slate-950 font-semibold"
                    : "glass-card border-white/5 text-slate-200"
                }`}
              >
                <div className="text-xs opacity-50 mb-1 flex justify-between gap-4">
                  <span>{msg.role === "user" ? "You" : "Assistant"}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
                {msg.table && (
                  <div className="mt-4">
                    <DataTable data={msg.table} />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="glass-card border-white/5 text-slate-400 rounded-2xl rounded-tl-none px-6 py-4 flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                </div>
                <span className="text-sm font-medium">
                  Analyzing and generating data...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Action Center (Sticky Bottom) */}
        <div className="sticky bottom-0 pb-8 pt-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
          <div className="glass-card rounded-3xl p-6 shadow-2xl border-white/10">
            <form onSubmit={handleSubmit} className="flex items-center gap-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What data would you like to generate today?"
                className="flex-1 bg-slate-900/50 border border-white/10 rounded-2xl py-4 px-6 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className={`bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold px-8 py-4 rounded-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-lime-500/20 ${
                  isLoading || !prompt.trim()
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      />
                    </svg>
                    Generate
                  </>
                )}
              </button>
            </form>
            <p className="text-center text-[10px] text-slate-500 mt-3 uppercase tracking-widest font-semibold">
              Instant CSV Export
            </p>
          </div>
        </div>
      </main>

      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-lime-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px]" />
      </div>
    </div>
  );
};

export default CSVGenerator;
