'use server'

export interface Citation {
  title: string
  url: string
}

export interface VerificationResult {
  status: 'TRUE_ACCURATE' | 'FALSE_MISLEADING' | 'PARTIAL_CONTEXT' | 'INSUFFICIENT_DATA'
  summary: string
  citations: Citation[]
  confidence: number
}

export async function verifyMisinformation(
  formData: FormData
): Promise<VerificationResult> {
  // Simulate AI Vision API call with 3-second delay
  await new Promise(r => setTimeout(r, 3000))

  // Extract file or text from formData
  const file = formData.get('file') as File | null
  const textInput = formData.get('text') as string | null

  // Mock analysis based on content
  let content = ''
  if (file) {
    content = `[Image: ${file.name}]`
  } else if (textInput) {
    content = textInput
  }

  // Simulate different results based on input
  const isRBIRelated = content.toLowerCase().includes('rbi')
  const isStockRelated = content.toLowerCase().includes('stock')
  const isBitcoinRelated = content.toLowerCase().includes('bitcoin')

  if (isRBIRelated) {
    return {
      status: 'FALSE_MISLEADING',
      summary:
        'This claim about RBI interest rate changes is inaccurate. According to the latest RBI monetary policy statement from March 2024, the repo rate remains at 6.5%. The claim in this image contradicts official RBI communications.',
      confidence: 0.95,
      citations: [
        {
          title: 'RBI Monetary Policy Statement - March 2024',
          url: 'https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx',
        },
        {
          title: 'Economic Times - RBI Keeps Rates Unchanged',
          url: 'https://economictimes.indiatimes.com/markets/rbi',
        },
      ],
    }
  }

  if (isStockRelated) {
    return {
      status: 'PARTIAL_CONTEXT',
      summary:
        'While the company mentioned has shown growth, the specific performance claims in this message lack proper context. Investors should check official quarterly reports and stock exchange filings for accurate information.',
      confidence: 0.78,
      citations: [
        {
          title: 'Company Q3 2024 Financial Results',
          url: 'https://www.bseindia.com',
        },
        {
          title: 'NSE Official Announcement',
          url: 'https://www.nseindia.com',
        },
      ],
    }
  }

  if (isBitcoinRelated) {
    return {
      status: 'FALSE_MISLEADING',
      summary:
        'This claim about Bitcoin regulation in India is misleading. The RBI has not banned cryptocurrency outright, but has restricted banking services. Users should refer to official government press releases for accurate information.',
      confidence: 0.92,
      citations: [
        {
          title: 'RBI Official Circular on Crypto',
          url: 'https://www.rbi.org.in/scripts/NotificationUser.aspx',
        },
        {
          title: 'Ministry of Finance - Crypto Policy Statement',
          url: 'https://finmin.gov.in',
        },
      ],
    }
  }

  // Default response
  return {
    status: 'INSUFFICIENT_DATA',
    summary:
      'Unable to verify this claim with confidence. The image or text provided does not contain sufficient verifiable financial information. Please provide more specific details about the claim.',
    confidence: 0.45,
    citations: [
      {
        title: 'ET Fact Check Guidelines',
        url: 'https://economictimes.indiatimes.com',
      },
    ],
  }
}
