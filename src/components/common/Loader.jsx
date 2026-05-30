/*
 * Loader.jsx — A loading indicator shown while data is being fetched or
 * a slow operation is in progress.
 *
 * It supports two visual styles: a classic spinning ring ('spinner') and
 * three bouncing dots ('dots'). It can render inline within a page section
 * or as a full-screen overlay that blocks the entire UI while loading. Used
 * in page components, modals, and tables throughout the app.
 */

/*
 * Loader props:
 *  - size: 'sm' | 'md' | 'lg' — controls how large the spinner is
 *  - text: message displayed below the animation (set to null to hide it)
 *  - fullscreen: when true, covers the whole screen with a white overlay
 *  - variant: 'spinner' (rotating ring) | 'dots' (three bouncing circles)
 */
export default function Loader({
  size = 'md',
  text = 'Loading...',
  fullscreen = false,
  variant = 'spinner',
}) {
  // Map size names to Tailwind width/height and border-width classes.
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
  };

  /*
   * Build the animation element once and reuse it in both the fullscreen
   * and inline render paths below. The spinner is a circle where only the
   * top border segment is coloured, creating the "rotating arc" illusion.
   * The dots use staggered animation-delay so they bounce in sequence.
   */
  const loader =
    variant === 'spinner' ? (
      <div className={`${sizeClasses[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin`}></div>
    ) : (
      <div className="flex gap-1">
        <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    );

  // Fullscreen mode: a fixed overlay that sits on top of everything (z-50).
  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50">
        {loader}
        {/* Only render the text paragraph if a non-empty string was passed */}
        {text && <p className="mt-4 text-secondary-600 font-medium">{text}</p>}
      </div>
    );
  }

  // Inline mode: centred within whatever container wraps this component.
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {loader}
      {text && <p className="mt-4 text-secondary-600 font-medium">{text}</p>}
    </div>
  );
}
