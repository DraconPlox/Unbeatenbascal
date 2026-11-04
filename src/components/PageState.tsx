interface LoadingStateProps {
  title: string
  description?: string
}

export function LoadingState({ title, description }: LoadingStateProps) {
  return (
    <div className="page-state" role="status">
      <div className="page-state-icon" aria-hidden="true">⏳</div>
      <p className="page-state-title">{title}</p>
      {description && <p className="page-state-hint">{description}</p>}
    </div>
  )
}

interface ErrorStateProps {
  title: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({ title, description, onRetry, retryLabel = 'Reintentar' }: ErrorStateProps) {
  return (
    <div className="page-state" role="alert">
      <div className="page-state-icon" aria-hidden="true">⚠</div>
      <p className="page-state-title">{title}</p>
      {description && <p className="page-state-hint">{description}</p>}
      {onRetry && (
        <button type="button" className="page-state-button" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  )
}
