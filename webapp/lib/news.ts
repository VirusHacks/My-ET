export interface NewsArticle {
  id: string
  title: string
  excerpt: string
  content: string
  category: string
  ticker: string
  author: string
  timestamp: string
  readTime: number
  imageUrl?: string
}

// Mock news data generator based on sector and watchlist
export async function fetchNews(sector: string, watchlist: string[]): Promise<NewsArticle[]> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 300))

  const mockArticles: NewsArticle[] = [
    {
      id: '1',
      title: 'Tech Sector Shows Strong Recovery Amid AI Investments',
      excerpt: 'Major technology stocks rally as companies announce new AI initiatives and expand cloud infrastructure.',
      content: `The technology sector demonstrated robust growth today as investors showed renewed confidence in AI-driven innovation. Leading companies announced record-breaking investments in artificial intelligence and machine learning capabilities.

Several Fortune 500 tech firms reported quarterly earnings that exceeded analyst expectations, driven primarily by strong cloud computing divisions. The surge in AI adoption across industries has created unprecedented demand for computing resources and specialized software platforms.

Market analysts attribute the positive momentum to growing enterprise adoption of generative AI tools and the expansion of data center infrastructure. Companies focusing on semiconductor manufacturing also benefited from the increased demand for specialized processors required for AI workloads.

Looking ahead, industry experts predict continued growth in the AI sector as more companies integrate these technologies into their core operations. However, regulatory scrutiny around data privacy and responsible AI deployment could impact near-term valuations.`,
      category: 'Technology',
      ticker: 'TECH',
      author: 'Financial Analyst Sarah Chen',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      readTime: 5,
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    },
    {
      id: '2',
      title: 'Finance Sector Navigates Rate Uncertainties',
      excerpt: 'Banking stocks mixed as Federal Reserve signals potential interest rate adjustments in coming months.',
      content: `The finance sector faced mixed signals today as investors weighed the implications of the Federal Reserve's latest communication regarding monetary policy. Banking institutions showed cautious optimism about net interest margin opportunities.

Financial service providers are carefully positioning themselves ahead of potential rate adjustments. The current environment presents both opportunities and challenges for traditional banking models as digital finance continues to disrupt the sector.

Investment banks reported strong performance in advisory services, driven by increased M&A activity. However, trading revenues remained under pressure due to market volatility and reduced client positioning risk.

Insurance companies benefited from improved underwriting conditions and higher investment yields. The sector's performance will largely depend on how quickly inflation stabilizes and monetary policy evolves.`,
      category: 'Finance',
      ticker: 'FINANCE',
      author: 'Banking Expert Michael Rodriguez',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      readTime: 6,
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    },
    {
      id: '3',
      title: 'Legal Industry Adapts to AI-Powered Document Review',
      excerpt: 'Law firms increasingly adopt artificial intelligence for contract analysis and legal research, transforming practice management.',
      content: `The legal profession is undergoing a significant transformation as firms embrace AI technologies for document analysis and research. Traditional practice management is being reimagined through automation and intelligent workflows.

Leading law firms report substantial improvements in efficiency metrics after implementing AI-powered document review systems. These tools can process thousands of contracts in a fraction of the time required by human reviewers.

However, this technological shift raises important questions about legal ethics, confidentiality, and the future of legal services. Bar associations and regulatory bodies are actively developing frameworks to govern the use of AI in legal practice.

The adoption of these technologies is creating new opportunities for legal tech startups and established software providers. Law firms that embrace this transition early may gain competitive advantages in delivering services to corporate clients.`,
      category: 'Legal',
      ticker: 'LEGAL',
      author: 'Legal Tech Correspondent Amanda Brooks',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      readTime: 5,
      imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
    },
    {
      id: '4',
      title: 'Startups Report Record Funding Despite Market Volatility',
      excerpt: 'Venture capital activity remains robust as entrepreneurs navigate challenging economic conditions with innovative business models.',
      content: `The startup ecosystem showed resilience today as venture capital firms announced record funding rounds despite broader economic uncertainties. Entrepreneurs are securing resources to scale innovative solutions across multiple sectors.

Venture investors report strong interest in startups focused on sustainability, artificial intelligence, and healthcare technology. The current market environment has made valuations more realistic, attracting long-term institutional investors.

Early-stage startups are demonstrating impressive growth metrics and achieving profitability faster than previous cohorts. Founders emphasize the importance of unit economics and sustainable business models in their pitches to investors.

The democratization of technology and improved access to capital through various funding mechanisms has enabled a new wave of entrepreneurs. However, competition for top talent and market share remains intense as the ecosystem becomes increasingly crowded.`,
      category: 'Startups',
      ticker: 'STARTUP',
      author: 'Venture Capital Reporter James Wilson',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      readTime: 5,
      imageUrl: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80',
    },
    {
      id: '5',
      title: 'Green Energy Sector Accelerates Expansion Plans',
      excerpt: 'Renewable energy companies announce major infrastructure investments as government incentives boost industry growth.',
      content: `The renewable energy sector experienced a significant boost today as major energy companies announced billion-dollar investment plans. Government policies supporting clean energy transition continue to drive sector growth.

Solar and wind energy providers reported record contract backlog as utilities and corporations commit to renewable energy targets. The declining cost of renewable technology has improved the economics of clean energy projects.

Battery technology companies are racing to develop next-generation storage solutions to support grid stability. The electrification of transportation and heating sectors creates additional demand for renewable capacity.

Energy market analysts predict continued growth in the renewable sector as climate considerations become central to corporate strategy. However, supply chain challenges and permitting delays could impact near-term project timelines.`,
      category: 'Energy',
      ticker: 'ENERGY',
      author: 'Energy Markets Editor Patricia Moore',
      timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      readTime: 5,
      imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80',
    },
    {
      id: '6',
      title: 'Healthcare Innovation Drives Stock Performance Gains',
      excerpt: 'Biotech and pharmaceutical companies rally on breakthrough research announcements and FDA approvals.',
      content: `The healthcare sector demonstrated strong performance today as biotech companies announced major research breakthroughs. Investor confidence in the sector reflects optimism about novel treatment approaches and pipeline advancements.

Pharmaceutical companies reported positive results from late-stage clinical trials for several drug candidates. These developments could address significant unmet medical needs and expand market opportunities.

Digital health platforms continue to transform patient care delivery and reduce healthcare costs. Telemedicine providers report strong user growth and expanding insurance coverage for virtual care services.

Healthcare investors remain focused on companies with strong intellectual property portfolios and diversified revenue streams. The aging population and rising healthcare costs create long-term tailwinds for innovative healthcare solutions.`,
      category: 'Healthcare',
      ticker: 'HEALTH',
      author: 'Healthcare Correspondent Dr. Lisa Zhang',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      readTime: 6,
      imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80',
    },
  ]

  // Filter and reorder based on user preferences
  return mockArticles.sort(() => Math.random() - 0.5).slice(0, 9)
}

export interface BullBearPoint {
  point: string
  explanation: string
}

export interface BullBearAnalysis {
  bullish: BullBearPoint[]
  bearish: BullBearPoint[]
}

import { GoogleGenAI } from '@google/genai';

export async function generateBullBearAnalysis(articleText: string): Promise<BullBearAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. Falling back to mock data.");
    await new Promise(r => setTimeout(r, 2000));
    return {
      bullish: [
        {
          point: 'Strong Market Momentum',
          explanation: 'The sector shows robust growth indicators and positive investor sentiment.',
        },
        {
          point: 'Innovation Pipeline',
          explanation: 'Multiple breakthrough announcements signal continued competitive advantages.',
        },
      ],
      bearish: [
        {
          point: 'Regulatory Challenges',
          explanation: 'Increased scrutiny from government bodies could impact operations and profitability.',
        },
        {
          point: 'Supply Chain Risks',
          explanation: 'Global supply chain disruptions may constrain production and increase costs.',
        },
      ],
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Analyze the following financial news article and extract up to 3 bullish factors and 3 bearish factors. Return exactly a JSON object with this exact structure, nothing else:
{
  "bullish": [{ "point": "Short title", "explanation": "Detailed explanation" }],
  "bearish": [{ "point": "Short title", "explanation": "Detailed explanation" }]
}

Article Text:
${articleText}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as BullBearAnalysis;
    }
  } catch (error) {
    console.error("Gemini API error:", error);
  }

  // Fallback if the API call fails
  return {
    bullish: [{ point: 'AI Generation Failed', explanation: 'Could not generate bullish points due to an error.' }],
    bearish: [{ point: 'AI Generation Failed', explanation: 'Could not generate bearish points due to an error.' }]
  };
}
