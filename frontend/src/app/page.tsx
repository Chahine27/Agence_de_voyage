'use client';

import { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useRouter } from 'next/navigation';

function App() {
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected } = useAccount();
  const { connectors, connect, error, status } = useConnect();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isConnected) {
      router.push('/travelList')
    }
  }, [isMounted, isConnected, router]);

  const ConnectView = () => (
    <div className="button-container">
      <h2>Connection</h2>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          type="button"
          className='button-login'
        >
          Connect with {connector.name}
        </button>
      ))}
      {status === 'pending' && <p>Connecting...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
    </div>
  );

  return (
    <div className="centered-container">
      {!isConnected ? <ConnectView /> : null}
    </div>
  );
}

export default App;
