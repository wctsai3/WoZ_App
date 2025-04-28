import IntakeQuestionnaire from '@/components/IntakeQuestionnaire';
import Link from 'next/link';

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
        
        <div className="mt-12 p-4 bg-muted/50 rounded-md max-w-lg">
          <h2 className="text-lg font-medium">For Design Wizards:</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If you are a design wizard helping with this experiment, you can access the wizard dashboard 
            directly at any time:
          </p>
          <div className="mt-3">
            <Link 
              href="/wizard" 
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Go to Wizard Dashboard
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            The dashboard will automatically detect when a user completes the questionnaire and allow you to manage their session.
          </p>
        </div>
      </main>
    </div>
  );
}


