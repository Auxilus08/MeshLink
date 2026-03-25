import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
// 32-byte key is required for aes-256
const MESH_DEFAULT_KEY = crypto.scryptSync('default_mesh_password', 'salt', 32);

export class CryptoService {
  private key: Buffer;

  constructor(sharedPassword?: string) {
    this.key = sharedPassword 
      ? crypto.scryptSync(sharedPassword, 'salt', 32)
      : MESH_DEFAULT_KEY;
  }

  public encrypt(data: string | any): { iv: string; content: string; authTag: string } {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      content: encrypted,
      authTag: authTag.toString('hex'),
    };
  }

  public decrypt(encryptedData: { iv: string; content: string; authTag: string }): any {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, Buffer.from(encryptedData.iv, 'hex'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (e) {
      console.error('Decryption failed', e);
      return null;
    }
  }
}
