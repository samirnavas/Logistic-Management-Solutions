# Deploy Admin + Backend on One EC2

Run both the Next.js admin app and the Express backend on a single EC2 instance using PM2 and optional Nginx.

## 1. EC2 setup

- **OS**: Ubuntu 22.04 LTS (or similar).
- **Security group**: Allow **22** (SSH), **80** (HTTP), **443** (HTTPS). Do **not** open 3000/5000 to the internet if you use Nginx.
- **Node**: Install Node 18+ (e.g. via [nvm](https://github.com/nvm-sh/nvm)):
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  source ~/.bashrc
  nvm install 20
  nvm use 20
  node -v
  ```

## 2. Clone and install

```bash
cd /home/ubuntu
git clone <your-repo-url> logistic-management-solutions
cd logistic-management-solutions
npm install
```

## 3. Environment variables

**Backend** – `apps/backend/.env`:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/logistics
# Or Atlas: mongodb+srv://user:pass@cluster.mongodb.net/logistics
JWT_SECRET=your-secure-random-secret
# Add any other keys (Cloudinary, etc.)
```

**Admin** – `apps/admin/.env.production` (or `.env.local`):

```env
NODE_ENV=production
BACKEND_URL=http://127.0.0.1:5000
# If warehouses page is used; when behind Nginx with same domain, use same origin:
NEXT_PUBLIC_API_URL=
# Or set to your public URL, e.g. https://your-domain.com
```

## 4. Build admin

```bash
cd /home/ubuntu/logistic-management-solutions
npm run build --workspace=@apps/admin
```

## 5. Run with PM2

Install PM2 and start both apps:

```bash
npm install -g pm2
cd /home/ubuntu/logistic-management-solutions
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Commands:

- `pm2 status` – list processes  
- `pm2 logs` – all logs  
- `pm2 logs backend` / `pm2 logs admin` – per app  
- `pm2 restart all` – restart both  

Backend runs on **5000**, admin on **3000** (internal).

## 6. (Recommended) Put Nginx in front

One domain/port: Nginx proxies `/api` to the backend and everything else to the admin.

```bash
sudo apt update && sudo apt install -y nginx
sudo cp /home/ubuntu/logistic-management-solutions/deploy/nginx.conf.example /etc/nginx/sites-available/logistics
sudo sed -i 's/YOUR_DOMAIN_OR_IP/your-ec2-public-ip-or-domain/g' /etc/nginx/sites-available/logistics
sudo ln -sf /etc/nginx/sites-available/logistics /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Then open **http://YOUR_DOMAIN_OR_IP** in the browser. The admin UI is at `/`, API at `/api/...`.

## 7. Without Nginx (quick test only)

- Backend: `http://EC2_PUBLIC_IP:5000`
- Admin: `http://EC2_PUBLIC_IP:3000`

Open security group ports **3000** and **5000**. In `apps/admin/.env.production` set:

- `BACKEND_URL=http://127.0.0.1:5000`
- `NEXT_PUBLIC_API_URL=http://EC2_PUBLIC_IP:5000`  
  so the browser can call the API. Prefer Nginx for production so you don’t expose both ports.

## 8. Summary

| Component | Port (internal) | With Nginx |
|----------|-------------------|------------|
| Backend | 5000              | `https://your-domain/api/*` |
| Admin   | 3000              | `https://your-domain/`      |

- **BACKEND_URL**: used by the Next.js server to proxy `/api` to the backend (use `http://127.0.0.1:5000` on EC2).
- **NEXT_PUBLIC_API_URL**: used by the warehouses page in the browser; leave empty when using Nginx and same domain so `/api/...` is same-origin.
