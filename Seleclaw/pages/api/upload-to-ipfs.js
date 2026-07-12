import formidable from 'formidable';
import fs from 'fs';
import crypto from 'crypto';
import axios from 'axios';

// Disable bodyParser for Next.js to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Real Pinata IPFS Upload using Axios
const uploadToPinata = async (fileBuffer, fileName) => {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error('PINATA_JWT environment variable is missing.');
  }

  // Build FormData using native node/browser components
  const formData = new FormData();
  const fileBlob = new Blob([fileBuffer]);
  formData.append('file', fileBlob, fileName);

  const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
    },
  });

  return {
    cid: response.data.IpfsHash,
    size: response.data.PinSize,
    path: fileName
  };
};

// Mock IPFS upload fallback for local testing
const mockIPFSUpload = async (fileData, fileName) => {
  const hash = crypto.createHash('sha256').update(fileData).digest('hex');
  const mockCID = `Qm${hash.substring(0, 44)}`;
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    cid: mockCID,
    size: fileData.length,
    path: fileName
  };
};

// Encrypt data (XOR encryption)
const encryptData = (data, key = 'demo-encryption-key') => {
  const encrypted = Buffer.alloc(data.length);
  const keyBuffer = Buffer.from(key);
  
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ keyBuffer[i % keyBuffer.length];
  }
  
  return encrypted;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: './tmp',
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB limit
    });

    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    const metadata = fields.metadata?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Processing file upload:', file.originalFilename);

    // Read file data
    const fileData = fs.readFileSync(file.filepath);
    
    // Encrypt the file data
    const encryptedData = encryptData(fileData);
    
    // Parse metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = JSON.parse(metadata || '{}');
    } catch (error) {
      console.log('Invalid metadata JSON, using empty object');
    }

    const fileMetadata = {
      ...parsedMetadata,
      originalName: file.originalFilename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      encrypted: true,
      encryptionMethod: 'XOR',
      ipfsVersion: '1.0'
    };

    let fileResult;
    let metadataResult;
    let directoryHash;
    const isLivePinata = !!process.env.PINATA_JWT;

    if (isLivePinata) {
      console.log('Pinata JWT detected. Commencing live IPFS upload to Pinata...');
      fileResult = await uploadToPinata(encryptedData, `encrypted_${file.originalFilename}`);
      
      const metadataContent = JSON.stringify(fileMetadata, null, 2);
      metadataResult = await uploadToPinata(Buffer.from(metadataContent), 'metadata.json');

      const directoryContent = JSON.stringify({
        file: fileResult.cid,
        metadata: metadataResult.cid,
        timestamp: new Date().toISOString()
      });
      directoryHash = await uploadToPinata(Buffer.from(directoryContent), 'directory.json');
    } else {
      console.log('No Pinata config. Falling back to mock IPFS upload...');
      fileResult = await mockIPFSUpload(encryptedData, `encrypted_${file.originalFilename}`);
      
      const metadataContent = JSON.stringify(fileMetadata, null, 2);
      metadataResult = await mockIPFSUpload(Buffer.from(metadataContent), 'metadata.json');

      const directoryContent = JSON.stringify({
        file: fileResult.cid,
        metadata: metadataResult.cid,
        timestamp: new Date().toISOString()
      });
      directoryHash = await mockIPFSUpload(Buffer.from(directoryContent), 'directory.json');
    }

    console.log('IPFS Upload successful:', directoryHash.cid);

    // Clean up temporary file
    try {
      fs.unlinkSync(file.filepath);
    } catch (error) {
      console.log('Failed to clean up temp file:', error.message);
    }

    res.status(200).json({
      success: true,
      ipfsHash: directoryHash.cid,
      fileHash: fileResult.cid,
      metadataHash: metadataResult.cid,
      metadata: fileMetadata,
      message: isLivePinata ? 'File uploaded successfully to Pinata IPFS' : 'File uploaded successfully to IPFS (mock)'
    });
    
  } catch (error) {
    console.error('IPFS upload error:', error);
    
    // Clean up any temporary files
    try {
      const form = formidable();
      const [, files] = await form.parse(req);
      const file = files.file?.[0];
      if (file?.filepath) {
        fs.unlinkSync(file.filepath);
      }
    } catch (cleanupError) {
      console.log('Cleanup error:', cleanupError.message);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload to IPFS',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
