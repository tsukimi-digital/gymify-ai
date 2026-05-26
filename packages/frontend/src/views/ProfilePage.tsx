// ═══════════════════════════════════════════════════════════
// GYMIFY AI — Profile Page
// User settings, language, units, logout
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Divider } from '../components/ui/primitives';
import { AppShell, TopBar, Page, Section } from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { email, logout } = useAuth();

  const avatarLetter = email ? email[0].toUpperCase() : '?';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleLanguage = (lang: 'pl' | 'en') => {
    i18n.changeLanguage(lang);
  };

  const handleUnits = async (units: 'METRIC' | 'IMPERIAL') => {
    try {
      await apiFetch('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ unitPreference: units }),
      });
    } catch {
      // Silently fail if backend not ready
    }
  };

  return (
    <AppShell>
      <Page>
        <TopBar title={t('profile.profile')} />

        <Section>
          {/* Avatar + email */}
          <div className="flex items-center gap-4 mb-6 pf-header">
            <div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <span className="font-display font-black text-3xl text-white">{avatarLetter}</span>
            </div>
            <div>
              <h2 className="heading-2 text-zinc-100">{email ?? 'Guest'}</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Gymify AI member</p>
            </div>
          </div>

          <Divider />

          {/* Training data section */}
          <div className="mb-6 pf-training">
            <p className="text-label mb-3">{t('profile.trainingData')}</p>
            <div className="flex flex-col gap-2">
              {([
                ['profile.profile', '👤', '/profile/edit'],
                ['profile.equipment', '🏋️', '/profile/equipment'],
                ['profile.injuries', '🩹', '/profile/injuries'],
                ['profile.benchmarks', '📊', '/profile/benchmarks'],
              ] as const).map(([key, icon, path]) => (
                <ProfileLink
                  key={key}
                  icon={icon}
                  label={t(key)}
                  onClick={() => navigate(path)}
                />
              ))}
            </div>
          </div>

          <Divider />

          {/* Settings section */}
          <div className="mb-6 pf-settings">
            <p className="text-label mb-3">{t('profile.settings')}</p>

            {/* Dark mode (deferred) */}
            <div className="flex items-center justify-between py-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌙</span>
                <span className="text-sm text-zinc-300">{t('profile.darkMode')}</span>
              </div>
              <div className="w-12 h-6 rounded-full bg-zinc-700 relative opacity-50 cursor-not-allowed" aria-disabled="true">
                <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-zinc-500" />
              </div>
            </div>

            {/* Units */}
            <div className="py-3 border-b border-zinc-800">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">⚖️</span>
                <span className="text-sm text-zinc-300">{t('profile.units')}</span>
              </div>
              <div className="flex gap-2 ml-9">
                {(['METRIC', 'IMPERIAL'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => handleUnits(u)}
                    className="flex-1 h-9 rounded-xl text-xs font-semibold border transition-all border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-orange-500/60"
                  >
                    {u === 'METRIC' ? t('profile.metric') : t('profile.imperial')}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="py-3">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">🌍</span>
                <span className="text-sm text-zinc-300">{t('profile.language')}</span>
              </div>
              <div className="flex gap-2 ml-9">
                {(['pl', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguage(lang)}
                    className={`flex-1 h-9 rounded-xl text-xs font-semibold border transition-all ${
                      i18n.language === lang
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {lang === 'pl' ? '🇵🇱 PL' : '🇬🇧 EN'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Divider />

          {/* Logout */}
          <div className="mt-4">
            <Button
              variant="danger"
              className="w-full"
              onClick={handleLogout}
            >
              {t('profile.logout')}
            </Button>
          </div>
        </Section>
      </Page>
    </AppShell>
  );
}

// ── Profile Link item ─────────────────────────────────────
function ProfileLink({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-all text-left"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-zinc-200">{label}</span>
      </div>
      <svg className="w-4 h-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  );
}
