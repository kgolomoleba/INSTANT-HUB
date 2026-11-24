import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Toast = { id: number; text: string; tone: 'ok' | 'error' | 'info' }
type Api = { toast: (text: string, tone?: Toast['tone']) => void }

const Ctx = createContext<Api>({ toast: () => {} })
export const useToast = () => useContext(Ctx)

/** Short confirmations that slide in at the bottom and fade away on their own. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random()
    setItems((xs) => [...xs.slice(-2), { id, text, tone }])
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), tone === 'error' ? 7000 : 3500)
  }, [])
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="ui-toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`ui-toast ${t.tone}`} onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}>
            <span aria-hidden="true">{t.tone === 'ok' ? '✓' : t.tone === 'error' ? '!' : 'i'}</span>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
