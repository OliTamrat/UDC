"use client";

import { Sun, Moon, Monitor, Settings } from "lucide-react";
import { useTheme, type Theme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";
import Modal from "./Modal";

const themeOptions: { value: Theme; labelKey: "settings.theme_light" | "settings.theme_dark" | "settings.theme_system"; icon: typeof Sun }[] = [
  { value: "light", labelKey: "settings.theme_light", icon: Sun },
  { value: "dark", labelKey: "settings.theme_dark", icon: Moon },
  { value: "system", labelKey: "settings.theme_system", icon: Monitor },
];

const languageOptions: { value: Locale; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Español", flag: "🇪🇸" },
];

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const isDark = resolvedTheme === "dark";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("settings.title")}
      subtitle={t("settings.subtitle")}
      icon={<Settings className={`w-5 h-5 ${isDark ? "text-udc-gold" : "text-udc-red"}`} />}
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        {/* Appearance */}
        <div>
          <label className={`block text-sm font-semibold mb-3 ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>
            {t("settings.appearance")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-sm transition-all ${
                    isActive
                      ? isDark
                        ? "bg-udc-blue/20 border-udc-blue/40 text-water-blue"
                        : "bg-blue-100 border-blue-300 text-blue-700"
                      : isDark
                        ? "bg-white/5 border-white/[0.06] text-[#D1D5DB] hover:border-[#6B7280]"
                        : "bg-[#F0F1F3] border-[#D1D5DB] text-[#1F2937] hover:border-[#9CA3AF]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{t(opt.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className={`block text-sm font-semibold mb-3 ${isDark ? "text-[#E5E7EB]" : "text-[#1F2937]"}`}>
            {t("settings.language")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {languageOptions.map((opt) => {
              const isActive = locale === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setLocale(opt.value)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm transition-all ${
                    isActive
                      ? isDark
                        ? "bg-udc-blue/20 border-udc-blue/40 text-water-blue"
                        : "bg-blue-100 border-blue-300 text-blue-700"
                      : isDark
                        ? "bg-white/5 border-white/[0.06] text-[#D1D5DB] hover:border-[#6B7280]"
                        : "bg-[#F0F1F3] border-[#D1D5DB] text-[#1F2937] hover:border-[#9CA3AF]"
                  }`}
                >
                  <span className="text-lg">{opt.flag}</span>
                  <span className="font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
