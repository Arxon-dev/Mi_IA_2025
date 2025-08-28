export interface StoredDocument {
  id: string;
  title: string;
  content: string;
  date: string | Date;
  type: string;
  questionCount: number;
  createdAt?: Date;
  updatedAt?: Date;
  sections?: Section[];
  questions?: Question[];
}

export interface Section {
  id: string;
  documentId: string;
  title: string;
  content: string;
  type: string;
  order: number;
  processed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Question {
  id: string;
  documentId: string;
  content: string;
  type: string;
  difficulty: string;
  bloomLevel?: string | null;
  createdAt?: Date;
  answer?: string;
} 