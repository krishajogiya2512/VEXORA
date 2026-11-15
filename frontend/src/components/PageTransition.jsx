import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * Wraps page content with a subtle fade + slight upward slide on route change.
 * Respect prefers-reduced-motion via the CSS media query in index.css.
 */
export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

