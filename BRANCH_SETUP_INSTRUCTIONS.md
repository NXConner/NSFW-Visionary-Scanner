# NSFW-Visionary-Scanner Branch Setup Instructions

## Quick Setup

I've created a PowerShell script to automate the branch setup. Run this in PowerShell:

```powershell
cd C:\Users\n8ter\Desktop\visionary-scanner-suite-visionary-scanner-NSFW
.\setup-nsfw-branch.ps1
```

## Manual Setup (Alternative)

If you prefer to set it up manually, follow these steps:

### 1. Initialize Git (if not already)
```powershell
cd C:\Users\n8ter\Desktop\visionary-scanner-suite-visionary-scanner-NSFW
git init
```

### 2. Configure Git User
```powershell
git config user.email "n8ter8@gmail.com"
git config user.name "NXConner"
```

### 3. Add Remote Repository
```powershell
git remote add origin https://github.com/NXConner/visionary-scanner-suite.git
```

### 4. Fetch Remote Branches
```powershell
git fetch origin
```

### 5. Stage All Files
```powershell
git add -A
```

### 6. Create Initial Commit
```powershell
git commit -m "Initial commit: Complete NSFW Visionary Scanner codebase"
```

### 7. Create and Push Branch
```powershell
git checkout -b NSFW-Visionary-Scanner
git push -u origin NSFW-Visionary-Scanner
```

## After Setup

Once the branch is created and pushed:

### Your workspace will automatically track the remote branch
- Any changes you make will be tracked locally
- You can push changes with: `git push`
- You can pull changes with: `git pull`

### Daily Workflow

1. **Make changes** to files in Cursor
2. **Stage changes**: `git add .` or `git add <specific-file>`
3. **Commit changes**: `git commit -m "Description of changes"`
4. **Push to remote**: `git push`

### Auto-Sync Setup (Optional)

For automatic syncing, you can set up a git hook or use Cursor's built-in git integration:

1. Cursor will show you uncommitted changes in the source control panel
2. You can commit and push directly from Cursor's UI
3. Or use the terminal commands above

## Verify Setup

Check that everything is set up correctly:

```powershell
# Check current branch
git branch

# Check remote tracking
git branch -vv

# Check remote connection
git remote -v
```

You should see:
- Current branch: `NSFW-Visionary-Scanner`
- Tracking: `origin/NSFW-Visionary-Scanner`
- Remote: `origin -> https://github.com/NXConner/visionary-scanner-suite.git`

## Troubleshooting

### Authentication Issues
If you get authentication errors when pushing:
1. Use GitHub Personal Access Token (recommended)
2. Or set up SSH keys
3. Or use GitHub CLI: `gh auth login`

### Branch Already Exists
If the branch already exists on GitHub:
```powershell
git checkout -b NSFW-Visionary-Scanner
git push -u origin NSFW-Visionary-Scanner --force
```
⚠️ Use `--force` only if you're sure you want to overwrite the remote branch.

### Merge Conflicts
If you need to merge with existing remote branch:
```powershell
git fetch origin
git merge origin/NSFW-Visionary-Scanner
# Resolve conflicts if any
git push
```

---

**Note**: The script `setup-nsfw-branch.ps1` will handle all of this automatically. Just run it!

