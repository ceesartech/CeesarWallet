import React from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const HomePage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in page on load
    router.push('/signin');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#0d1117',
      color: '#f0f6fc',
      fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif'
    }}>
      <div>
        <h1>CeesarTrader Trading Platform</h1>
        <p>Redirecting to sign-in...</p>
      </div>
    </div>
  );
};

export default HomePage;
