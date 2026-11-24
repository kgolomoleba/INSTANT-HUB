import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useI18n } from './i18n'

type Req =
  | {
      kind: 'confirm'
      message: string
      ok?: string
      resolve: (v: boolean) => void
    }
  | {
      kind: 'prompt'
      message: string
      value: string
      ok?: string
      resolve: (v: string | null) => void
    }

type Api = {
  confirm: (message: string, ok?: string) => Promise<boolean>
  prompt: (
    message: string,
    value?: string,
    ok?: string
  ) => Promise<string | null>
}

const Ctx = createContext<Api>({
  confirm: async () => false,
  prompt: async () => null,
})
export const useDialog = () => useContext(Ctx)

/** In-app confirm / prompt boxes: large, readable, translated (instead of the browser's). */
export function DialogProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [req, setReq] = useState<Req | null>(null)
  const [value, setValue] = useState('')
  const okRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const confirm = useCallback(
    (message: string, ok?: string) =>
      new Promise<boolean>((resolve) =>
        setReq({ kind: 'confirm', message, ok, resolve })
      ),
    []
  )
  const prompt = useCallback(
    (message: string, v = '', ok?: string) =>
      new Promise<string | null>((resolve) => {
        setValue(v)
        setReq({ kind: 'prompt', message, value: v, ok, resolve })
      }),
    []
  )

  useEffect(() => {
    if (!req) return
    ;(req.kind === 'prompt' ? inputRef.current : okRef.current)?.focus()
    if (req.kind === 'prompt') inputRef.current?.select()
  }, [req])

  const close = (ok: boolean) => {
    if (!req) return
    if (req.kind === 'confirm') req.resolve(ok)
    else req.resolve(ok && value.trim() ? value.trim() : null)
    setReq(null)
  }

  return (
    <Ctx.Provider value={{ confirm, prompt }}>
      {children}
      {req && (
        <div className="dialog-backdrop" onClick={() => close(false)}>
          <form
            className="dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              close(true)
            }}
            onKeyDown={(e) => e.key === 'Escape' && close(false)}
          >
            <p>{req.message}</p>
            {req.kind === 'prompt' && (
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={200}
                aria-label={req.message}
              />
            )}
            <div className="dialog-actions">
              <button type="button" onClick={() => close(false)}>
                {t('dialog.cancel')}
              </button>
              <button type="submit" className="primary" ref={okRef}>
                {req.ok ?? t('dialog.ok')}
              </button>
            </div>
          </form>
        </div>
      )}
    </Ctx.Provider>
  )
}
