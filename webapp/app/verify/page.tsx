'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Shield, Loader2 } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard-header'
import { VerifyDropzone } from '@/components/verify-dropzone'
import { VerifyResult } from '@/components/verify-result'
import { Spinner } from '@/components/ui/spinner'
import {
  verifyMisinformation,
  type VerificationResult,
} from '@/app/actions/verifyMisinformation'

export default function VerifyPage() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!userId) {
      router.push('/sign-in')
      return
    }

    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setUserProfile(data)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchProfile()
  }, [isLoaded, userId, router])

  const handleVerify = async (file: File | null, text: string | null) => {
    if (!file && !text) return

    setIsVerifying(true)
    setResult(null)

    try {
      const formData = new FormData()
      if (file) {
        formData.append('file', file)
      }
      if (text) {
        formData.append('text', text)
      }

      const verificationResult = await verifyMisinformation(formData)
      setResult(verificationResult)
    } catch (error) {
      console.error('Verification error:', error)
      setResult({
        status: 'INSUFFICIENT_DATA',
        summary:
          'An error occurred during verification. Please try again later.',
        citations: [],
        confidence: 0,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleReset = () => {
    setResult(null)
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen w-full bg-gradient-to-br from-background via-background to-slate-100/50 dark:to-slate-950/30 flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </main>
    )
  }

  return (
    <>
      <DashboardHeader userId={userId} userProfile={userProfile} />
      <main className="min-h-screen bg-gradient-to-br from-background to-slate-100/50 dark:to-slate-950/30">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Fact Checking Engine</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4">
              ET Truth Engine
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              Combat financial misinformation with AI-powered fact-checking
            </p>
            <p className="text-sm text-muted-foreground">
              Upload a screenshot or paste a link to verify claims about market
              news, stock tips, and financial rumors
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-3xl mx-auto">
            {isVerifying ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Analyzing Claim
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Running AI Vision analysis... Please wait
                  </p>
                </div>
              </div>
            ) : result ? (
              <VerifyResult result={result} onReset={handleReset} />
            ) : (
              <VerifyDropzone
                onFileSelected={handleVerify}
                isLoading={isVerifying}
              />
            )}
          </div>

          {/* Info Section */}
          {!result && !isVerifying && (
            <div className="max-w-3xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-xl border border-border p-6 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-lg font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Upload or Paste
                </h3>
                <p className="text-sm text-muted-foreground">
                  Share a screenshot or link to the financial claim you want to
                  verify
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-lg font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  AI Analysis
                </h3>
                <p className="text-sm text-muted-foreground">
                  Our AI Vision API analyzes the claim against authoritative
                  sources
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-6 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-lg font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Get Results
                </h3>
                <p className="text-sm text-muted-foreground">
                  Receive a detailed verdict with citations from official
                  sources
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
