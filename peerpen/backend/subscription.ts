import { ethers } from 'ethers';
import express from 'express';
import type { Request, Response } from 'express'; 
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_SEPOLIA_RPC!);
const pyusdContract = new ethers.Contract(
  process.env.PYUSD_ADDRESS!,
  ['event Transfer(address indexed from, address indexed to, uint256 value)'],
  provider
);

app.post('/api/subscribe', async (req: Request, res: Response) => {
  const { userId, txHash } = req.body;
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || !receipt.logs || receipt.logs.length === 0) {
      return res.status(400).json({ error: 'No logs found in transaction' });
    }

    // Iterate through logs to find the Transfer event
    let transferEvent = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = pyusdContract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'Transfer') {
          transferEvent = parsedLog;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!transferEvent) {
      return res.status(400).json({ error: 'No valid Transfer event found' });
    }

    if (
      transferEvent.args.to === process.env.OWNER_ADDRESS &&
      ethers.utils.formatUnits(transferEvent.args.value, 6) >= '1.0'
    ) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid payment' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Subscription verification failed' });
  }
});

app.listen(3002, () => console.log(`Backend running on port ${3002}`));