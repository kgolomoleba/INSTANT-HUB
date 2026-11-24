import { useToast } from './Toast'

/** Opens the phone's share sheet (WhatsApp, SMS, email…); on computers, copies the link. */
export default function ShareButton({ title, text, url, className = 'ui-btn small' }: { title: string; text?: string; url: string; className?: string }) {
  const { toast } = useToast()
  return (
    <button
      type="button"
      className={className}
      aria-label={`Share ${title}`}
      onClick={async (e) => {
        e.stopPropagation()
        try {
          if (navigator.share) await navigator.share({ title, text, url })
          else {
            await navigator.clipboard.writeText(url)
            toast('Link copied')
          }
        } catch (err) {
          if ((err as DOMException)?.name !== 'AbortError') toast("Couldn't share right now", 'error')
        }
      }}
    >
      ↗ Share
    </button>
  )
}
