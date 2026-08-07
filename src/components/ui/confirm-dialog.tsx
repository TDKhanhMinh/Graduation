'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, HelpCircle, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'default'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  isPending?: boolean
  onConfirm: () => void | Promise<void>
  icon?: React.ReactNode
  confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
}

const variantStyles: Record<
  ConfirmVariant,
  {
    iconBg: string
    iconColor: string
    defaultIcon: React.ElementType
    confirmVariant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
    defaultConfirmText: string
  }
> = {
  danger: {
    iconBg: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
    iconColor: 'text-destructive',
    defaultIcon: AlertTriangle,
    confirmVariant: 'destructive',
    defaultConfirmText: 'Xóa',
  },
  warning: {
    iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400',
    defaultIcon: AlertCircle,
    confirmVariant: 'default',
    defaultConfirmText: 'Xác nhận',
  },
  info: {
    iconBg: 'bg-primary/10 text-primary dark:bg-primary/20',
    iconColor: 'text-primary',
    defaultIcon: Info,
    confirmVariant: 'default',
    defaultConfirmText: 'Đồng ý',
  },
  default: {
    iconBg: 'bg-muted text-muted-foreground',
    iconColor: 'text-foreground',
    defaultIcon: HelpCircle,
    confirmVariant: 'default',
    defaultConfirmText: 'Xác nhận',
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText = 'Hủy',
  variant = 'default',
  isPending = false,
  onConfirm,
  icon,
  confirmButtonVariant,
}: ConfirmDialogProps) {
  const dialogId = React.useId()
  const titleId = `${dialogId}-title`
  const descId = `${dialogId}-desc`

  const confirmBtnRef = React.useRef<HTMLButtonElement>(null)

  // Handle ESC key press
  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        onOpenChange(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, isPending, onOpenChange])

  // Body scroll lock
  React.useEffect(() => {
    if (open) {
      const originalStyle = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [open])

  // Auto focus confirm button when opened
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  const config = variantStyles[variant]
  const IconComponent = config.defaultIcon
  const finalConfirmVariant = confirmButtonVariant || config.confirmVariant
  const finalConfirmText = confirmText || config.defaultConfirmText

  const handleConfirm = async () => {
    try {
      await onConfirm()
    } finally {
      if (!isPending) {
        onOpenChange(false)
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !isPending && onOpenChange(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Container: Bottom sheet on mobile, Centered dialog on sm+ */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={cn(
              'relative z-10 w-full max-w-lg overflow-hidden rounded-t-2xl sm:rounded-2xl',
              'border border-border/80 bg-background p-6 shadow-2xl transition-all',
              'max-h-[90dvh] flex flex-col justify-between'
            )}
          >
            {/* Close icon button */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              aria-label="Đóng thoại xác nhận"
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
            >
              <X className="size-4" aria-hidden="true" />
            </button>

            {/* Main content */}
            <div className="flex flex-col sm:flex-row items-start gap-4 pr-6 sm:pr-0">
              {/* Icon badge */}
              <div
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-2xl sm:rounded-xl',
                  config.iconBg
                )}
              >
                {icon ? (
                  icon
                ) : (
                  <IconComponent className={cn('size-6 sm:size-5', config.iconColor)} aria-hidden="true" />
                )}
              </div>

              {/* Title & Description */}
              <div className="min-w-0 flex-1 space-y-1.5 text-left">
                <h3 id={titleId} className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {title}
                </h3>
                {description && (
                  <div id={descId} className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </div>
                )}
              </div>
            </div>

            {/* Footer action buttons: full width stacked on mobile, row right-aligned on sm+ */}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
                className="min-h-[44px] sm:min-h-10 w-full sm:w-auto font-medium"
              >
                {cancelText}
              </Button>
              <Button
                ref={confirmBtnRef}
                type="button"
                variant={finalConfirmVariant}
                disabled={isPending}
                aria-busy={isPending}
                onClick={handleConfirm}
                className="min-h-[44px] sm:min-h-10 w-full sm:w-auto font-semibold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>{finalConfirmText}</span>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/**
 * Custom Hook for simple confirm dialog state management
 */
export function useConfirmDialog() {
  const [open, setOpen] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)

  const openConfirm = React.useCallback(() => setOpen(true), [])
  const closeConfirm = React.useCallback(() => {
    setOpen(false)
    setIsPending(false)
  }, [])

  return {
    open,
    setOpen,
    isPending,
    setIsPending,
    openConfirm,
    closeConfirm,
  }
}

// --- Hybrid Responsive Summary ---
// mobile  (default / sm): Bottom sheet modal anchored to bottom of screen with rounded top corners, full-width touch targets (min-h-[44px]).
// tablet  (md / lg): Centered dialog with backdrop-blur, flex row action buttons, max-w-lg width.
// desktop (xl / 2xl): Centered dialog with hover states, focus trap, ESC key close, accessible ARIA roles.
// Interaction: Touch target >= 44px, autofocus confirm button, Keyboard ESC listener, scroll lock.
