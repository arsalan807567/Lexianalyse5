# LexiAnalyse | Enterprise Document AI

LexiAnalyse is a professional-grade document analysis engine powered by Google's Gemini Pro API. It simplifies complex legal, business, and financial documents into plain language while providing deep forensic risk detection.

## 🚀 Features

- **Semantic Analysis**: Understand the core meaning of complex clauses.
- **Risk Detection**: Identify unfair terms, hidden penalties, and legal pitfalls.
- **Multi-modal Support**: Analyze PDFs, Word documents, and high-res images.
- **Freemium SaaS Model**: Integrated usage limits and pricing tiers.
- **Enterprise Grade UI**: Polished, professional dashboard design using Tailwind CSS and Framer Motion.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS 4.0
- **AI**: Google Generative AI (@google/genai)
- **Backend**: Express (Server-side proxy for SPA hosting)
- **Icons**: Lucide React, Google Material Symbols

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API Key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root.
   - Add your Gemini API key:
     ```env
     GEMINI_API_KEY=your_key_here
     ```

### Development

Run the development server with Hot Module Replacement:
```bash
npm run dev
```

### Production

Build for production:
```bash
npm run build
```

The build output will be in the `dist/` directory.

## 📄 License

Apache-2.0
