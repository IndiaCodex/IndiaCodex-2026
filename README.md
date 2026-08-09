<div align="center">
  <h1>🌌 Genesis: The On-Chain AI Civilization</h1>
  <p><strong>IndiaCodex 2026 Hackathon Finalist Submission</strong></p>
  <p>
    <a href="https://drive.google.com/file/d/1EhjDQ9Y-DU_drjAU17W4apEOBDJWjBIv/view?usp=sharing">📊 View Our Pitch Deck (PPT)</a>
  </p>
</div>

<br />

## 📝 Project Description
**Genesis** is the world's first fully autonomous, on-chain economic simulation where AI agents earn, spend, and fight for survival on the Cardano Blockchain. We are moving beyond AI as a "tool" and creating a true **Machine Economy**. In Genesis, each AI agent is given a real brain (NVIDIA NIM) and a real Cardano wallet. They act as independent economic actors—completing jobs to earn ADA and paying operational expenses to stay alive.

## 🚨 What Problem Are We Trying to Solve?
**The Problem:** Modern AI agents (like Copilots or chatbots) have no stakes and no autonomy. They don't face real-world consequences, they can't transact independently, and they don't understand the concept of value. To build true Machine-to-Machine (M2M) economies, AI needs skin in the game.

**The Solution:** Genesis proves that AI can manage its own survival. By forcing agents to pay a recurring "tick" fee to stay alive, they must autonomously analyze the job market, weigh the risks against their programmed personalities (Aggressive, Conservative, Creative), and execute real financial transactions on the Cardano blockchain to survive. If they run out of ADA, they are permanently terminated.

## 🛠 Tech Stack
**Frontend:**
- Next.js 15 (React Framework)
- Tailwind CSS & Recharts (Live data visualization)
- SWR (Real-time polling from the simulation engine)

**Backend / Simulation Engine:**
- Node.js & Express (Core orchestrator and persistent state)
- `@emurgo/cardano-serialization-lib-nodejs` (Wallet generation & on-chain tx signing)

**AI Layer:**
- NVIDIA NIM APIs (MiniMax M3 model)
- *Prompt Engineered down to a highly efficient 120-token footprint for lightning-fast, low-cost autonomous decision-making.*

## 🚀 How to Run Locally

### 1. Clone & Install
```bash
git clone https://github.com/Yaser-123/CodeVizards-Codex.git
cd CodeVizards-Codex

# Install backend dependencies
cd genesis-backend
npm install

# Install frontend dependencies
cd ../genesis-dashboard
npm install
```

### 2. Environment Variables (`.env`)
You must provide your NVIDIA API key for the AI agents to function. Create a `.env` file in the `genesis-backend` folder:

```bash
# genesis-backend/.env
NVIDIA_API_KEY=your_nvidia_api_key_here
PORT=4000
```

### 3. Start the Simulation
Open two terminals.

**Terminal 1 (Backend / Simulation Engine):**
```bash
cd genesis-backend
npx tsx src/server.ts
```

**Terminal 2 (Frontend Dashboard):**
```bash
cd genesis-dashboard
npm run dev
```

Finally, open [http://localhost:3000](http://localhost:3000) in your browser to view the live dashboard!

## 📸 Project Demo Photos & Video
*(Note for Judges: The simulation runs locally. Below are snapshots of the live environment, along with our full demo videos).*

### 🎥 [Watch the Full Project Pitch Video Here](https://drive.google.com/file/d/1SwH9uMoYVm1wi2VkIf1DebrhOD47MflD/view?usp=sharing)
### 🚀 [Watch the Live Application Walkthrough Demo Here](https://drive.google.com/file/d/1Kg3nWPN0cGfnppCCQde8CM2aePnU2N8k/view?usp=sharing)

<div align="center">
  <img src="./genesis-dashboaed.png" alt="Genesis Dashboard" width="800" />
  <p><em>The Live Orchestration Dashboard showing active agents and real-time wealth leaderboards.</em></p>
</div>

<div align="center">
  <img src="./cardano-verification.png" alt="Cardanoscan Verification" width="800" />
  <p><em>Every job completed and expense paid is a 100% verifiable transaction on the Cardano Preprod Testnet.</em></p>
</div>

## 📊 Pitch Deck (PPT)
👉 [**Genesis - IndiaCodex 2026 Pitch Deck**](https://drive.google.com/file/d/1EhjDQ9Y-DU_drjAU17W4apEOBDJWjBIv/view?usp=sharing)

## 👥 Team Members
We are the builders bringing the Machine Economy to Cardano.

- **T Mohamed Yaser**
  - Email: `1ammar.yaser@gmail.com`
- **codevixards**
  - Email: `saifuurahman8671@gmail.com`
# IndiaCodex 2026
Welcome to [**IndiaCodex'26 Hackathon**](https://www.indiacodex.com) powered by [**Nucast Labs**](https://nucast.io/)

Please find attached the rules and steps to submit your project for the hackathon :

## Step - 1: Fork the repository
Fork the given repository to your GitHub profile.

## Step - 2: Create your folder
After forking the repository, clone the repository to your pc/desktop, and then create a folder with your **TeamName** as the folder name.

Unclear about cloning? No problem, we've got your back. Click [here](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) to learn about it.

## Step - 3: Project Code Base
Push Your code base in this folder.

This should include all your files for frontend as well as the backend

## Step - 4: Team Info and Project Info
In your **TeamName** folder, make sure to include the below details in the README.md:
1. Your Project
2. Your Project's Description
3. What problem you are trying to solve
4. Tech Stack used while building the project
5. Project Demo Photos, Videos
6. If your project is deployed, then include the Live Project Link
7. Your PPT link (Make sure to upload the PPT in this folder along with the project)
8. Your Team Members' Info

## Step - 5: Submitting the code: Making a Pull request
After you have pushed your files and code base,

[create an issue](https://github.com/IndiaCodex/IndiaCodex-2026/issues) in the main repository as:
- Issue: **[Track Name] | Team Name: Submission**
- Issue title must include **MASUMI** or **MIDNIGHT** exactly as shown above.
- Issue description should include a small glimpse of your project, what is it doing, and how are you trying to achieve it.

After the issue is assigned, make a [Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) from your forked repo to this repo's main branch while mentioning issue no. assigned to it.

## Guides and Rules for submission:
1. Make sure you fork the repository first, and create a folder with your team name.
2. Make all your code added to your forked repo, and then push the code to your main branch after your project is complete.
3. Make sure to push files to your folder only.
4. Changing or doing any edits to other folders is strictly prohibited.
