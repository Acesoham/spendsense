export default function Features(){
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-800" />
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Features</h1>
          <p className="mt-3 md:mt-4 text-base md:text-lg opacity-85 max-w-3xl">
            Explore the capabilities that make SpendSense smart, fast, and delightful to use.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard title="Smart AI-Based Insights" emoji="🔍" desc="Auto-categorizes expenses and surfaces trends, patterns, and improvement areas in real time." />
          <FeatureCard title="Interactive Dashboard" emoji="📊" desc="Track budgets, monthly summaries, and category-wise spending at a glance." />
          <FeatureCard title="AI Chat Assistant" emoji="🤖" desc="Ask natural questions like ‘How much did I spend on food last month?’ and get instant, data-backed answers." />
          <FeatureCard title="Easy Expense Logging" emoji="📝" desc="Add, edit, and manage expenses effortlessly—manual entry plus automated categorization." />
          <FeatureCard title="Monthly & Yearly Reports" emoji="📅" desc="Generate rich reports for better planning across months and years." />
          <FeatureCard title="Custom Budgets" emoji="🎯" desc="Set budgets per category and receive smart alerts as you approach limits." />
          <FeatureCard title="Real-Time Notifications" emoji="🔔" desc="Get alerts for unusual spending, upcoming bills, and budget thresholds." />
          <FeatureCard title="Secure & Private" emoji="🔒" desc="Your data is encrypted and handled with strict privacy standards." />
          <FeatureCard title="User-Friendly UI" emoji="🖥️" desc="A sleek, modern design that works smoothly on desktop and mobile." />
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ title, emoji, desc }){
  return (
    <div className="card p-5">
      <div className="text-2xl mb-2">{emoji}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm opacity-90">{desc}</p>
    </div>
  )
}
