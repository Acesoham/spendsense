export default function Home({ onOpenChat }) {
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-cyan-400/20" />
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">AI-powered Expense Tracker</h1>
        <p className="mt-5 text-xl md:text-2xl opacity-85">Track, analyze, and save smarter. Dark/light mode, charts, UPI import, and an AI coach.</p>
        <div className="mt-10 flex gap-4 justify-center">
          <a href="/register" className="btn btn-primary h-12 md:h-14 text-lg md:text-xl px-6 md:px-8">Get Started</a>
          <button className="h-12 md:h-14 px-6 md:px-8 border rounded-md text-lg md:text-xl" onClick={() => onOpenChat?.()}>
            Ask the AI
          </button>
        </div>
      </div>
    </section>
  )
}
