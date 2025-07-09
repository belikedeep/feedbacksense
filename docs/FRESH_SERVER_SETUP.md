# Fresh Server Setup Guide

## 1. Generate Deploy Key on New Server

```bash
# Connect to your new EC2 instance
ssh -i your-ec2-key.pem ubuntu@your-new-ec2-ip

# Generate deploy key
mkdir -p ~/.ssh
cd ~/.ssh
ssh-keygen -t ed25519 -f github-deploy-key -C "github-actions-deploy"
# (press Enter for empty passphrase)

# Show the public key to add to GitHub
cat github-deploy-key.pub
```

## 2. Add Deploy Key to GitHub Repository

1. Go to your repository on GitHub
2. Go to Settings → Deploy keys
3. Click "Add deploy key"
4. Title: EC2 Deploy Key
5. Key: (paste the public key from above)
6. Check "Allow write access"
7. Click "Add key"

## 3. Setup Node.js Environment

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js
nvm install 18
nvm use 18

# Install PM2 globally
npm install -g pm2
```

## 4. Clone Private Repository

```bash
# Configure SSH for GitHub
cat >> ~/.ssh/config << EOL
Host github.com
  IdentityFile ~/.ssh/github-deploy-key
  StrictHostKeyChecking no
EOL

# Clone repository
cd ~
git clone git@github.com:belikedeep/feedbacksense.git
cd feedbacksense

# Install dependencies and build
npm install
npm run build

# Start the application
pm2 start npm --name "feedbacksense" -- start
```

## 5. Update GitHub Actions

1. Get the new server's IP address
2. Update the GitHub Actions workflow with the new IP
3. Update the SSH_PRIVATE_KEY secret in GitHub Actions with the new private key
