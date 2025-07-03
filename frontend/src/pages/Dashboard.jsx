import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Loader2, Wallet } from 'lucide-react';  // optional icons

const API_BASE = import.meta.env.VITE_API_BASE; // e.g. "http://localhost:8000/api"
const Dashboard = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState(null);
  const [statusMsg, setStatusMsg]   = useState('');
  const [loading, setLoading]       = useState(false);

  /* ------------------------------------------------------------------ */
  /* helpers                                                            */
  /* ------------------------------------------------------------------ */
  const token = localStorage.getItem('token');
  const username =
    JSON.parse(localStorage.getItem('user') || '{}').username || 'User';

  const axiosAuth = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  });

  /* ------------------------------------------------------------------ */
  /* initial wallet fetch                                               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }
    (async () => {
      try {
        const { data } = await axiosAuth.get('/dashboard/'); // returns wallet
        setWalletAddress(data.address || null);
      } catch (err) {
        console.error(err);
        // token might be invalid
        navigate('/auth');
      }
    })();
  }, []);

  /* ------------------------------------------------------------------ */
  /* MetaMask helpers                                                   */
  /* ------------------------------------------------------------------ */
  const hasMetaMask = () => {
    if (typeof window.ethereum === 'undefined') {
      setStatusMsg(
        'MetaMask not detected – please install the browser extension first.'
      );
      return false;
    }
    return true;
  };

  /* ------------------------------------------------------------------ */
  /* connect wallet                                                     */
  /* ------------------------------------------------------------------ */
  const connectWallet = async () => {
    if (!hasMetaMask()) return;
    setLoading(true);
    setStatusMsg('Connecting…');

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const address = accounts[0];

      await axiosAuth.put('/wallet/', { address });
      setWalletAddress(address);
      setStatusMsg('Wallet connected ✅');
    } catch (err) {
      console.error(err);
      setStatusMsg(err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* disconnect wallet                                                  */
  /* ------------------------------------------------------------------ */
  const disconnectWallet = async () => {
    setLoading(true);
    setStatusMsg('Disconnecting…');

    try {
      await axiosAuth.put('/wallet/', { address: null });
      setWalletAddress(null);
      setStatusMsg('Disconnected');
    } catch (err) {
      console.error(err);
      setStatusMsg('Could not disconnect');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-200 p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6">
          Welcome to your Dashboard, {username}!
        </h2>

        {/* Wallet card ------------------------------------------------- */}
        <div className="border rounded-xl p-6">
          <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5" />
            Wallet Status
          </h3>

          {walletAddress ? (
            <>
              <p className="mb-4 break-all">
                Connected Wallet:&nbsp;
                <span className="font-mono text-sm">{walletAddress}</span>
              </p>
              <button
                onClick={disconnectWallet}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="animate-spin h-4 w-4" />
                    Disconnecting…
                  </span>
                ) : (
                  'Disconnect Wallet'
                )}
              </button>
            </>
          ) : (
            <>
              <p className="mb-4">No wallet connected yet.</p>
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="animate-spin h-4 w-4" />
                    Connecting…
                  </span>
                ) : (
                  'Connect MetaMask'
                )}
              </button>
            </>
          )}

          {/* status message */}
          {statusMsg && (
            <p className="mt-4 text-sm text-gray-600">{statusMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
