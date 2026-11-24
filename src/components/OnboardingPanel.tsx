import { Link } from 'react-router-dom'
import { trackEvent } from '../utils/analytics'
import './OnboardingPanel.css'

interface OnboardingPanelProps {
  profileComplete: boolean
  products: number
  services: number
}

/** A short checklist that goes away once the account is set up. */
export default function OnboardingPanel({ profileComplete, products, services }: OnboardingPanelProps) {
  const tasks = [
    { done: profileComplete, title: 'Complete your profile', hint: 'Add your role, location and a short bio so buyers can trust you.', to: '/profile', cta: 'Open profile', event: 'onboarding_complete_profile_click' },
    { done: products > 0, title: 'Publish a product', hint: 'List something you sell so buyers can contact you.', to: '/products', cta: 'Add product', event: 'onboarding_publish_product_click' },
    { done: services > 0, title: 'Offer a service', hint: 'Tell local businesses and buyers what you can do.', to: '/services', cta: 'Add service', event: 'onboarding_publish_service_click' },
  ]
  const doneCount = tasks.filter((t) => t.done).length
  if (doneCount === tasks.length) return null

  const track = (event: string) => {
    try {
      void trackEvent(event, { profileComplete, products, services })
    } catch {
      /* analytics must never break the page */
    }
  }

  return (
    <section className="onboarding-panel" aria-labelledby="onboarding-title">
      <div className="onboarding-head">
        <h2 id="onboarding-title">Get started</h2>
        <span className="onboarding-count">
          {doneCount} of {tasks.length}
        </span>
      </div>
      <div className="onboarding-bar" role="progressbar" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={doneCount}>
        <span style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
      </div>
      <ul className="onboarding-tasks">
        {tasks.map((t) => (
          <li key={t.title} className={`task-card ${t.done ? 'task-complete' : ''}`}>
            <span className="task-check" aria-hidden="true">{t.done ? '✓' : ''}</span>
            <div className="task-text">
              <h3>{t.title}</h3>
              {!t.done && <p>{t.hint}</p>}
            </div>
            {!t.done && (
              <Link to={t.to} className="btn-task" onClick={() => track(t.event)}>
                {t.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
