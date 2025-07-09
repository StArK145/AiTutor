// src/utils/contentScan.js   (or wherever you keep API helpers)
import axios from "axios";
import { getCsrfToken } from "./api";      // keep if you use CSRF
import { getFirebaseIdToken } from "./firebase"; // keep if you use Firebase auth

const API_BASE = import.meta.env.VITE_API_BASE;

/* ---------- PDF ---------- */
export async function uploadPdf(file) {
  if (!file) throw new Error("No PDF file provided");
  const fd = new FormData();
  fd.append("pdf", file);

  const csrf = await getCsrfToken();
  const idToken = await getFirebaseIdToken();       // drop if not needed
  const res = await axios.post(`${API_BASE}/process-pdf/`, fd, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-CSRFToken": csrf,  
      Authorization: `Bearer ${idToken}`,               // drop if not needed
    },
    withCredentials: true,
  });
  console.log("PDF upload response:", res.data);
  
  return res.data;                         // { status: true, … }
}

/* ---------- YouTube ---------- */
export async function analyzeYoutube(url) {
  if (!url) throw new Error("No YouTube URL provided");

  const csrf = await getCsrfToken();       // drop if not needed
  const idToken = await getFirebaseIdToken(); // drop if not needed
  const res = await axios.post(
    `${API_BASE}/process-youtube/`,
    { url },
    {
      headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrf,  
      Authorization: `Bearer ${idToken}`,               // drop if not needed
    },    // drop if not needed
      withCredentials: true,
    }
  );

  return res.data;                         // { ok: true, … }
}


export async function askPdfQuestion(pdfId, question) {
  if (!pdfId || !question?.trim()) {
    throw new Error("pdfId and question are required");
  }
  const csrf = await getCsrfToken();
  const idToken = await getFirebaseIdToken();

  /* 2️⃣  POST to /api/question-answer/ */
  const res = await axios.post(
    `${API_BASE}/answer-question/`,          // adjust path if needed
    {
      pdf_id: pdfId,
      question: question.trim(),
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
        Authorization: `Bearer ${idToken}`,  // 👉 Django uses this
      },
    }
  );


  return res.data;                          
}