
import IntakeQuestionnaire from '@/components/IntakeQuestionnaire';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold">
          Welcome to <span className="text-primary">Design Genie</span>
        </h1>

        <p className="mt-3 text-2xl">
          Let us help you design your dream space!
        </p>

        <div className="mt-6">
          <IntakeQuestionnaire />
        </div>
      </main>
    </div>
  );
}


