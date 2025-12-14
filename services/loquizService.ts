import { PlayerResult, GameInfo, GameListItem, GameTask, PlayerAnswer } from '../types';

const V3_BASE_URL = 'https://api.loquiz.com/v3';
const V4_BASE_URL = 'https://api.loquiz.com/v4';
// Use a CORS proxy to allow browser-based requests to the Loquiz API which does not support CORS.
const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Interface for the game object from the Loquiz API.
 */
interface LoquizGame {
  id: string;
  title: string;
  intro?: string; // v4 specific
  outro?: string; // v4 specific
  imageUrl?: string; // v3 common
  logoUrl?: string; // as per php reference
  created?: string | number;
  date?: string | number; // Potential alias
  eventDate?: string | number; // Potential alias
  startTime?: string | number; // Potential alias
  start?: string | number; // Potential alias
  playable?: boolean;
  status?: string | number;
}

/**
 * Interface for the team result object.
 */
interface LoquizTeamResult {
  id: string;
  name: string;
  totalScore?: number;
  answersScore?: number;
  odometer?: number;
  startTime?: string;
  finishTime?: string;
  isFinished?: boolean;
  correctAnswers?: number;
  incorrectAnswers?: number;
  color?: string;
  answers?: any[]; // Raw answers array from API
}

const handleApiError = async (response: Response, context: string): Promise<never> => {
    let errorMessage = `API Error ${context}: ${response.status} ${response.statusText}`;
    try {
        const errorBody = await response.json();
        if (errorBody && errorBody.message) {
          errorMessage = errorBody.message;
        } else if (errorBody && errorBody.error && errorBody.error.message) {
             errorMessage = errorBody.error.message;
        }
    } catch (e) {
        // Error response was not valid JSON.
    }
    throw new Error(errorMessage);
}

const isV3Key = (apiKey: string): boolean => {
    return apiKey.trim().toLowerCase().startsWith('apikey-v1');
};

const getBaseUrl = (apiKey: string): string => {
    return isV3Key(apiKey) ? V3_BASE_URL : V4_BASE_URL;
};

// Helper to extract the raw key 
const getCleanKey = (apiKey: string): string => {
  let key = apiKey.trim();
  if (key.toLowerCase().startsWith('apikey-v1')) {
    key = key.substring(9).trim();
  }
  return key;
};

const getAuthHeaders = (apiKey: string) => {
    const cleanKey = getCleanKey(apiKey);
    
    if (isV3Key(apiKey)) {
        // V3 Auth
        return {
            'Authorization': `ApiKey-v1 ${cleanKey}`,
            'Accept': 'application/json'
        };
    } else {
        // V4 Auth
        return {
            'Authorization': `Bearer ${cleanKey}`,
            'Accept': 'application/json'
        };
    }
};

export const fetchGames = async (apiKey: string): Promise<GameListItem[]> => {
    const isV3 = isV3Key(apiKey);
    const version = isV3 ? 'v3' : 'v4';
    console.log(`Fetching list of games using API ${version}`);
    
    try {
        const baseUrl = getBaseUrl(apiKey);
        const url = new URL(`${baseUrl}/games`);
        // Add limit to fetch more than default 10
        url.searchParams.append('limit', '100');
        
        // Wrap the URL with the CORS proxy
        const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(url.toString())}`;

        const response = await fetch(proxiedUrl, {
            headers: getAuthHeaders(apiKey)
        });

        if (!response.ok) {
            return handleApiError(response, "fetching games");
        }

        const json = await response.json();
        // V3: json.items or array
        // V4: json.data or array
        const data: LoquizGame[] = Array.isArray(json) ? json : (json.data || json.items || []);

        return data.map((game) => ({
            id: game.id,
            name: game.title,
            // Prioritize explicit event dates over creation date
            // Added check for eventDate and start properties which sometimes hold the schedule info
            created: game.eventDate || game.date || game.startTime || game.start || game.created,
            isPlayable: game.playable,
            status: game.status
        }));

    } catch (error) {
        if (error instanceof TypeError) {
          throw new Error("Could not connect to Loquiz. Please check your internet connection.");
        }
        console.warn("Error fetching Loquiz games:", error);
        throw error;
    }
};

export const fetchGameInfo = async (gameId: string, apiKey: string): Promise<GameInfo> => {
  const isV3 = isV3Key(apiKey);
  console.log(`Fetching game info for game ID: ${gameId} using API ${isV3 ? 'v3' : 'v4'}`);

  try {
    const baseUrl = getBaseUrl(apiKey);
    const url = new URL(`${baseUrl}/games/${gameId}`);
    
    // Wrap the URL with the CORS proxy
    const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(url.toString())}`;
    
    const response = await fetch(proxiedUrl, {
        headers: getAuthHeaders(apiKey)
    });

    if (!response.ok) {
      return handleApiError(response, "fetching game info");
    }

    const data: LoquizGame = await response.json();
    
    // In v3, intro/outro might not be present or named differently, but we map what we can.
    return {
        name: data.title,
        intro: data.intro,
        outro: data.outro,
        logoUrl: data.logoUrl || data.imageUrl
    };

  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Network error while fetching game info.");
    }
    console.warn("Error fetching game info:", error);
    throw error;
  }
};

export const fetchGameTasks = async (gameId: string, apiKey: string): Promise<GameTask[]> => {
    const isV3 = isV3Key(apiKey);
    console.log(`Fetching tasks for game ID: ${gameId} using API ${isV3 ? 'v3' : 'v4'}`);

    try {
        const baseUrl = getBaseUrl(apiKey);
        let url: URL;

        // V3 and V4 have different endpoints for tasks/questions
        // For V3 keys (often result-scoped), /games/{id}/questions might be 403/404.
        // The questions are reliably accessible via the results endpoint: /results/{id}/questions
        if (isV3) {
            url = new URL(`${baseUrl}/results/${gameId}/questions`);
        } else {
            url = new URL(`${baseUrl}/games/${gameId}/tasks`);
        }
        
        url.searchParams.append('limit', '200'); // Ensure we get a good amount of tasks

        // Wrap the URL with the CORS proxy
        const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(url.toString())}`;

        const response = await fetch(proxiedUrl, {
            headers: getAuthHeaders(apiKey)
        });

        if (!response.ok) {
            // gracefully fail for tasks so we don't block the whole app results
            console.warn(`Warning: Could not fetch tasks (Status ${response.status}). Proceeding without task definitions.`);
            return [];
        }

        const json = await response.json();
        // V3/V4 handling: json.data or json.items or just json array
        const data: any[] = Array.isArray(json) ? json : (json.data || json.items || []);

        return data.map((task: any) => ({
            id: task.id,
            // V3 uses 'text' or 'question', V4 uses 'title'. 
            title: task.title || task.question || task.text || 'Untitled Task',
            type: task.type,
            intro: task.intro,
            points: task.points,
            latitude: task.latitude,
            longitude: task.longitude,
            radius: task.radius
        }));

    } catch (error) {
        // Return empty array instead of throwing to allow other data to load
        console.warn("Error fetching game tasks, returning empty list:", error);
        return [];
    }
};

export const fetchGameResults = async (gameId: string, apiKey: string): Promise<PlayerResult[]> => {
  const isV3 = isV3Key(apiKey);
  console.log(`Fetching results for game ID: ${gameId} using API ${isV3 ? 'v3' : 'v4'}`);
  
  try {
    const baseUrl = getBaseUrl(apiKey);
    let url: URL;

    if (isV3) {
        // V3 Endpoint
        url = new URL(`${baseUrl}/results/${gameId}/teams`);
        url.searchParams.append('sort', '-totalScore'); 
        url.searchParams.append('includeAnswers', 'true'); // PHP implies this via display of answers
        url.searchParams.append('includeFirstImage', 'true');
        url.searchParams.append('limit', '100'); // Fetch up to 100 to emulate basic list
    } else {
        // V4 Endpoint - standardized
        url = new URL(`${baseUrl}/games/${gameId}/results`);
        url.searchParams.append('sort', '-totalScore'); 
        url.searchParams.append('limit', '100');
    }

    // Wrap the URL with the CORS proxy
    const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(url.toString())}`;

    const response = await fetch(proxiedUrl, {
        headers: getAuthHeaders(apiKey)
    });

    if (!response.ok) {
       return handleApiError(response, "fetching game results");
    }

    const json = await response.json();
    // V3 returns { items: [], total: number, ... }
    const data: LoquizTeamResult[] = Array.isArray(json) ? json : (json.data || json.items || []);

    const formattedResults: PlayerResult[] = data.map((team, index) => {
      // Map raw answers to internal type
      const mappedAnswers: PlayerAnswer[] = team.answers ? team.answers.map((a: any) => ({
        taskId: a.taskId || a.questionId, // Handle V3/V4 discrepancies
        isCorrect: a.isCorrect,
        score: a.score
      })) : [];

      return {
        position: index + 1,
        name: team.name || 'Unknown Team',
        score: team.totalScore ?? team.answersScore ?? 0,
        correctAnswers: team.correctAnswers,
        incorrectAnswers: team.incorrectAnswers,
        isFinished: team.isFinished,
        odometer: team.odometer,
        color: team.color,
        answers: mappedAnswers
      };
    });

    return formattedResults;

  } catch (error) {
    if (error instanceof TypeError) { 
        throw new Error("Network error. Please check your connection or API Key permissions.");
    }
    console.warn("Error fetching results:", error);
    throw error;
  }
};