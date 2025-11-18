import React, { useRef, useState, useEffect } from 'react';

export default function LazyImage({
  src,
  alt = '',
  className = '',
  style = {},
  placeholderClassName = '',
  placeholderStyle = {},
  rootMargin = '200px'
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      }, { rootMargin });
      obs.observe(ref.current);
      return () => obs.disconnect();
    }
    // fallback: immediately visible
    setVisible(true);
  }, [ref, rootMargin]);

  // Avoid rendering an <img> with an empty src to prevent browser warnings.
  if (!visible) {
    return (
      <div
        ref={ref}
        className={`${placeholderClassName} ${className}`.trim()}
        style={{ backgroundColor: '#f6f6f6', ...placeholderStyle, ...style }}
      />
    );
  }

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
    />
  );
}
