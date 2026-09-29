# 🚀 Phase 1 — AWS Infrastructure Setup (Step-by-Step)

> Follow these steps in exact order on the **AWS Console** (https://console.aws.amazon.com).
> Estimated time: **30–45 minutes** (mostly waiting for the DocumentDB cluster to start).

---

## Prerequisites

- An AWS account with console access
- Region: **US East (N. Virginia) `us-east-1`** (cheapest for DocumentDB)

---

## Step 1: Verify your VPC (2 min)

1. Go to **VPC** → **Your VPCs**
2. You should see a **default VPC** — note its **VPC ID** (e.g., `vpc-0abc123...`)
3. Go to **VPC** → **Subnets** — confirm you have at least **2 subnets** in **different Availability Zones** (e.g., `us-east-1a` and `us-east-1b`)

> ✅ If your default VPC has 2+ subnets, you're good. Skip to Step 2.

---

## Step 2: Create a Security Group (3 min)

1. Go to **EC2** → **Security Groups** → **Create Security Group**
2. Fill in:
   - **Name:** `docdb-app-sg`
   - **Description:** `Security group for DocumentDB and App Server`
   - **VPC:** Select your default VPC
3. Add **Inbound Rules:**

   | Type        | Port  | Source                        | Why                     |
   |-------------|-------|-------------------------------|-------------------------|
   | Custom TCP  | 27017 | Select "Self" (this same SG)  | DocumentDB access       |
   | Custom TCP  | 5000  | 0.0.0.0/0 (Anywhere IPv4)    | Node.js backend         |
   | SSH         | 22    | 0.0.0.0/0 (Anywhere IPv4)    | SSH into EC2            |

4. Leave **Outbound Rules** as default (allow all)
5. Click **Create Security Group**
6. **Save the Security Group ID** — you'll use it in the next two steps

---

## Step 3: Create a DocumentDB Subnet Group (2 min)

1. Go to **Amazon DocumentDB** → **Subnet Groups** → **Create**
2. Fill in:
   - **Name:** `docdb-subnet-group`
   - **Description:** `Subnet group for inspection-app DocumentDB`
   - **VPC:** Select your default VPC
   - **Add Subnets:** Pick at least **2 subnets** from different AZs
3. Click **Create**

---

## Step 4: Create the DocumentDB Cluster (5 min + 10 min wait)

> ⚠️ This is the most important step. Get every setting right.

1. Go to **Amazon DocumentDB** → **Clusters** → **Create**
2. Fill in these settings **exactly**:

   | Setting                | Value                              |
   |------------------------|------------------------------------|
   | Cluster type           | **Instance Based Cluster**         |
   | Engine version         | **5.0** (latest)                   |
   | Cluster identifier     | `inspection-docdb-cluster`         |
   | Master username        | `docdbadmin`                       |
   | Master password        | Choose something strong — **SAVE IT!** |
   | Instance class         | `db.t3.medium` (cheapest)          |
   | Number of instances    | **1** (single instance to save cost) |

3. Under **Connectivity**:
   - **VPC:** Your default VPC
   - **Subnet group:** `docdb-subnet-group`
   - **VPC Security group:** `docdb-app-sg`

4. Under **Advanced settings**:
   - ❌ Turn **OFF** deletion protection
   - ❌ Turn **OFF** CloudWatch Logs exports

5. Click **Create Cluster**
6. ⏳ **Wait 5–10 minutes** until the cluster status changes to **"Available"**
7. Once available, click the cluster name → **Connectivity & security** tab
8. **Copy the Cluster Endpoint** — it looks like:
   ```
   inspection-docdb-cluster.cluster-xxxxxxxxxxxx.us-east-1.docdb.amazonaws.com
   ```

---

## Step 5: Launch an EC2 Instance (5 min)

1. Go to **EC2** → **Launch Instance**
2. Fill in:

   | Setting              | Value                        |
   |----------------------|------------------------------|
   | Name                 | `docdb-app-server`           |
   | AMI                  | **Amazon Linux 2023**        |
   | Instance type        | `t2.micro` (Free Tier)       |
   | Key pair             | Create new → download `.pem` |
   | VPC                  | **Same VPC** as DocumentDB   |
   | Subnet               | Any public subnet            |
   | Auto-assign Public IP| **Enable**                   |
   | Security group       | Select **existing** → `docdb-app-sg` |

3. Click **Launch Instance**
4. Wait for status to become **Running**
5. **Note the Public IPv4 address** (e.g., `3.92.xxx.xxx`)

---

## Step 6: SSH into EC2 & Install Node.js (5 min)

Open your terminal (PowerShell/CMD/Git Bash):

```bash
# Make your key file secure (required on Linux/Mac)
chmod 400 your-key.pem

# SSH into the EC2 instance
ssh -i your-key.pem ec2-user@<EC2-PUBLIC-IP>
```

Once logged in, run these commands:

```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify
node --version    # Should show v18.x.x
npm --version

# Install Git
sudo yum install -y git

# Download the DocumentDB TLS certificate
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

---

## Step 7: Test the DocumentDB Connection (3 min)

Still on the EC2 instance:

```bash
# Install MongoDB Shell
cat <<'EOF' | sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc
EOF

sudo yum install -y mongodb-mongosh

# Connect to DocumentDB (replace <PASSWORD> and <CLUSTER-ENDPOINT>)
mongosh "mongodb://docdbadmin:<PASSWORD>@<CLUSTER-ENDPOINT>:27017/?tls=true&tlsCAFile=global-bundle.pem&retryWrites=false&directConnection=true"
```

If connection succeeds, you'll see the `mongosh>` prompt. Type:
```
show dbs
exit
```

---

## Step 8: Deploy Your App to EC2 (5 min)

Still on the EC2 instance:

```bash
# Clone your repository
git clone https://github.com/Sharvan-Deep/aws_documentDB.git
cd aws_documentDB/inspection-app

# Copy the TLS certificate into the backend folder
cp ~/global-bundle.pem backend/

# Configure environment variables
cd backend
cat > .env << 'EOF'
PORT=5000
DB_HOST=<YOUR-CLUSTER-ENDPOINT>
DB_PORT=27017
DB_USER=docdbadmin
DB_PASS=<YOUR-PASSWORD>
DB_NAME=inspectiondb
EOF

# Install backend dependencies
npm install

# Seed the database with sample data
npm run seed

# Start the backend
npm run dev
```

Open a **second SSH session** (or use `screen`/`tmux`):

```bash
cd ~/aws_documentDB/inspection-app/frontend
npm install
npm run build

# Serve the built frontend (or use a simple static server)
npx serve dist -l 3000
```

---

## Step 9: Access Your App 🎉

Open your browser and go to:
```
http://<EC2-PUBLIC-IP>:5000    → Backend API
http://<EC2-PUBLIC-IP>:3000    → Frontend UI
```

---

## 💰 Cost Awareness

| Resource            | Cost              | How to Save              |
|---------------------|-------------------|--------------------------|
| DocumentDB (db.t3.medium) | ~$0.076/hr (~$1.82/day) | **Stop cluster** when not using |
| EC2 (t2.micro)      | Free Tier eligible | Stop instance when done  |

> ⚠️ **After your hackathon demo:** Delete the DocumentDB cluster and terminate the EC2 instance to stop all charges immediately.

---

## ✅ Phase 1 Completion Checklist

- [ ] Default VPC confirmed with 2+ subnets
- [ ] Security Group `docdb-app-sg` created (ports 27017, 5000, 22)
- [ ] DocumentDB Subnet Group created
- [ ] DocumentDB cluster created → status = **Available**
- [ ] EC2 instance launched in the same VPC → status = **Running**
- [ ] Node.js 18 installed on EC2
- [ ] `global-bundle.pem` downloaded on EC2
- [ ] Successfully connected to DocumentDB via `mongosh`
- [ ] App cloned, configured, seeded, and running on EC2
