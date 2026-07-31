import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}