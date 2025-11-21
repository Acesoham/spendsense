import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Home({ onOpenChat }) {
  const { token } = useAuth()
  const navigate = useNavigate()

  const handleSpendAI = () => {
    if (onOpenChat) return onOpenChat()
    if (token) return navigate('/dashboard')
    return navigate('/features')
  }

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-800" />
      {/* Right-side grey curve */}
      <div className="absolute -z-10 right-[-25%] md:right-[-18%] top-[-10%] w-[110vh] md:w-[90vh] aspect-square rounded-full bg-gradient-to-b from-gray-300 to-gray-500 dark:from-gray-800 dark:to-gray-700" />
      {/* Right vertical strip to mimic mock */}
      <div className="absolute -z-10 right-0 top-0 h-full w-6 bg-gradient-to-b from-gray-600 to-gray-500 dark:from-gray-700 dark:to-gray-600" />
      <div className="max-w-6xl mx-auto px-6 min-h-[calc(100vh-8rem)] flex items-center">
        <div className="text-left max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-wide leading-tight drop-shadow-[0_1px_0_rgba(0,0,0,0.7)]">
            AI-POWERED EXPENSE TRACKER
          </h1>
          <p className="mt-4 md:mt-5 text-base md:text-xl opacity-85">
            Track,Analyze and save smarter. Dark/light mode , charts, UPI imports,
            and an AI coach
          </p>
          <div className="mt-12 flex gap-6">
            <Link
              to="/register"
              className="h-11 md:h-12 px-6 md:px-7 rounded-md text-base md:text-lg bg-gradient-to-b from-gray-500 to-gray-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_3px_0_rgba(0,0,0,0.45)] border border-gray-900 ring-1 ring-black/30"
            >
              Get Started
            </Link>
            <Link to="/ChatbotModal" className="h-11 md:h-12 px-6 md:px-7 rounded-md text-base md:text-lg bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-[inset_0_2px_0_rgba(255,255,255,0.9),0_3px_0_rgba(0,0,0,0.4)] border-2 border-gray-700 ring-1 ring-black/20">
              SpendAI
            </Link>
          
          </div>
        </div>
      </div>
    </section>
  )
}
