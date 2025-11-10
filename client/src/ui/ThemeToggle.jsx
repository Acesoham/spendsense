export default function ThemeToggle() {
  const toggle = () => {
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }
  return (
    <button onClick={toggle} className="h-10 md:h-11 px-4 md:px-5 border rounded-md text-base md:text-lg">🌓</button>
  )
}
