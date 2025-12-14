
export interface PlayerAnswer {
  taskId: string;
  isCorrect?: boolean;
  score?: number;
}

export interface PlayerResult {
  position: number;
  name: string;
  score: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  isFinished?: boolean;
  odometer?: number;
  color?: string;
  answers?: PlayerAnswer[];
}

export interface GameInfo {
  name: string;
  intro?: string;
  outro?: string;
  logoUrl?: string;
}

export interface GameListItem {
  id: string;
  name: string;
  created?: string | number;
  isPlayable?: boolean;
  status?: string | number;
}

export interface GameTask {
  id: string;
  title: string;
  type: string;
  intro?: string;
  points?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}
