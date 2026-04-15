'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password state
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showSetPwd, setShowSetPwd] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');

  // PIN state
  const [showChangePin, setShowChangePin] = useState(false);
  const [showSetPin, setShowSetPin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSaving, setPinSaving] = useState(false);
  const [pinMsg, setPinMsg] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('access_token') ?? '';
    if (!t) { router.push('/auth?redirect=/settings/security'); return; }
    setToken(t);
    loadUser(t);
  }, [router]);

  async function loadUser(t: string) {
    setLoading(true);
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(u);
      // Enrich with auth status
      if (u.email) {
        const check = await api.checkAuthMethod(u.email).catch(() => null);
        if (check) setUser((prev: any) => ({ ...prev, hasPassword: check.hasPassword }));
      }
      if (u.phone) {
        const pinStatus = await api.checkPinStatus(u.phone).catch(() => null);
        if (pinStatus) setUser((prev: any) => ({ ...prev, hasPin: pinStatus.hasPin }));
      }
    } catch {} finally { setLoading(false); }
  }

  function passwordStrength(pwd: string): { label: string; color: string; width: string } {
    if (!pwd) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: '33%' };
    if (score <= 3) return { label: 'Fair', color: 'bg-yellow-500', width: '66%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) { setPwdMsg('Passwords do not match'); return; }
    if (newPassword.length < 8) { setPwdMsg('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(newPassword)) { setPwdMsg('Password must contain an uppercase letter'); return; }
    if (!/[0-9]/.test(newPassword)) { setPwdMsg('Password must contain a digit'); return; }
    setPwdSaving(true); setPwdMsg('');
    try {
      await api.changePassword(oldPassword, newPassword, token);
      setPwdMsg('Password changed successfully!');
      setShowChangePwd(false);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      setUser((p: any) => ({ ...p, hasPassword: true }));
    } catch (e: any) { setPwdMsg(e.message || 'Failed to change password'); }
    finally { setPwdSaving(false); }
  }

  async function handleSetPassword() {
    if (newPassword !== confirmPassword) { setPwdMsg('Passwords do not match'); return; }
    if (newPassword.length < 8) { setPwdMsg('Password must be at least 8 characters'); return; }
    setPwdSaving(true); setPwdMsg('');
    try {
      await api.setPassword(newPassword, token);
      setPwdMsg('Password set successfully!');
      setShowSetPwd(false);
      setNewPassword(''); setConfirmPassword('');
      setUser((p: any) => ({ ...p, hasPassword: true }));
    } catch (e: any) { setPwdMsg(e.message || 'Failed to set password'); }
    finally { setPwdSaving(false); }
  }

  async function handleChangePin() {
    if (newPin !== confirmPin) { setPinMsg('PINs do not match'); return; }
    if (!/^\d{4,6}$/.test(newPin)) { setPinMsg('PIN must be 4-6 digits'); return; }
    setPinSaving(true); setPinMsg('');
    try {
      await api.changePin(currentPin, newPin, token);
      setPinMsg('PIN changed successfully!');
      setShowChangePin(false);
      setCurrentPin(''); setNewPin(''); setConfirmPin('');
    } catch (e: any) { setPinMsg(e.message || 'Failed to change PIN'); }
    finally { setPinSaving(false); }
  }

  async function handleSetPin() {
    if (newPin !== confirmPin) { setPinMsg('PINs do not match'); return; }
    if (!/^\d{4,6}$/.test(newPin)) { setPinMsg('PIN must be 4-6 digits'); return; }
    setPinSaving(true); setPinMsg('');
    try {
      await api.setPin(newPin, token);
      setPinMsg('PIN set successfully!');
      setShowSetPin(false);
      setNewPin(''); setConfirmPin('');
      setUser((p: any) => ({ ...p, hasPin: true }));
    } catch (e: any) { setPinMsg(e.message || 'Failed to set PIN'); }
    finally { setPinSaving(false); }
  }

  async function handleRemovePin() {
    if (!confirm('Are you sure? You will need OTP to login next time.')) return;
    try {
      await api.removePin(token);
      setPinMsg('PIN removed');
      setUser((p: any) => ({ ...p, hasPin: false }));
    } catch (e: any) { setPinMsg(e.message || 'Failed'); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  const strength = passwordStrength(newPassword);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/dashboard" className="text-sm text-orange-500 hover:underline mb-4 block">&larr; Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h1>

        {/* Auth Methods Overview */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Login Methods</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><span className="text-blue-600 text-sm font-bold">OTP</span></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">OTP Login</p>
                  <p className="text-xs text-gray-500">Always available via SMS/Email</p>
                </div>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${user?.hasPassword ? 'bg-purple-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.hasPassword ? 'bg-purple-100' : 'bg-gray-200'}`}>
                  <svg className={`w-4 h-4 ${user?.hasPassword ? 'text-purple-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Password</p>
                  <p className="text-xs text-gray-500">{user?.hasPassword ? 'Set — login without OTP' : 'Not set'}</p>
                </div>
              </div>
              {user?.hasPassword ? (
                <button onClick={() => { setShowChangePwd(true); setShowSetPwd(false); setPwdMsg(''); }} className="text-xs text-orange-500 font-medium hover:underline">Change</button>
              ) : (
                <button onClick={() => { setShowSetPwd(true); setShowChangePwd(false); setPwdMsg(''); }} className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full font-medium hover:bg-orange-600">Set Up</button>
              )}
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${user?.hasPin ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.hasPin ? 'bg-green-100' : 'bg-gray-200'}`}>
                  <svg className={`w-4 h-4 ${user?.hasPin ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Quick PIN</p>
                  <p className="text-xs text-gray-500">{user?.hasPin ? 'Set — fastest login option' : 'Not set'}</p>
                </div>
              </div>
              {user?.hasPin ? (
                <div className="flex gap-2">
                  <button onClick={() => { setShowChangePin(true); setShowSetPin(false); setPinMsg(''); }} className="text-xs text-orange-500 font-medium hover:underline">Change</button>
                  <button onClick={handleRemovePin} className="text-xs text-red-500 font-medium hover:underline">Remove</button>
                </div>
              ) : (
                <button onClick={() => { setShowSetPin(true); setShowChangePin(false); setPinMsg(''); }} className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full font-medium hover:bg-orange-600">Set Up</button>
              )}
            </div>
          </div>
        </div>

        {/* Password Form */}
        {(showChangePwd || showSetPwd) && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">{showChangePwd ? 'Change Password' : 'Set Password'}</h3>
            <div className="space-y-3">
              {showChangePwd && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Current Password</label>
                  <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" placeholder="Min 8 chars, 1 uppercase, 1 digit" />
                {newPassword && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full ${strength.color} transition-all`} style={{ width: strength.width }} /></div>
                    <p className={`text-xs mt-1 ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
              </div>
              {pwdMsg && <p className={`text-sm ${pwdMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{pwdMsg}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setShowChangePwd(false); setShowSetPwd(false); setPwdMsg(''); }} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium">Cancel</button>
                <button onClick={showChangePwd ? handleChangePassword : handleSetPassword} disabled={pwdSaving} className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg font-semibold disabled:opacity-50">
                  {pwdSaving ? 'Saving...' : showChangePwd ? 'Change Password' : 'Set Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PIN Form */}
        {(showChangePin || showSetPin) && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">{showChangePin ? 'Change PIN' : 'Set PIN'}</h3>
            <div className="space-y-3">
              {showChangePin && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Current PIN</label>
                  <input type="password" inputMode="numeric" maxLength={6} value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 tracking-widest" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">New PIN (4-6 digits)</label>
                <input type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 tracking-widest" placeholder="Avoid 1234, 0000, etc." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Confirm PIN</label>
                <input type="password" inputMode="numeric" maxLength={6} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 tracking-widest" />
              </div>
              {pinMsg && <p className={`text-sm ${pinMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{pinMsg}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setShowChangePin(false); setShowSetPin(false); setPinMsg(''); }} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium">Cancel</button>
                <button onClick={showChangePin ? handleChangePin : handleSetPin} disabled={pinSaving} className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg font-semibold disabled:opacity-50">
                  {pinSaving ? 'Saving...' : showChangePin ? 'Change PIN' : 'Set PIN'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Security Tips</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>- Set both Password and PIN to have multiple login options and reduce OTP dependency</p>
            <p>- PIN is fastest for mobile login (4-6 digits, like your bank app)</p>
            <p>- Password is most secure for desktop login (8+ characters with complexity)</p>
            <p>- OTP is always available as a fallback if you forget password or PIN</p>
            <p>- Avoid common PINs like 1234, 0000, or your birth year</p>
          </div>
        </div>
      </div>
    </div>
  );
}
