// src/contexts/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [firebaseIdToken, setFirebaseIdToken] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE;
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          const idToken = await user.getIdToken();
          setFirebaseUid(user.uid);
          setFirebaseIdToken(idToken);

          // Fetch CSRF only once after login
          const res = await axios.get(`${API_BASE}/get-csrf/`, {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
            withCredentials: true, // include cookies
          });

          if (res.data.csrfToken) {
            setCsrfToken(res.data.csrfToken);
          } else {
            console.warn("No CSRF token in response");
          }
        } catch (err) {
          console.error("Error during login token or CSRF fetch:", err);
        }
      } else {
        // Clear everything if user logs out
        setFirebaseUid(null);
        setFirebaseIdToken(null);
        setCsrfToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ firebaseUid, firebaseIdToken, csrfToken, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
