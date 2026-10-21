import './ComingSoonPage.scss'
import { useId } from 'react'
import { EmptyState } from '../../shared/ui/EmptyState/index.ts'

interface ComingSoonPageProps {
  title: string
  description: string
}

/** Placeholder for a screen that arrives with agency administration. */
export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  const headingId = useId()
  return (
    <section className="page" aria-labelledby={headingId}>
      <header className="page__header">
        <div>
          <h1 id={headingId}>{title}</h1>
          <p className="muted">{description}</p>
        </div>
      </header>
      <EmptyState title="Coming soon">This screen is part of the agency administration update.</EmptyState>
    </section>
  )
}
