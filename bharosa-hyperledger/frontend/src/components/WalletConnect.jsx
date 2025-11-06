// 👛 Wallet Connection Component
import React, { useState, useEffect } from 'react';
import { connectWallet, getBalance, isMetaMaskInstalled, onAccountsChanged, disconnectWallet } from '../services/blockchain';

const WalletConnect = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if already connected
    checkConnection();

    // Listen for account changes
    onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        setWalletAddress(null);
        setBalance(null);
      } else {
        setWalletAddress(accounts[0]);
        loadBalance(accounts[0]);
      }
    });

    return () => {
      disconnectWallet();
    };
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          await loadBalance(accounts[0]);
        }
      } catch (err) {
        console.error('Failed to check connection:', err);
      }
    }
  };

  const loadBalance = async (address) => {
    try {
      const bal = await getBalance(address);
      setBalance(parseFloat(bal).toFixed(4));
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed. Please install MetaMask extension.');
      }

      const wallet = await connectWallet();
      setWalletAddress(wallet.address);
      setNetwork(wallet.network);
      
      await loadBalance(wallet.address);
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (walletAddress) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Wallet Connected</h3>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Address</p>
            <p className="text-sm font-mono font-semibold text-gray-800">{formatAddress(walletAddress)}</p>
            <p className="text-xs text-gray-400 mt-1">{walletAddress}</p>
          </div>

          {balance && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Balance</p>
              <p className="text-xl font-bold text-gray-800">{balance} ETH</p>
            </div>
          )}

          {network && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Network</p>
              <p className="text-sm font-medium text-gray-800">
                {network.name} (Chain ID: {network.chainId})
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Your blockchain identity is ready for KYC verification
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Connect Wallet</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Connect your MetaMask wallet to register your KYC verification on the blockchain.
        </p>
        {!isMetaMaskInstalled() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-yellow-800">
              ⚠️ MetaMask not detected. Please install MetaMask extension.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={isConnecting || !isMetaMaskInstalled()}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
          isConnecting || !isMetaMaskInstalled()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600 shadow-lg hover:shadow-xl'
        }`}
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            Connect MetaMask
          </>
        )}
      </button>

      <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Secure connection via MetaMask
      </div>
    </div>
  );
};

export default WalletConnect;
