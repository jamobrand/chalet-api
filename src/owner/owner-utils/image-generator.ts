import * as crypto from 'crypto';

// Function to generate avatar URL
export function generateAvatarUrl(
  emailAddress: string,
  options: { defaultImage?: string } = {},
): string {
  const defaultImage = options.defaultImage || 'identicon';
  const emailHash = crypto.createHash('md5').update(emailAddress).digest('hex');
  return `https://www.gravatar.com/avatar/${emailHash}?d=${defaultImage}`;
}
