import { Client, PrivateKey, AccountId } from '@hashgraph/sdk';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import {ChatOllama} from '@langchain/ollama';
import { HederaLangchainToolkit, coreConsensusPlugin, coreQueriesPlugin } from 'hedera-agent-kit';
import axios from 'axios';
import fs from 'fs';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const client = Client.forTestnet();
client.setOperator(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!), PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!));
const llm = new ChatOllama({ 
  model: 'llama3.2',
  baseUrl: 'http://localhost:11434'
});
const hederaAgentToolkit = new HederaLangchainToolkit({ client, configuration: { plugins: [coreConsensusPlugin] } });
const app = express();
app.use(cors());
app.use(express.json());

async function checkDocument(blobId: string, userId: string): Promise<{ content: string }> {
  console.log('Blob ID:', blobId);
  const response = await axios.get(`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`, { responseType: 'arraybuffer' });
  const content = new TextDecoder().decode(response.data);
  console.log(content);

  //const content = "create a hedera topic"

const prompt = ChatPromptTemplate.fromMessages([
   ['system', 'Generate a summary 2-3 lines, check for plagiarism, and detect malicious content for the input content.'],
  ['placeholder', '{chat_history}'],
  ['human', '{input}'],
  ['placeholder', '{agent_scratchpad}'],
]);
const tools = hederaAgentToolkit.getTools();
const agent = await createToolCallingAgent({ llm, tools, prompt });
const agentExecutor = new AgentExecutor({ agent, tools })

const result = await agentExecutor.invoke({ input: content });
const output = result.output;
console.log('Agent output:', output);

const blobIds = fs.existsSync('blob-ids.json') ? JSON.parse(fs.readFileSync('blob-ids.json', 'utf8')) : [];
const entry = blobIds.find((item: any) => item.blobId === blobId && item.userId === userId);
if (entry) {
  entry.content = output;
  fs.writeFileSync('blob-ids.json', JSON.stringify(blobIds, null, 2));
}

return { content: output };
}

app.post('/api/check', async (req: Request, res: Response) => {
  const { blobId, userId } = req.body;
  if (!userId || !/^0x[a-fA-F0-9]{40}$/.test(userId)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }
  const blobIds = fs.existsSync('blob-ids.json') ? JSON.parse(fs.readFileSync('blob-ids.json', 'utf8')) : [];
  const userChecks = blobIds.filter((item: any) => item.userId === userId).length;
  const isSubscribed = blobIds.some((item: any) => item.userId === userId && item.subscribed);

  // console.log(userChecks);
  // if (userChecks >= 2 && !isSubscribed) {
  //   return res.status(403).json({ error: 'Free trial limit reached. Please subscribe.' });
  // }

  try {
    const result = await checkDocument(blobId, userId);
    res.json(result);
    console.log(res);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Check failed' });
  }
});

app.get('/api/check-count', (req: Request, res: Response) => {
  const userId = req.query.userId as string || 'anonymous';
  const blobIds = fs.existsSync('blob-ids.json') ? JSON.parse(fs.readFileSync('blob-ids.json', 'utf8')) : [];
  const count = blobIds.filter((item: any) => item.userId === userId).length;
  console.log(count);
  res.json({ count });
});

app.listen(3001, () => console.log(`Agent running on port ${process.env.PORT || 3001}`));