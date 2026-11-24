'use client'

import {
  Database,
  Download,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Settings,
  Sun
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { ReactNode, useEffect, useState } from 'react'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { GlassCard } from '@/components/ui/cards/glass-card'
import { ModalHeader } from '@/components/ui/modal/modal-header'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  Dialog,
  DialogContent,
  DialogHeader
} from '@/components/ui/shadui/dialog'

import { useAppVersion } from '@/hooks/use-app-version'
import { useDatabaseBackup } from '@/hooks/use-database-backup'

import { isTauri } from '@/lib/platform'

type ThemeOption = 'light' | 'dark' | 'system'

const themeOptions: { value: ThemeOption; label: ReactNode }[] = [
  {
    value: 'light',
    label: (
      <>
        <Sun className="hidden size-4 sm:block" />
        Светлая
      </>
    )
  },
  {
    value: 'dark',
    label: (
      <>
        <Moon className="hidden size-4 sm:block" />
        Тёмная
      </>
    )
  },
  {
    value: 'system',
    label: (
      <>
        <Monitor className="hidden size-4 sm:block" />
        Системная
      </>
    )
  }
]

interface SettingsSectionProps {
  icon: ReactNode
  title: string
  children: ReactNode
}

function SettingsSection({ icon, title, children }: SettingsSectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h3>
      <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-5">
        {children}
      </div>
    </section>
  )
}

interface Props {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function SettingsModal({ isOpen, onOpenChange }: Props) {
  const { theme, setTheme } = useTheme()
  const appVersion = useAppVersion()

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => setIsMounted(true), [])

  // Desktop-only: the local file is not available in the web build
  const isDesktop = isMounted && isTauri()
  const { createBackup, isBackingUp } = useDatabaseBackup()

  const currentTheme: ThemeOption =
    theme === 'light' || theme === 'dark' ? theme : 'system'

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto p-0"
        showCloseButton={false}
      >
        <GlassCard
          className="rounded-3xl p-8 md:p-10"
          variant="solid"
        >
          <DialogHeader className="mb-6">
            <ModalHeader
              icon={<Settings className="size-6 text-white" />}
              title="Настройки"
              onClose={() => onOpenChange(false)}
            />
          </DialogHeader>

          <div className="space-y-7">
            <SettingsSection
              icon={<Palette className="size-4" />}
              title="Внешний вид"
            >
              <div className="space-y-3">
                <p className="font-medium">Тема оформления</p>
                <SegmentedControl
                  className="w-full"
                  options={themeOptions}
                  value={currentTheme}
                  onChange={nextTheme => setTheme(nextTheme)}
                />
              </div>
            </SettingsSection>

            {isDesktop && (
              <SettingsSection
                icon={<Database className="size-4" />}
                title="Данные"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium">Резервная копия базы данных</p>

                  <AccentButton
                    className="w-full shrink-0 sm:w-auto"
                    disabled={isBackingUp}
                    size="default"
                    type="button"
                    onClick={() => createBackup()}
                  >
                    {isBackingUp ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    {isBackingUp ? 'Сохранение...' : 'Сохранить копию'}
                  </AccentButton>
                </div>
              </SettingsSection>
            )}

            <p className="text-center text-xs text-muted-foreground">
              MyMoney
              {appVersion ? ` · Версия ${appVersion}` : ''}
            </p>
          </div>
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
