# Fraud Scoring Microservice

## Overview
This microservice evaluates the risk level of a payment transaction using predefined heuristics and an AI-powered explanation through the OpenAI API.

## Features
- Risk scoring based on:
  - Email domain (e.g. `.ru`, `fraud.net`)
  - Large transaction amounts
  - Repeat IPs or device fingerprints
  - Very large transactions >= 5000
- AI-generated explanation for risk assessment via OpenAI LLM
- Basic fraud statistics endpoint
- Fully modular with input validation (via Joi)
- Environment-based configuration using `dotenv` and `envalid`

## Setup Instructions

### Node.js Version
Ensure you are using **Node.js version 18.x or higher**. You can check your current version with:
```bash
node -v
```
1. **Clone the repository**
    ```bash
    git clone https://github.com/nikhilyam/fraudScoringService.git
    ```

2. **Install dependencies**
    ```bash
    npm install
    ```

3. **Create a `.env` file**
    ```env
    APP_PORT=3000
    NODE_ENV=development
    OPENAI_API_URL="https://api.openai.com/v1"
    OPENAI_API_KEY=your_openai_api_key
    ```

4. **Run the service**
    ```bash
    npm start
    ```

5. **Available Endpoints:**
- `POST /evaluate-risk` : Evaluate fraud risk for a transaction
- `GET /fraud-stats` : View accumulated fraud evaluation statistics

## Example Request (POST /evaluate-risk)
```json
{
    "amount": 5000,
    "currency": "USD",
    "ip": "198.51.100.22",
    "deviceFingerprint": "abc123",
    "email": "user@fraud.net"
}

{
    "amount": 5500,
    "currency": "USD",
    "ip": "192.168.1.100",
    "deviceFingerprint": "device-xyz",
    "email": "user@example.ru"
}
```

## Fraud Logic Description
- If the email domain is high risk (e.g. `.ru`, `fraud.net`), add 0.4 to score.
- Amounts over 1000 add 0.3.
- Previously seen IPs and device fingerprints each add 0.1.
- Amounts >= 5000 add an additional 0.1.
- Total score is capped at 1.0.

### LLM (OpenAI) Usage
After computing the numeric score, the service calls OpenAI API to generate a **natural language explanation** of the risk factors identified.

## Assumptions & Tradeoffs
- **In-memory state:** Tracks seen IPs and fingerprints in-memory. Not persistent across restarts.
- **LLM API cost:** Each evaluation calls the OpenAI API, which may incur usage costs.
- **Simple Heuristics:** This is not a comprehensive fraud detection engine, just a rule-based score combined with AI explanation.
- **Rate Limiting:** LLM requests use retry logic with backoff on 429 errors but lack advanced rate-limiting protections.

---
### Tech Stack
- Node.js with Express
- Joi for validation
- Axios for API calls
- dotenv + envalid for environment configs
- OpenAI GPT for explanations

---
**MIT License**
