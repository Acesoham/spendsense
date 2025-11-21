export default function About(){
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-800" />
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">About SpendSense</h1>
          <p className="mt-3 md:mt-4 text-base md:text-lg opacity-85 max-w-3xl">
            Our mission is to bring clarity, automation, and intelligence to personal finance.
          </p>
        </header>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <p>
            SpendSense is an AI-powered expense tracker designed to make money management simple,
            smart, and stress-free. Built with a modern MERN stack and advanced AI abilities, SpendSense
            helps you understand your spending patterns, make better financial decisions, and stay in
            control of your budget — all in real time.
          </p>
          <p>
            Instead of manually sorting through transactions and expenses, SpendSense analyzes your data instantly,
            generates insights, and gives you a clear picture of where your money is going.
          </p>
          <p>
            Whether you're a student, a working professional, or managing a household, SpendSense adapts to your
            lifestyle and gives you powerful tools to build healthier financial habits.
          </p>

          <h2>What you get</h2>
          <ul>
            <li>Smart categorization and real-time insights powered by AI</li>
            <li>Clean charts and reports to visualize income and expenses</li>
            <li>Dark/Light mode for comfortable viewing</li>
            <li>UPI import support for quick data onboarding</li>
            <li>An AI coach to answer finance questions and suggest actions</li>
          </ul>

          <h2>Our promise</h2>
          <p>
            We believe finance tools should be clear, privacy-respecting, and helpful. SpendSense is built to
            simplify your decisions, not add noise—so you can focus on the goals that matter.
          </p>
        </article>
      </div>
    </section>
  )
}
