export type DocumentType = 'Contract' | 'Legal Document' | 'Business Agreement' | 'Invoice' | 'Government Form' | 'Other';

export interface AnalysisSummary {
  simpleSummary: string;
  keyInformation: {
    parties: string;
    dates: string;
    paymentTerms: string;
    responsibilities: string;
  };
  clauses: {
    title: string;
    section: string;
    description: string;
  }[];
  risks: {
    title: string;
    description: string;
  }[];
  benefits: {
    title: string;
    description: string;
  }[];
  checkCarefully: {
    title: string;
    description: string;
  }[];
  questions: string[];
  verdict: {
    score: 'Safe' | 'Moderate Risk' | 'High Risk';
    reasoning: string;
    confidence: number;
  };
}

export interface AnalysisRecord {
  id: string;
  name: string;
  type: DocumentType;
  date: string;
  verdict: AnalysisSummary['verdict'];
  result: AnalysisSummary;
}
