// src/utils/contentScan.js   (or wherever you keep API helpers)
import axios from "axios";
import { getCsrfToken } from "./api";      // keep if you use CSRF

const API_BASE = import.meta.env.VITE_API_BASE;

/* ---------- PDF ---------- */
export async function uploadPdf(file,firebaseUid) {
  if (!file) throw new Error("No PDF file provided");
  if (!firebaseUid) throw new Error("No Firebase UID provided");
  const fd = new FormData();
  fd.append("pdf", file);

  const csrf = await getCsrfToken();       // drop if not needed
  const res = await axios.post(`${API_BASE}/process-pdf/`, fd, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-CSRFToken": csrf,  
      Authorization: `Bearer ${firebaseUid}`,               // drop if not needed
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
  const res = await axios.post(
    `${API_BASE}/analyze/yt`,
    { url },
    {
      headers: { "X-CSRFToken": csrf },    // drop if not needed
      withCredentials: true,
    }
  );

  return res.data;                         // { ok: true, … }
}
