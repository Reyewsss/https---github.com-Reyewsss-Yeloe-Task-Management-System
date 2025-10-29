using System.Security.Cryptography;
using System.Text;

namespace task_management_system.Services
{
    public interface IEncryptionService
    {
        string Encrypt(string plainText);
        string Decrypt(string cipherText);
    }

    public class EncryptionService : IEncryptionService
    {
        private readonly byte[] _key;
        private readonly byte[] _iv;

        public EncryptionService(IConfiguration configuration)
        {
            // Get encryption key from configuration
            var encryptionKey = configuration["Encryption:Key"];
            var encryptionIV = configuration["Encryption:IV"];

            if (string.IsNullOrEmpty(encryptionKey) || string.IsNullOrEmpty(encryptionIV))
            {
                throw new InvalidOperationException("Encryption key and IV must be configured in appsettings.json");
            }

            _key = Convert.FromBase64String(encryptionKey);
            _iv = Convert.FromBase64String(encryptionIV);

            // Validate key and IV sizes for AES-256
            if (_key.Length != 32) // 256 bits
            {
                throw new InvalidOperationException("Encryption key must be 256 bits (32 bytes)");
            }

            if (_iv.Length != 16) // 128 bits
            {
                throw new InvalidOperationException("Encryption IV must be 128 bits (16 bytes)");
            }
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText))
            {
                return plainText;
            }

            try
            {
                using (Aes aes = Aes.Create())
                {
                    aes.Key = _key;
                    aes.IV = _iv;
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;

                    ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

                    using (MemoryStream msEncrypt = new MemoryStream())
                    {
                        using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                        {
                            using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
                            {
                                swEncrypt.Write(plainText);
                            }
                            return Convert.ToBase64String(msEncrypt.ToArray());
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Error encrypting data", ex);
            }
        }

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText))
            {
                return cipherText;
            }

            try
            {
                byte[] buffer = Convert.FromBase64String(cipherText);

                using (Aes aes = Aes.Create())
                {
                    aes.Key = _key;
                    aes.IV = _iv;
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;

                    ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

                    using (MemoryStream msDecrypt = new MemoryStream(buffer))
                    {
                        using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
                        {
                            using (StreamReader srDecrypt = new StreamReader(csDecrypt))
                            {
                                return srDecrypt.ReadToEnd();
                            }
                        }
                    }
                }
            }
            catch (FormatException)
            {
                // If it's not valid Base64, assume it's legacy unencrypted data
                // Return as-is for backward compatibility
                return cipherText;
            }
            catch (CryptographicException)
            {
                // If decryption fails, assume it's legacy unencrypted data
                // Return as-is for backward compatibility
                return cipherText;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Error decrypting data", ex);
            }
        }
    }
}
