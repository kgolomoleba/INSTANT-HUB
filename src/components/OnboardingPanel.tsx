import { Link } from 'react-router-dom'
import { trackEvent } from '../utils/analytics'
import './OnboardingPanel.css'

interface OnboardingPanelProps {
  profileComplete: boolean
  products: number
  services: number
}

export default function OnboardingPanel({ profileComplete, products, services }: OnboardingPanelProps) {
  const hasProducts = products > 0
  const hasServices = services > 0
  const needsHelp = !profileComplete || !hasProducts || !hasServices

  const onActionClick = (eventName: string) => {
    try {
      trackEvent(eventName, { profileComplete, products, services })
    } catch {
      // ignore analytics errors
    }
  }

  return (
    <section className="onboarding-panel" aria-labelledby="onboarding-title">
      <div className="onboarding-panel-header">
        <div>
          <span className="onboarding-badge">New</span>
          <h2 id="onboarding-title">Get started with Instant Hub</h2>
        </div>
        <p className="onboarding-panel-copy">
          Follow this quick launch checklist to make your account discoverable, list your first offers, and start connecting with buyers.
        </p>
      </div>

      {needsHelp ? (
        <div className="onboarding-tasks">
          <article className={`task-card ${profileComplete ? 'task-complete' : ''}`}>
            <div>
              <h3>Complete your profile</h3>
              <p>{profileComplete ? 'Your profile is ready to be found by customers.' : 'Add your role, location, and bio so buyers can trust your business.'}</p>
            </div>
            <Link
              to="/profile"
              className="btn-task"
              onClick={() => onActionClick('onboarding_complete_profile_click')}
            >
              {profileComplete ? 'View Profile' : 'Complete Profile'}
            </Link>
          </article>

          <article className={`task-card ${hasProducts ? 'task-complete' : ''}`}>
            <div>
              <h3>Publish a product</h3>
              <p>{hasProducts ? 'You already have product listings live.' : 'Share a product listing so buyers can start contacting you.'}</p>
            </div>
            <Link
              to="/products"
              className="btn-task"
              onClick={() => onActionClick('onboarding_publish_product_click')}
            >
              {hasProducts ? 'Manage Products' : 'Add Product'}
            </Link>
          </article>

          <article className={`task-card ${hasServices ? 'task-complete' : ''}`}>
            <div>
              <h3>Offer a service</h3>
              <p>{hasServices ? 'Your service offerings are visible to the marketplace.' : 'List a service to reach local businesses and buyers.'}</p>
            </div>
            <Link
              to="/services"
              className="btn-task"
              onClick={() => onActionClick('onboarding_publish_service_click')}
            >
              {hasServices ? 'Manage Services' : 'Add Service'}
            </Link>
          </article>
        </div>
      ) : (
        <div className="onboarding-success">
          <h3>Everything looks good.</h3>
          <p>You're ready to build momentum. Browse the marketplace to convert interest into real business.</p>
          <Link
            to="/marketplace"
            className="btn-primary"
            onClick={() => onActionClick('onboarding_browse_marketplace_click')}
          >
            Explore Marketplace</Link>
        </div>
      )}
    </section>
  )
}
