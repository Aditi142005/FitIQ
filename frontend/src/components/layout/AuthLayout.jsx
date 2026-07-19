function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex">

      <div className="w-1/2 flex flex-col justify-center px-20">

        <h1 className="text-5xl font-heading font-bold text-primary mb-6">
          FitIQ
        </h1>

        <h2 className="text-4xl font-heading font-semibold mb-4">
          Hello, I'm VARMA 🤖
        </h2>

        <p className="text-lg text-textSecondary leading-8 max-w-lg">
          Your Virtual AI Recommendation &
          Monitoring Assistant.
        </p>

        <p className="mt-6 text-textSecondary italic">
          Every healthier tomorrow starts with one smart decision today.
        </p>

      </div>

      <div className="w-1/2 flex justify-center items-center">

        {children}

      </div>

    </div>
  );
}

export default AuthLayout;