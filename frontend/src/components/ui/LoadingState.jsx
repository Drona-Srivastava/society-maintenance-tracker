export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="dashboard-loading" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
