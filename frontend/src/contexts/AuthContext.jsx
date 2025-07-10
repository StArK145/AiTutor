// src/contexts/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [firebaseIdToken, setFirebaseIdToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const idToken = await user.getIdToken();
        setFirebaseUid(user.uid);
        setFirebaseIdToken(idToken);

        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_BASE}/get-csrf/`,
            {
              headers: { Authorization: `Bearer ${idToken}` },
              withCredentials: true,
            }
          );
          setCsrfToken(res.data.csrfToken);
        } catch (err) {
          console.error("Error fetching CSRF:", err);
        }
      } else {
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
      value={{ firebaseUid, csrfToken, firebaseIdToken, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
