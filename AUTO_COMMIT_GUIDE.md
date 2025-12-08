# Auto-Commit Guide

## Quick Start

### Option 1: Simple Auto-Commit (Recommended)
Double-click or run:
```powershell
.\start-auto-commit.bat
```

Or directly:
```powershell
.\auto-commit-simple.ps1
```

This will:
- Watch for file changes every 30 seconds
- Automatically commit changes
- Automatically push to GitHub
- Run in foreground (you'll see all activity)

**Press Ctrl+C to stop**

---

### Option 2: Advanced Auto-Commit (Background)
```powershell
# Start in background
.\auto-commit.ps1 -Start

# Check status
Get-Job

# Stop
.\auto-commit.ps1 -Stop
```

---

## How It Works

1. **Watches your project folder** for any file changes
2. **Checks every 30 seconds** for modifications
3. **Stages all changes** automatically (`git add -A`)
4. **Creates a commit** with a message listing changed files
5. **Pushes to GitHub** automatically (`git push`)

## Configuration

### Change Check Interval
Edit `auto-commit-simple.ps1` and change:
```powershell
$checkInterval = 30  # Change to desired seconds (e.g., 60 for 1 minute)
```

### Custom Commit Message
Edit the commit message format in the script:
```powershell
$commitMsg = "Auto-commit: $fileList"  # Customize this
```

## What Gets Committed

- ✅ All modified files
- ✅ All new files
- ✅ All deleted files
- ❌ Files in `.gitignore` (ignored)

## Logs

The simple script shows output in the console.  
The advanced script logs to `.auto-commit.log`

## Troubleshooting

### "Git not initialized"
Run the setup script first:
```powershell
.\setup-nsfw-branch.ps1
```

### "Push failed" / Authentication errors
You need to authenticate with GitHub:
1. Use Personal Access Token
2. Or set up SSH keys
3. Or use GitHub CLI: `gh auth login`

### "Not on NSFW-Visionary-Scanner branch"
The script will try to switch automatically, or you can manually:
```powershell
git checkout NSFW-Visionary-Scanner
```

### Script won't stop
Press `Ctrl+C` multiple times, or close the terminal window.

## Best Practices

1. **Review before committing**: The auto-commit is convenient but doesn't review code
2. **Use meaningful manual commits** for important changes
3. **Keep auto-commit running** for quick saves and backups
4. **Stop auto-commit** when making large refactoring changes

## Integration with Cursor

The auto-commit script works alongside Cursor:
- Cursor tracks changes in Source Control panel
- Auto-commit script commits and pushes automatically
- You can still use Cursor's git features manually

## Example Output

```
=== Auto-Commit Watcher Started ===
Watching: C:\Users\n8ter\Desktop\visionary-scanner-suite-visionary-scanner-NSFW
Press Ctrl+C to stop

[14:23:15] Detected 3 file(s) changed
  Committing changes...
  ✓ Committed
  Pushing to remote...
  ✓ Pushed to GitHub

[14:25:42] Detected 1 file(s) changed
  Committing changes...
  ✓ Committed
  Pushing to remote...
  ✓ Pushed to GitHub
```

---

**Note**: Auto-commit is great for keeping your work backed up, but remember to make meaningful commit messages for important milestones!

