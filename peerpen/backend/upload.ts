import axios from 'axios';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));

async function storeBlob(content: Buffer, userId: string): Promise<string> {
  try {
    console.log("sending put request");
    const response = await axios.put(
      `https://walrus-publisher-testnet.staking4all.org/v1/blobs`,
      content,
      { headers: { 'Content-Type': 'application/octet-stream' } }
    );
    
    console.log("Walrus response:", response.data);
    
    const  blobId  = response.data.newlyCreated.blobObject.blobId;
    console.log(blobId);
    if (!blobId) throw new Error("No blobId returned from Walrus");
    // Store blob ID
    const blobIds = fs.existsSync('blob-ids.json') ? JSON.parse(fs.readFileSync('blob-ids.json', 'utf8')) : [];
    blobIds.push({ userId, blobId, timestamp: new Date().toISOString() });
    fs.writeFileSync('blob-ids.json', JSON.stringify(blobIds, null, 2));
    console.log("written to file blobId");
    return blobId;
  } catch (error: any) {
    console.log(error.message);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

app.post('/api/upload', async (req, res) => {
  try {
    const userId = req.query.userId as string || 'anonymous';
    console.log(userId);
    console.log("calling storeblob function");
    const blobId = await storeBlob(req.body, userId);
    res.json({ blobId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.listen(3003, () => console.log(`Upload service running on port ${process.env.PORT || 3003}`));