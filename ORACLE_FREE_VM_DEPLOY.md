# Oracle Always Free VM Deployment (Discord Bot)

This guide deploys your bot on an Oracle Cloud Always Free Ubuntu VM so it stays online when your PC is off.

## 1) Create Oracle Free VM

1. Create/sign in to Oracle Cloud free account.
2. Go to **Compute > Instances > Create instance**.
3. Name: `atm-vm`
4. Image: **Ubuntu 22.04** (or latest Ubuntu)
5. Shape: **VM.Standard.E2.1.Micro** (Always Free)
6. Networking:
   - Keep public IPv4 enabled.
   - Allow SSH (port 22).
7. Add your SSH key pair (download private key if generating new).
8. Create instance.

## 2) Connect to VM from Windows

Use PowerShell (replace placeholders):

```powershell
ssh -i "C:\path\to\oracle-key.pem" ubuntu@YOUR_VM_PUBLIC_IP
```

If key permission errors happen, move key to your user folder and keep path simple.

## 3) Push this project to GitHub

From your local project folder:

```powershell
git init
git add .
git commit -m "initial bot"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

## 4) Run one-command VM setup

Inside the VM:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/deploy/oracle-vm-setup.sh -o setup.sh
chmod +x setup.sh
./setup.sh https://github.com/YOUR_USER/YOUR_REPO.git /opt/atm
```

## 5) Add bot token and start

```bash
cd /opt/atm
nano .env
```

Set:

```env
DISCORD_TOKEN=your_real_token_here
```

Start and verify:

```bash
npm run bot:online
npm run bot:status
npm run bot:logs
```

## 6) Make it survive reboot

Run this on VM after bot is online:

```bash
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

It will print another command. Copy-paste and run that command.

Then reboot test:

```bash
sudo reboot
```

Reconnect and check:

```bash
npx pm2 list
```

You should see `atm` as `online`.

## 7) Update bot later

After pushing new code to GitHub, on VM run:

```bash
chmod +x /opt/atm/deploy/oracle-vm-update.sh
/opt/atm/deploy/oracle-vm-update.sh /opt/atm
```

## Notes

- Keep your `.env` secret; never commit your real token.
- Oracle free resources have limits; avoid creating extra paid resources.
- If the VM is stopped/deleted, bot goes offline.
