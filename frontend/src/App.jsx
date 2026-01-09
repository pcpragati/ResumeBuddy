import { useState } from 'react';
import axios from 'axios';
import { Upload, Sparkles, FileText, Flame, Check, AlertCircle, Zap } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("professional");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.pdf') || selectedFile.name.endsWith('.docx')) {
        setFile(selectedFile);
        setError("");
        setFeedback("");
      } else {
        setError("Please upload only PDF or DOCX files");
        setFile(null);
      }
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.pdf') || droppedFile.name.endsWith('.docx')) {
        setFile(droppedFile);
        setError("");
        setFeedback("");
      } else {
        setError("Please upload only PDF or DOCX files");
      }
    }
  };

  // Analyze resume
  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a resume first!");
      return;
    }

    setLoading(true);
    setError("");
    setFeedback("");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    try {
      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setFeedback(response.data.feedback);
      } else {
        setError("Failed to analyze resume");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Connection failed. Is backend running on port 8000?");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset everything
  const handleReset = () => {
    setFile(null);
    setFeedback("");
    setError("");
    setMode("professional");
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-5xl font-bold font-display gradient-text">
            ResumeBuddy
          </h1>
        </div>
        <p className="text-lg text-slate-600 font-medium">
          Your AI friend for honest resume feedback
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Get professional insights or fun roasts – you choose! 🎯
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Mode Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setMode("professional")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              mode === "professional"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105"
                : "bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200"
            }`}
          >
            <Check className="w-5 h-5" />
            Professional Mode
          </button>
          <button
            onClick={() => setMode("roast")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              mode === "roast"
                ? "bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-lg scale-105"
                : "bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200"
            }`}
          >
            <Flame className="w-5 h-5" />
            Roast Mode
          </button>
        </div>

        {/* Upload Section */}
        {!feedback && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 card-hover">
            <div
              className={`border-3 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                dragActive
                  ? "border-purple-500 bg-purple-50"
                  : "border-slate-300 hover:border-slate-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p className="text-xl font-semibold text-slate-700 mb-2">
                  {file ? file.name : "Drop your resume here"}
                </p>
                <p className="text-sm text-slate-500">
                  or click to browse (PDF or DOCX only)
                </p>
              </label>
            </div>

            {file && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                file && !loading
                  ? "btn-gradient text-white shadow-lg hover:shadow-xl"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Zap className="w-5 h-5 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze Resume
                </>
              )}
            </button>
          </div>
        )}

        {/* Feedback Section */}
        {feedback && (
          <div className="bg-white rounded-2xl shadow-xl p-8 card-hover">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {mode === "professional" ? (
                  <Check className="w-8 h-8 text-blue-600" />
                ) : (
                  <Flame className="w-8 h-8 text-orange-500" />
                )}
                <h2 className="text-2xl font-bold text-slate-800">
                  {mode === "professional" ? "Professional Feedback" : "Roast Results 🔥"}
                </h2>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Analyze Another
              </button>
            </div>

            <div className="prose prose-slate max-w-none">
              <pre className="whitespace-pre-wrap font-body text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-200">
                {feedback}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto mt-12 text-center text-sm text-slate-500">
        <p>Built with ❤️ by Team Bug Busters • Powered by Groq AI</p>
      </div>
    </div>
  );
}

export default App;