<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
<!--
*** Using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
<div align="center">

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

</div>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Premkumar1845/ProofPair">
    <img src="dist/favicon.ico" alt="Logo" width="80" height="80" style="border-radius: 50%;">
  </a>

  <h3 align="center">C402 Protocol Gateway</h3>

  <p align="center">
    A decentralized, pay-per-request HTTP 402 proxy billing gateway for Cardano microservices and AI inferences.
    <br />
    <a href="https://github.com/Premkumar1845/ProofPair"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="http://localhost:5174">View Demo</a>
    &middot;
    <a href="https://github.com/Premkumar1845/ProofPair/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/Premkumar1845/ProofPair/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#architecture">Architecture</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

---

<!-- ABOUT THE PROJECT -->
## About The Project

C402 is an HTTP 402 Payment Required middleware protocol designed to eliminate the monetization overhead of web services, APIs, and AI inferences.

In traditional API architectures, charging clients fractions of a cent per request is economically impossible — flat transaction fee minimums imposed by credit card processors ($0.30 + 2.9% per charge) make micro-billing unworkable. Developers are forced to build registration systems, databases, and monthly subscription tiers just to extract any revenue.

**C402 resolves this billing friction entirely:**

* **Zero Registration** — Clients interact with paid resources peer-to-peer using CIP-30 injected browser wallets (Lace / Eternl) without creating accounts or signing up.
* **Deterministic Micropayments** — Leverages Cardano's constant UTxO execution fees to permit sub-cent transactions (e.g. 0.1 ADA ≈ $0.04).
* **Double-Spend Protection** — Maintains an Express in-memory verification cache of spent transaction hashes to completely prevent replay attacks.
* **Mempool Auditing** — Intercepts transaction inputs in the Cardano node broadcast queue via Blockfrost to verify payments in under 900 ms.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

### Built With

* [![React][React.js]][React-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![Vite][Vite]][Vite-url]
* [![Node.js][NodeJS]][NodeJS-url]
* [![Express][Express]][Express-url]
* [![Axios][Axios]][Axios-url]
* [![Cardano][Cardano]][Cardano-url]
* [![Cerebras][Cerebras]][Cerebras-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- GETTING STARTED -->
## Getting Started

Follow these steps to configure and run the Vite React frontend portal and Express proxy backend gateway locally.

### Prerequisites

Ensure you have **Node.js v18+** and **npm** installed.

```sh
npm install npm@latest -g
```

You will also need:

* A [Blockfrost](https://blockfrost.io) project ID configured for the **Cardano preprod** testnet.
* A [Cerebras AI](https://cerebras.ai) API key for Llama-3.3-70b inference.
* A Cardano **preprod**-configured [Lace](https://www.lace.io) or [Eternl](https://eternl.io) browser wallet extension.

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Premkumar1845/ProofPair.git
   ```

2. Install frontend dependencies in the root directory:
   ```sh
   cd ProofPair
   npm install
   ```

3. Install backend dependencies:
   ```sh
   cd backend
   npm install
   ```

4. Create a `.env` configuration file inside `backend/`:
   ```env
   PORT=8080
   BLOCKFROST_KEY=your_blockfrost_preprod_project_id
   PAYOUT_ADDRESS=addr_test1qrf9x2y4u9asqpwldjge937cnu2c7d9bc029ac1bf58cd
   CEREBRAS_KEY=your_cerebras_api_key
   ```

   > **Security Note:** Never commit `.env` to version control. The `.gitignore` excludes it by default.

5. Start both servers:

   **Backend** — Express gateway (from `backend/`):
   ```sh
   npm run start
   ```

   **Frontend** — Vite dev server (from root `/`):
   ```sh
   npm run dev
   ```

   The frontend will be served at `http://localhost:5174` and the gateway at `http://localhost:8080`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- ARCHITECTURE -->
## Architecture

The C402 protocol operates as a two-phase HTTP middleware intercept layer:

```
Client (Browser Wallet)
        │
        ▼
  [1] GET /api/protected
        │
        ▼
  C402 Middleware ──► 402 Payment Required
        │              { challenge_token, price_lovelace, payout_address }
        │
  [Wallet Signs & Submits TX on Cardano Preprod]
        │
        ▼
  [2] GET /api/protected
        │  Headers: { x-payment-txhash: <txid> }
        ▼
  C402 Middleware
        ├── Blockfrost Mempool Audit  (<900ms)
        ├── Double-Spend Cache Check
        └── Forward to Protected Resource
                │
                ▼
        Cerebras Llama-3 API
                │
                ▼
        AI Response → Client
```

**Key TypeScript Modules:**

| Module | Role |
|---|---|
| `middleware/c402.ts` | Core HTTP 402 challenge / verification interceptor |
| `services/blockfrost.ts` | Axios-based Blockfrost REST indexer client |
| `services/spendCache.ts` | In-memory replay-attack prevention store |
| `routes/llama.ts` | Cerebras Llama-3.3-70b proxied inference endpoint |
| `src/hooks/useCardano.ts` | CIP-30 wallet connection & CBOR-to-Bech32 decoder |
| `src/components/Sandbox.tsx` | Interactive developer playground UI |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- USAGE -->
## Usage

1. Open `http://localhost:5174/` and navigate to the **Sandbox Playground**.
2. Select **Llama-3 Coder API** from the endpoint selector.
3. Click **Call Protected API** — the gateway returns a `402 Payment Required` challenge with a price and payout address.
4. Paste your **Cerebras API Key** into the configuration panel to unlock live completions.
5. Connect a **Cardano preprod Lace wallet** and click **Sign Payment**.
6. Approve the signature payload in the Lace extension popup.
7. Click **Call Protected API** again — the gateway validates the on-chain transaction via Blockfrost and forwards the request to the Cerebras inference endpoint.
8. Receive the **Llama-3.3-70b code generation** response directly in the playground.

> For integration into your own API, attach `x-payment-txhash: <txid>` as a request header after wallet confirmation.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- ROADMAP -->
## Roadmap

- [x] Configure modular Vite + React + TypeScript frontend router
- [x] Implement CIP-30 wallet connection and CBOR-to-Bech32 decoders
- [x] Deploy Node.js / Express gateway proxy with HTTP 402 header support
- [x] Set up double-spend caching for replay attack prevention
- [x] Integrate live Cerebras Llama-3.3-70b code generation
- [x] Add dynamic Blockfrost testnet mempool block height checks
- [x] Build interactive Sandbox developer playground (Framer Motion UI)
- [ ] Implement full client-side Cardano ledger transaction serialization (no Blockfrost dependency)
- [ ] Support multi-asset ADA token payments (CNT / stablecoin pricing)
- [ ] Pluggable gateway config — mount C402 on any Express route via `npm install c402`
- [ ] Mainnet deployment support with configurable lovelace price tiers

See the [open issues](https://github.com/Premkumar1845/ProofPair/issues) for a full list of proposed features and known bugs.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also open an issue with the tag `enhancement`.
Don't forget to give the project a star!

1. Fork the Project
2. Create your Feature Branch:
   ```sh
   git checkout -b feature/AmazingFeature
   ```
3. Commit your Changes:
   ```sh
   git commit -m 'Add some AmazingFeature'
   ```
4. Push to the Branch:
   ```sh
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

### Top Contributors

<a href="https://github.com/Premkumar1845/ProofPair/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Premkumar1845/ProofPair" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- LICENSE -->
## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- CONTACT -->
## Contact

**Hemanth** — [hemanthme.in](https://hemanthme.in)

**Prem Kumar** — [@Premkumar1845](https://github.com/Premkumar1845/)

Project Link: [https://github.com/Premkumar1845/ProofPair](https://github.com/Premkumar1845/ProofPair)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Cardano Developer Portal](https://developers.cardano.org/templates/)
* [Lace Browser Wallet — CIP-30 Integration Docs](https://www.lace.io)
* [Eternl Wallet](https://eternl.io)
* [Blockfrost Cardano Indexer Services](https://blockfrost.io)
* [Cerebras AI — Llama Inference Documentation](https://cerebras.ai)
* [ReactBits Animated Components](https://reactbits.dev)
* [Framer Motion](https://www.framer.com/motion/)
* [othneildrew's Best-README-Template](https://github.com/othneildrew/Best-README-Template)
* [Img Shields](https://shields.io)
* [contrib.rocks](https://contrib.rocks)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/Premkumar1845/ProofPair.svg?style=for-the-badge
[contributors-url]: https://github.com/Premkumar1845/ProofPair/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Premkumar1845/ProofPair.svg?style=for-the-badge
[forks-url]: https://github.com/Premkumar1845/ProofPair/network/members
[stars-shield]: https://img.shields.io/github/stars/Premkumar1845/ProofPair.svg?style=for-the-badge
[stars-url]: https://github.com/Premkumar1845/ProofPair/stargazers
[issues-shield]: https://img.shields.io/github/issues/Premkumar1845/ProofPair.svg?style=for-the-badge
[issues-url]: https://github.com/Premkumar1845/ProofPair/issues
[license-shield]: https://img.shields.io/github/license/Premkumar1845/ProofPair.svg?style=for-the-badge
[license-url]: https://github.com/Premkumar1845/ProofPair/blob/master/LICENSE

[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/

[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/

[Vite]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vitejs.dev/

[NodeJS]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[NodeJS-url]: https://nodejs.org/

[Express]: https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/

[Axios]: https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white
[Axios-url]: https://axios-http.com/

[Cardano]: https://img.shields.io/badge/Cardano-0033AD?style=for-the-badge&logo=cardano&logoColor=white
[Cardano-url]: https://cardano.org/

[Cerebras]: https://img.shields.io/badge/Cerebras%20AI-FF6B00?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PC9zdmc+&logoColor=white
[Cerebras-url]: https://cerebras.ai/
