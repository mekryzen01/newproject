'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useLoginController() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const session = localStorage.getItem('temple_session') || localStorage.getItem('supabase.auth.token');
    if (session) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple delay to make it feel premium
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'ชื่อผู้ใช้งาน หรือ รหัสผ่านไม่ถูกต้อง');
        return;
      }

      if (data.session) {
        localStorage.setItem('temple_session', JSON.stringify(data.session));
        router.push('/dashboard');
      } else {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setLoading(false);
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    error,
    setError,
    loading,
    handleLogin
  };
}
