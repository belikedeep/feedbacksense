# Deployment Setup Guide

## On Your EC2 Server

1. Create a deployment SSH key:

```bash
cd ~/.ssh
ssh-keygen -t ed25519 -C "github-actions-deploy"
# Save it as 'github-actions-deploy' when prompted
# Leave passphrase empty for automated deployments
```

2. Add the public key to authorized_keys:

```bash
cat github-actions-deploy.pub >> ~/.ssh/authorized_keys
```

3. Set up Git on server:

```bash
cd ~/feedbacksense
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## On GitHub Repository

1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add these secrets:
   - Name: `SSH_PRIVATE_KEY`
   - Value: Copy the contents of `/home/ubuntu/.ssh/github-actions-deploy` file

## Testing the Setup

1. Make sure your repository is up to date:

```bash
cd ~/feedbacksense
git remote -v  # Verify remote is set correctly
git pull
```

2. Try pushing a small change to main branch and watch the GitHub Actions tab for the deployment progress.

## Common Issues

- If deployment fails, check:
  - SSH key is correctly added to GitHub secrets
  - The EC2 security group allows SSH access
  - The permissions on your project directory are correct
