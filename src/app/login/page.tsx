'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, User, Lock, Loader2 } from 'lucide-react';
import { translations, Lang } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Lang>('en');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const t = (key: string): string => {
    const keyMap: Record<string, string> = {
      change_password: 'changePassword', new_password: 'newPassword',
      confirm_password: 'confirmPassword', password_min_length: 'passwordMinLength',
      passwords_do_not_match: 'passwordsDoNotMatch', project_management_system: 'projectMgmtSystem',
      enter_username: 'username', enter_password: 'password',
      enter_new_password: 'newPassword', confirm_new_password: 'confirmPassword',
      submit: 'save',
    };
    const mappedKey = keyMap[key] || key;
    const currentTranslations = translations[language] || translations['en'];
    return currentTranslations[mappedKey] || key;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      if (data.must_change_password) {
        setMustChangePassword(true);
        setLoading(false);
        return;
      }

      router.push('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError(t('password_min_length'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwords_do_not_match'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: password, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password');
        setLoading(false);
        return;
      }

      router.push('/');
    } catch (err) {
      setPasswordError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-white to-[#E0F2FE] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-[#003087] rounded-full mix-blend-multiply filter blur-3xl opacity-[0.06] animate-blob"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#00AEEF] rounded-full mix-blend-multiply filter blur-3xl opacity-[0.06] animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="bg-white/90 backdrop-blur border border-[#E2E8F0] rounded-2xl p-8 shadow-xl animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
                <Image src="/logo.png" alt="TOMAS TECH" width={80} height={80} className="w-20 h-20 object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-[#003087]">TOMAS TECH</h1>
              <p className="text-gray-500 text-sm mt-1">{t('change_password')}</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  {t('new_password')}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087] transition-all"
                  placeholder={t('enter_new_password')}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  {t('confirm_password')}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087] transition-all"
                  placeholder={t('confirm_new_password')}
                  disabled={loading}
                />
              </div>

              {passwordError && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
                  {passwordError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-6 bg-gradient-to-r from-[#003087] to-[#00AEEF] text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {t('submit')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-white to-[#E0F2FE] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#003087] rounded-full mix-blend-multiply filter blur-3xl opacity-[0.06] animate-blob"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#00AEEF] rounded-full mix-blend-multiply filter blur-3xl opacity-[0.06] animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-[#F7941D] rounded-full mix-blend-multiply filter blur-3xl opacity-[0.04] animate-blob animation-delay-4000"></div>
      </div>

      {/* Main login card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/90 backdrop-blur border border-[#E2E8F0] rounded-2xl p-8 shadow-xl animate-fade-in hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
              <Image src="/logo.png" alt="TOMAS TECH" width={80} height={80} className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-[#003087] mt-3">TOMAS TECH</h1>
            <p className="text-gray-500 text-sm mt-1">{t('project_management_system')}</p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username field */}
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                {t('username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087] transition-all"
                  placeholder={t('enter_username')}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087] transition-all"
                  placeholder={t('enter_password')}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                  suppressHydrationWarning
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3 mt-6 bg-gradient-to-r from-[#003087] to-[#00AEEF] text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {t('login')}
            </button>
          </form>

          {/* Language switcher */}
          <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex justify-center gap-4">
            {(['th', 'en', 'jp'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`text-xs font-medium transition-all ${
                  language === lang
                    ? 'text-[#003087] underline decoration-2 underline-offset-2'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
