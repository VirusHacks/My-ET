import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-slate-100/50 dark:to-slate-950/30">
      <SignUp />
    </main>
  )
}
