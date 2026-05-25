import { useState, useEffect } from 'react';
import ScreenSizeDialog from './ScreenSizeDialog';
import { IS_WEBSITE_MODE } from '../lib/platform';

interface ScreenSizeProviderProps {
  children: React.ReactNode;
}

const ScreenSizeProvider = ({ children }: ScreenSizeProviderProps) => {
  if (IS_WEBSITE_MODE) {
    return <>{children}</>;
  }

  const [isScreenTooSmall, setIsScreenTooSmall] = useState(false);

  const checkScreenSize = () => {
    const isSmall = window.innerWidth < 1024;
    setIsScreenTooSmall(isSmall);
  };

  useEffect(() => {
    // Check on mount
    checkScreenSize();

    // Add resize listener
    const handleResize = () => {
      checkScreenSize();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Show dialog if screen is too small
  if (isScreenTooSmall) {
    return <ScreenSizeDialog />;
  }

  // Render children if screen size is acceptable
  return <>{children}</>;
};

export default ScreenSizeProvider; 