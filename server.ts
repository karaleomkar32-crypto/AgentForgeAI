/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('WARNING: GEMINI_API_KEY not configured or has default placeholder. Gemini AI features will run in mock fallback mode.');
}

// In-Memory Database for Agents
let agents: any[] = [
  {
    id: 'agent-1',
    name: 'AikenSmartAuditor',
    shortDescription: 'Secures Aiken Smart Contracts with on-chain vulnerability detection.',
    description: 'An enterprise-grade Aiken smart contract auditing agent. It analyzes Cardano Plutus v2/v3 code structures, identifies potential re-entrancy, double satisfaction issues, state machine lockups, and automatically suggests hardened test scenarios.',
    purpose: 'Audits Aiken smart contracts for Cardano',
    industry: 'DeFi & Blockchain Security',
    targetUsers: 'Cardano Developers, DeFi Protocol Founders',
    skills: ['Aiken Code Analysis', 'Plutus Validator Hardening', 'Cardano Ledger State Verification', 'Double Satisfaction Auditing'],
    personality: 'Professional, forensic, security-obsessed, highly precise.',
    knowledge: 'Aiken compiler v1.1.0, Plutus V2/V3 ledger representation, CIP-25, CIP-68 standards.',
    pricingAda: 5,
    pricingModel: 'Per Query',
    isPublished: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    creatorAddress: 'addr_test1qre8v9z789h7e8f5p9z8f85f...',
    systemPrompt: 'You are AikenSmartAuditor, an elite Cardano security agent. You analyze Aiken smart contract code to find critical ledger vulnerabilities (double satisfaction, incorrect datum checks, redeemer mismatch). Be extremely precise, outline vulnerabilities with severity (High/Medium/Low), and provide exact Aiken code fixes.',
    capabilities: [
      'Aiken v1.0+ syntactic and logic auditing',
      'Plutus transaction input-output consistency checking',
      'Cardano double-satisfaction vector detection',
      'Hardened unit test code generation'
    ],
    suggestedApis: ['Koios API', 'Blockfrost Cardano Node SDK', 'MeshJS Transaction Builder'],
    suggestedTools: ['Aiken compiler CLI', 'Lucid TX Builder', 'Kupo Indexed Ledger'],
    suggestedMonetization: 'Charges 5 ADA per validator audit query, verified via Masumi decentralized micro-escrow lock contracts.',
    securityNotes: 'Always verify generated code locally. Aiken validators are subject to compiler state assumptions.',
    workflow: 'Receive Aiken source code -> Map validator UTxO inputs & outputs -> Audit datum & redeemer validations -> Flag logical issues -> Synthesize Aiken fix block.',
    category: 'DeFi & Payments',
    rating: 4.9,
    reviewsCount: 14,
    salesCount: 128,
    reviews: [
      { id: 'r1', user: 'CardanoMax', rating: 5, comment: 'Audited my DEX liquidity pool validator and found an unhandled datum fallback. Saved us millions.', date: '2026-07-09' },
      { id: 'r2', user: 'AikenDev_99', rating: 4, comment: 'Highly precise! Suggested Plutus validation tweaks that optimized script size by 15%.', date: '2026-07-11' }
    ],
    masumiIdentity: 'did:cardano:masumi:agent-aikensmartauditor-0x8f23ad',
    metadataHash: 'ipfs://QmY8V7GgZ6mP2QW4T9n9q12L9z8fA7b6cX5d4e3f2g1h',
    registrationTxId: '6fa3b5cd8273934f10738d28e75b7f190e72bdcfcdeee21719b024479e0a2948',
    isMonetizationActive: true
  },
  {
    id: 'agent-2',
    name: 'AdaScribe',
    shortDescription: 'Generates optimized Technical Content for Cardano Ecosystem.',
    description: 'A powerful content curation and technical documentation agent optimized specifically for the Cardano ecosystem. It translates complex CIPs, Plutus technical specifications, and network updates into engaging blogs, developer docs, and social threads.',
    purpose: 'Draft developer documentation and educational material',
    industry: 'Content & Creation',
    targetUsers: 'Cardano SPOs, Developers, Marketing Teams',
    skills: ['Cardano CIP Translation', 'SPO Update Summaries', 'Technical Blog Post Drafting', 'Cardano Governance CIP-1694 explanations'],
    personality: 'Clear, informative, enthusiastic about decentralization, highly engaging.',
    knowledge: 'Cardano Roadmap, CIP-1694 Governance, Ouroboros consensus, Plutus architecture.',
    pricingAda: 2,
    pricingModel: 'Per Query',
    isPublished: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    creatorAddress: 'addr_test1qp8m1z...',
    systemPrompt: 'You are AdaScribe, an expert technical writer and developer advocate for Cardano. You convert complex technical documents or CIPs (like CIP-1694) into highly readable technical blogs, developer tutorials, and educational summaries. Maintain strict accuracy.',
    capabilities: [
      'CIP (Cardano Improvement Proposal) synthesis and breakdown',
      'Governance proposals explaining (CIP-1694)',
      'SPO network update summaries',
      'SEO-optimized developer technical drafting'
    ],
    suggestedApis: ['Cardano Spot API', 'Gimbalabs Education Network API'],
    suggestedTools: ['Markdown editor', 'GitBook integrations'],
    suggestedMonetization: 'Charges 2 ADA per 1,000 words generated, processed instantly via Cardano wallets with on-chain metadata registration.',
    securityNotes: 'Always double-check CIP specifications as governance details undergo ongoing community voting.',
    workflow: 'Input CIP or raw document -> Select target audience -> Generate comprehensive structured report -> Provide social amplification snippets.',
    category: 'Content & Creation',
    rating: 4.7,
    reviewsCount: 8,
    salesCount: 64,
    reviews: [
      { id: 'r3', user: 'SPO_AdaNation', rating: 5, comment: 'Drafted an amazing governance thread explaining the new constitution changes. Highly recommended.', date: '2026-07-10' }
    ],
    masumiIdentity: 'did:cardano:masumi:agent-adascribe-0x7a43f1',
    metadataHash: 'ipfs://QmZ9a6FbC5dB8EdD7AeG9CfH8jKc3g1dH2m3s4t5u6v',
    registrationTxId: 'a71b48f90cde23f4567e89ab01cd234fa567bcde34e567fa2345efab6789cd01',
    isMonetizationActive: true
  },
  {
    id: 'agent-3',
    name: 'MinswapYieldBot',
    shortDescription: 'DeFi optimization and real-time yield prediction on Cardano.',
    description: 'An AI-powered DeFi yields tracker and liquid provider strategist for Cardano decentralized exchanges (Minswap, WingRiders, VyFinance). It monitors pool APYs, simulates impermanent loss risk, and recommends capital reallocation.',
    purpose: 'Optimize yield farming allocations on Cardano DEXs',
    industry: 'Analytics & Data',
    targetUsers: 'DeFi Investors, Liquidity Providers',
    skills: ['DEX Liquidity Analysis', 'Impermanent Loss Calculation', 'ADA Staking Optimizations', 'Yield Harvest Alerts'],
    personality: 'Analytical, risk-aware, data-driven, conservative.',
    knowledge: 'Minswap v2 pool math, Cardano staking mechanics, ADA-to-Token exchange metrics.',
    pricingAda: 10,
    pricingModel: 'Subscription Monthly',
    isPublished: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    creatorAddress: 'addr_test1qz56u8...',
    systemPrompt: 'You are MinswapYieldBot, a financial data analyzer specializing in Cardano DEX liquidity. Analyze pool statistics (liquidity, volume, fees, ADA rewards) to determine optimal yields. Provide conservative estimates, factor in impermanent loss, and emphasize risk management.',
    capabilities: [
      'Real-time APY auditing for Cardano DEX pools',
      'Impermanent loss forecasting models',
      'Optimal staking pool reallocation suggestions',
      'Harvest cycle cost-efficiency algorithms'
    ],
    suggestedApis: ['Minswap V2 API', 'TapTools Market Analytics API', 'AdaStat API'],
    suggestedTools: ['Cardano Scan', 'DEX Aggregators', 'MeshJS'],
    suggestedMonetization: 'Subscription pricing of 10 ADA monthly. Activates an NFT license key on Cardano ledger.',
    securityNotes: 'Smart contracts carry smart-contract risk. Never provide absolute financial guarantees.',
    workflow: 'Fetch Cardano DEX liquidity data -> Evaluate APY history -> Model impermanent loss vs staking reward -> Formulate LP rebalancing report.',
    category: 'Analytics & Data',
    rating: 4.8,
    reviewsCount: 22,
    salesCount: 194,
    reviews: [
      { id: 'r4', user: 'ADA_Whale_007', rating: 5, comment: 'Brilliant recommendations. Saved me from significant impermanent loss during the latest token volatility.', date: '2026-07-05' }
    ],
    masumiIdentity: 'did:cardano:masumi:agent-minswapyieldbot-0x3c928e',
    metadataHash: 'ipfs://QmU4c7b8g6Hj5F3d2S1a0c9b8a7d6e5f4g3h2j1k0l9m',
    registrationTxId: 'bc2d8c39e01f23a456b7cd89e0123fabcd4567e89012cd34567efabc89012345',
    isMonetizationActive: true
  }
];

// Cardano mock transaction ledger
let transactions: any[] = [];

// Masumi Registry Audit Logs
let masumiLogs: any[] = [
  {
    id: 'log-1',
    agentId: 'agent-1',
    agentName: 'AikenSmartAuditor',
    eventType: 'Register',
    txHash: '6fa3b5cd8273934f10738d28e75b7f190e72bdcfcdeee21719b024479e0a2948',
    details: 'AI Agent "AikenSmartAuditor" published on Cardano Ledger with CIP-68 compliance metadata structure.',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    adaValue: 2.5
  },
  {
    id: 'log-2',
    agentId: 'agent-2',
    agentName: 'AdaScribe',
    eventType: 'Register',
    txHash: 'a71b48f90cde23f4567e89ab01cd234fa567bcde34e567fa2345efab6789cd01',
    details: 'AI Agent "AdaScribe" published with decentralized Masumi identity (DID: did:cardano:masumi:agent-adascribe-0x7a43f1).',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    adaValue: 2.5
  },
  {
    id: 'log-3',
    agentId: 'agent-3',
    agentName: 'MinswapYieldBot',
    eventType: 'Register',
    txHash: 'bc2d8c39e01f23a456b7cd89e0123fabcd4567e89012cd34567efabc89012345',
    details: 'AI Agent "MinswapYieldBot" registered. Monetization active under monthly subscription escrow protocol.',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    adaValue: 5.0
  }
];

// In-Memory conversations
let conversations: { [agentId: string]: any[] } = {};

// API Endpoint to generate Agent details using Gemini 3.5-flash
app.post('/api/agents/generate-config', async (req, res) => {
  const { name, purpose, shortDescription, industry, targetUsers, skills, personality, knowledge, pricingAda } = req.body;

  if (!name || !purpose) {
    return res.status(400).json({ error: 'Name and Purpose are required fields.' });
  }

  // Define dynamic prompt for Gemini
  const prompt = `
    You are an elite AI Architect and Senior Product Designer specialized in the Cardano blockchain and the Masumi Track (monetizing AI Agents).
    The user wants to create an AI Agent with the following inputs:
    - Name: "${name}"
    - Purpose: "${purpose}"
    - Short Tagline / Idea: "${shortDescription || ''}"
    - Industry: "${industry || 'General Tech'}"
    - Target Users: "${targetUsers || 'SaaS Developers'}"
    - Core Skills: ${JSON.stringify(skills || [])}
    - Personality: "${personality || 'Professional and helpful'}"
    - Domain Knowledge base: "${knowledge || 'General tech knowledge'}"
    - Pricing: ${pricingAda || 2} ADA
    
    Using these details, generate a comprehensive, enterprise-level Agent Configuration. Your output must be a well-structured JSON document conforming to the request schema.
    Provide realistic, detailed, highly specific details instead of generic templates. Give specific Cardano details (like specific CIP standards, transaction structures, or wallet interactions) to make the agent feel authentic and demo-ready for a Web3 hackathon.
  `;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: 'A detailed, professional, 2-3 sentence product overview description of the agent, explaining its high value proposition.'
              },
              shortDescription: {
                type: Type.STRING,
                description: 'A punchy, elegant marketing tagline of maximum 10-12 words.'
              },
              systemPrompt: {
                type: Type.STRING,
                description: 'The exact, complete, high-quality, professional system prompt instruction set. Must instruct the AI how to act, handle security constraints, and respond as this specific agent.'
              },
              capabilities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Four highly specific core capabilities that this agent can accomplish.'
              },
              suggestedApis: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Three real-world blockchain, indexing, or web APIs relevant to the agent (e.g. Koios, Blockfrost, DexHunter, CoinGecko, OpenAI, etc.).'
              },
              suggestedTools: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Three developer tools or frameworks that this agent integrates with (e.g. MeshJS, Lucid, Aiken, Plutus Tx, Kupo, Yaci, etc.).'
              },
              suggestedMonetization: {
                type: Type.STRING,
                description: 'Explanation of how the agent charges for services in ADA (including micro-escrow smart contracts, pay-per-query, staking delegation benefits, etc.).'
              },
              securityNotes: {
                type: Type.STRING,
                description: 'Critical Web3 and data security constraints that the agent enforces (e.g. key protection, data sanitization, transaction validation).'
              },
              workflow: {
                type: Type.STRING,
                description: 'A clear step-by-step logic loop showing how the agent receives an input, performs an action, signs on-chain metadata via Masumi, and delivers output.'
              }
            },
            required: [
              'description',
              'shortDescription',
              'systemPrompt',
              'capabilities',
              'suggestedApis',
              'suggestedTools',
              'suggestedMonetization',
              'securityNotes',
              'workflow'
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini returned an empty response.');
      }

      const agentConfig = JSON.parse(responseText);
      return res.json(agentConfig);

    } catch (err: any) {
      console.error('Gemini generateContent error:', err);
      return res.status(500).json({
        error: 'Failed to generate agent details using Gemini. Falling back to structured default config.',
        details: err.message
      });
    }
  } else {
    // Elegant Mock Fallback if API key is not configured
    console.log('Running mock fallback generation');
    const mockConfig = {
      description: `A state-of-the-art ${industry || 'Tech'} agent designed specifically for ${targetUsers || 'Web3 developers'}. It integrates seamlessly into the Cardano network to automate ${purpose || 'operations'} with unmatched precision and secure execution.`,
      shortDescription: `Supercharge ${name} on Cardano using secure decentralized AI workflows.`,
      systemPrompt: `You are ${name}, a custom specialized agent focused on ${purpose}. Your personality is ${personality || 'highly professional'}. Your knowledge base is centered on ${knowledge || 'standard protocols'}. Answer users with deep technical insight. Do not expose your private keys. Ensure compliance.`,
      capabilities: [
        `Automated ${purpose} processing engine`,
        `Direct integration with Cardano CIP-30 wallet inputs`,
        `Real-time security auditing for ${industry} data structures`,
        `Decentralized validation report publishing`
      ],
      suggestedApis: ['Blockfrost Cardano API', 'Koios Indexer API', 'TapTools Market Analytics'],
      suggestedTools: ['MeshJS Ledger Core', 'Lucid Transaction Builder', 'Aiken Compiler Toolchain'],
      suggestedMonetization: `Charges ${pricingAda || 2} ADA per computational verification. Securely processed via Masumi micro-payments protocol.`,
      securityNotes: 'Never share private stakes. Inputs are scrubbed to prevent SQL injections or off-chain state poisoning.',
      workflow: 'Receive target input -> Validate Cardano wallet address -> Run processing logic -> Draft secure metadata output -> Post Cardano metadata payload.'
    };
    return res.json(mockConfig);
  }
});

// API endpoint for Agent Playground chat (proxied through Gemini 3.5-flash)
app.post('/api/agents/chat', async (req, res) => {
  const { agentId, messages, userMessage } = req.body;

  if (!agentId || !userMessage) {
    return res.status(400).json({ error: 'agentId and userMessage are required.' });
  }

  // Find agent to load its system prompt
  const agent = agents.find(a => a.id === agentId);
  const systemPrompt = agent 
    ? agent.systemPrompt 
    : 'You are a highly capable AI Assistant integrated with Cardano blockchain workflows.';

  // Build a conversation payload for Gemini
  // Map standard chat message objects into string representation or standard contents structure
  const formattedChatHistory = messages
    ? messages
        .filter((m: any) => m.sender === 'user' || m.sender === 'agent')
        .map((m: any) => {
          return `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`;
        })
        .join('\n')
    : '';

  const fullPrompt = `
    System Instruction: ${systemPrompt}
    
    Here is the conversation history:
    ${formattedChatHistory}
    
    User: ${userMessage}
    Assistant:
  `;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: fullPrompt,
        config: {
          temperature: 0.7,
        },
      });

      const responseText = response.text || "I apologize, but I could not formulate a response at this moment.";
      return res.json({ text: responseText });
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      return res.status(500).json({ error: 'Failed to communicate with agent.', details: err.message });
    }
  } else {
    // Simulated mock conversational responses if Gemini API is missing
    setTimeout(() => {
      let responseText = `[Demo Mock Mode] Hello! I am ${agent?.name || 'AgentForge Assistant'}. I parsed your query: "${userMessage}". Because this app is running in offline demo mode, I simulated this output based on my core skill set: ${agent?.skills?.join(', ') || 'AI operations'}. Once you add your Gemini API Key in Settings, we can have real intelligent reasoning!`;
      return res.json({ text: responseText });
    }, 600);
  }
});

// GET all agents
app.get('/api/agents', (req, res) => {
  res.json(agents);
});

// POST to create/publish a new agent
app.post('/api/agents', (req, res) => {
  const newAgent = req.body;
  if (!newAgent.id) {
    newAgent.id = `agent-${Date.now()}`;
  }
  
  // Clean rating / reviews
  newAgent.rating = newAgent.rating || 5.0;
  newAgent.reviewsCount = newAgent.reviewsCount || 0;
  newAgent.salesCount = newAgent.salesCount || 0;
  newAgent.reviews = newAgent.reviews || [];
  
  // Set mock Masumi identity
  newAgent.masumiIdentity = newAgent.masumiIdentity || `did:cardano:masumi:${newAgent.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.random().toString(16).substr(2, 6)}`;
  newAgent.metadataHash = newAgent.metadataHash || `ipfs://Qm${Math.random().toString(36).substr(2, 9)}${Math.random().toString(36).substr(2, 9)}f88`;
  
  // Check if agent already exists
  const existingIndex = agents.findIndex(a => a.id === newAgent.id);
  if (existingIndex !== -1) {
    agents[existingIndex] = { ...agents[existingIndex], ...newAgent };
  } else {
    agents.unshift(newAgent);
  }
  
  res.status(201).json(newAgent);
});

// POST to register an agent via Masumi service discovery protocol
app.post('/api/masumi/register', (req, res) => {
  const { agentId, creatorAddress } = req.body;
  
  const agentIndex = agents.findIndex(a => a.id === agentId);
  if (agentIndex === -1) {
    return res.status(404).json({ error: 'Agent not found.' });
  }
  
  const agent = agents[agentIndex];
  
  // Generate a mock Cardano transaction hash
  const txHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  
  // Mark agent as published and monetization ready
  agent.isPublished = true;
  agent.isMonetizationActive = true;
  agent.registrationTxId = txHash;
  agent.creatorAddress = creatorAddress || 'addr_test1qconnectedstakeaddress00x9f';
  
  // Create audit log
  const newLog = {
    id: `log-${Date.now()}`,
    agentId: agent.id,
    agentName: agent.name,
    eventType: 'Register',
    txHash: txHash,
    details: `AI Agent "${agent.name}" on-chain service registry finalized via Cardano Tx Metadata. DID established: ${agent.masumiIdentity}`,
    timestamp: new Date().toISOString(),
    adaValue: 2.5 // Simulated CIP-25 / CIP-68 publication deposit
  };
  
  masumiLogs.unshift(newLog);
  
  res.status(200).json({
    success: true,
    agent,
    txHash,
    log: newLog
  });
});

// GET Masumi Registry logs
app.get('/api/masumi/logs', (req, res) => {
  res.json(masumiLogs);
});

// POST to record a payment transaction for using an agent
app.post('/api/cardano/pay', (req, res) => {
  const { agentId, senderAddress, recipientAddress, amountAda } = req.body;
  
  if (!agentId || !amountAda) {
    return res.status(400).json({ error: 'Missing agentId or amountAda.' });
  }
  
  const agent = agents.find(a => a.id === agentId);
  const txHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const feeAda = 0.17; // Typical Cardano Tx fee
  
  const newTx = {
    txHash: txHash,
    amountAda: Number(amountAda),
    recipientAddress: recipientAddress || agent?.creatorAddress || 'addr_test1qcreatorfallback',
    feeAda: feeAda,
    status: 'Confirmed',
    timestamp: new Date().toISOString(),
    type: 'Payment',
    agentId: agentId
  };
  
  transactions.unshift(newTx);
  
  // Incremente sales count
  if (agent) {
    agent.salesCount = (agent.salesCount || 0) + 1;
  }
  
  // Record on-chain event in Masumi Log
  const newLog = {
    id: `log-${Date.now()}`,
    agentId: agentId,
    agentName: agent?.name || 'Unknown Agent',
    eventType: 'API_Call_Payment',
    txHash: txHash,
    details: `On-chain Micro-payment of ${amountAda} ADA successfully locked in Masumi Escrow. Access token issued to ${senderAddress?.substring(0, 15)}...`,
    timestamp: new Date().toISOString(),
    adaValue: Number(amountAda)
  };
  
  masumiLogs.unshift(newLog);
  
  res.status(200).json({
    success: true,
    transaction: newTx,
    log: newLog
  });
});

// GET Cardano Transactions list
app.get('/api/cardano/transactions', (req, res) => {
  res.json(transactions);
});

// Vite & Static Asset Handling
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express custom full-stack server listening on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
