import { PlayerResult, GameInfo, GameListItem, GameTask, PlayerAnswer, GamePhoto } from '../types';

const V3_BASE_URL = 'https://api.loquiz.com/v3';
const V4_BASE_URL = 'https://api.loquiz.com/v4';

// Use primary corsproxy.io as it supports headers, fallback to others if desperate (though auth headers are tricky with simple get proxies)
const PROXIES = [
    'https://corsproxy.io/?',
];

/**
 * Interface for the game object from the Loquiz API.
 */
interface LoquizGame {
  id: string;
  title: string;
  intro?: string; 
  outro?: string; 
  imageUrl?: string;
  logoUrl?: string; 
  created?: string | number;
  date?: string | number; 
  eventDate?: string | number; 
  startTime?: string | number; 
  start?: string | number; 
  playable?: boolean;
  status?: string | number;
  createdAt?: string | number; 
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
  answers?: any[]; 
}

/**
 * Helper to fetch with retry across multiple proxies
 */
const fetchWithRetry = async (urlStr: string, options: RequestInit): Promise<Response> => {
    let lastError: any = new Error("Network request failed");
    
    for (const proxyBase of PROXIES) {
        try {
            const proxiedUrl = `${proxyBase}${encodeURIComponent(urlStr)}`;
            const res = await fetch(proxiedUrl, options);
            
            // If success, return immediately
            if (res.ok) return res;

            // If it's a 401/403, it is likely a valid response from the API (Auth failed), so stop retrying.
            if (res.status === 401 || res.status === 403) return res;

            console.warn(`Proxy ${proxyBase} returned ${res.status}, trying next...`);
            lastError = new Error(`Proxy error: ${res.status} ${res.statusText}`);
            
        } catch (e) {
            console.warn(`Proxy ${proxyBase} failed:`, e);
            lastError = e;
        }
    }
    throw lastError;
};

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
        return {
            'Authorization': `ApiKey-v1 ${cleanKey}`,
            'Accept': 'application/json'
        };
    } else {
        return {
            'Authorization': `Bearer ${cleanKey}`,
            'Accept': 'application/json'
        };
    }
};

export const fetchGames = async (apiKey: string): Promise<GameListItem[]> => {
    if (apiKey === 'GUEST' || apiKey === 'SKIP') {
        return [];
    }

    const isV3 = isV3Key(apiKey);
    const version = isV3 ? 'v3' : 'v4';
    console.log(`Fetching list of games using API ${version}`);
    
    try {
        const baseUrl = getBaseUrl(apiKey);
        const url = new URL(`${baseUrl}/games`);
        // Use 1000 limit to see all completed games
        url.searchParams.append('limit', '1000'); 
        
        const response = await fetchWithRetry(url.toString(), {
            headers: getAuthHeaders(apiKey)
        });

        if (!response.ok) {
            return handleApiError(response, "fetching games");
        }

        const json = await response.json();
        const data: LoquizGame[] = Array.isArray(json) ? json : (json.data || json.items || []);

        return data.map((game) => ({
            id: game.id,
            name: game.title,
            created: game.eventDate || game.date || game.startTime || game.start || game.created || game.createdAt,
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
  console.log(`Fetching game info for game ID: ${gameId}`);

  try {
    const baseUrl = getBaseUrl(apiKey);
    const url = new URL(`${baseUrl}/games/${gameId}`);
    
    const response = await fetchWithRetry(url.toString(), {
        headers: getAuthHeaders(apiKey)
    });

    if (!response.ok) {
      return handleApiError(response, "fetching game info");
    }

    const data: LoquizGame = await response.json();
    
    return {
        name: data.title,
        intro: data.intro,
        outro: data.outro,
        logoUrl: data.logoUrl || data.imageUrl
    };

  } catch (error) {
    console.warn("Error fetching game info:", error);
    return { name: "Game Info Unavailable", intro: "Could not load details." };
  }
};

const extractContentText = (content: any): string => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (content.text && typeof content.text === 'string') return content.text;
    if (Array.isArray(content.content)) return content.content.map(extractContentText).join(' ');
    if (Array.isArray(content)) return content.map(extractContentText).join(' ');
    return '';
};

const mapApiTasksToGameTasks = (data: any[]): GameTask[] => {
    return data.map((task: any) => {
        const cleanText = (text: any) => {
            if (typeof text === 'string') return text.replace(/<[^>]*>/g, '').trim();
            return undefined;
        };
        let shortIntro = task.shortIntro || task.short_intro;
        let regularIntro = task.intro;
        let content = task.content; 
        let contentText = typeof content === 'object' ? extractContentText(content) : content;
        let introTextRaw = typeof regularIntro === 'object' ? extractContentText(regularIntro) : regularIntro;
        let shortIntroText = typeof shortIntro === 'object' ? extractContentText(shortIntro) : shortIntro;
        
        // Prioritize shortIntro, then regular intro, then content
        const introText = cleanText(shortIntroText) || cleanText(introTextRaw) || cleanText(contentText);
        
        let title = task.title || task.question || task.text;
        if (!title && contentText && typeof contentText === 'string') {
            const cleanContent = cleanText(contentText) || '';
            title = cleanContent.length > 50 ? cleanContent.substring(0, 50) + '...' : cleanContent;
        }

        return {
            id: task.id,
            title: typeof title === 'string' ? title : `Task ${task.id}`,
            type: task.type,
            intro: introText,
            shortIntro: cleanText(shortIntroText), // Store explicitly
            points: task.points,
            latitude: task.latitude,
            longitude: task.longitude,
            radius: task.radius,
            raw: task
        };
    });
};

export const fetchGameTasks = async (gameId: string, apiKey: string): Promise<GameTask[]> => {
    const isV3 = isV3Key(apiKey);
    const baseUrl = getBaseUrl(apiKey);
    const headers = getAuthHeaders(apiKey);

    const doFetch = async (urlStr: string) => {
        const url = new URL(urlStr);
        url.searchParams.append('limit', '200');
        const res = await fetchWithRetry(url.toString(), { headers });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
    };

    // Strategy: Try V4 endpoint first because it typically contains richer data (like shortIntro).
    // Most ApiKey-v1 keys work on V4 endpoints.
    try {
        console.log("Attempting to fetch tasks via V4 API...");
        const json = await doFetch(`${V4_BASE_URL}/games/${gameId}/tasks`);
        const data = Array.isArray(json) ? json : (json.data || json.items || []);
        console.log(`V4 Tasks fetched: ${data.length}`);
        return mapApiTasksToGameTasks(data);
    } catch (v4Error) {
        console.warn("V4 Tasks fetch failed, falling back to legacy/V3 logic", v4Error);
    }

    // Fallback logic
    try {
        if (isV3) {
            try {
                const json = await doFetch(`${baseUrl}/results/${gameId}/questions`);
                const data = Array.isArray(json) ? json : (json.data || json.items || []);
                return mapApiTasksToGameTasks(data);
            } catch (primaryError) {
                const json = await doFetch(`${baseUrl}/games/${gameId}/questions`);
                const data = Array.isArray(json) ? json : (json.data || json.items || []);
                return mapApiTasksToGameTasks(data);
            }
        } else {
            // This is unlikely to be reached if V4 try block above failed, but just in case
            const json = await doFetch(`${baseUrl}/games/${gameId}/tasks`);
            const data = Array.isArray(json) ? json : (json.data || json.items || []);
            return mapApiTasksToGameTasks(data);
        }
    } catch (error) {
        // Fallback to scraping results handled in component or results fetch
        return [];
    }
};

export const fetchGameResults = async (gameId: string, apiKey: string): Promise<PlayerResult[]> => {
  const isV3 = isV3Key(apiKey);
  console.log(`Fetching results for game ID: ${gameId}`);
  
  try {
    const baseUrl = getBaseUrl(apiKey);
    let url: URL;

    if (isV3) {
        url = new URL(`${baseUrl}/results/${gameId}/teams`);
        url.searchParams.append('sort', '-totalScore'); 
        url.searchParams.append('includeAnswers', 'true');
    } else {
        url = new URL(`${baseUrl}/games/${gameId}/results`);
        url.searchParams.append('sort', '-totalScore'); 
        // Try including answers on V4 too just in case
        url.searchParams.append('includeAnswers', 'true');
    }
    url.searchParams.append('limit', '100');

    const response = await fetchWithRetry(url.toString(), {
        headers: getAuthHeaders(apiKey)
    });

    if (!response.ok) {
       return handleApiError(response, "fetching game results");
    }

    const json = await response.json();
    const data: LoquizTeamResult[] = Array.isArray(json) ? json : (json.data || json.items || []);

    return data.map((team, index) => {
      const answersArray = Array.isArray(team.answers) ? team.answers : [];
      const mappedAnswers: PlayerAnswer[] = answersArray.map((a: any) => ({
        taskId: a.taskId || a.questionId,
        isCorrect: a.isCorrect === true || a.isCorrect === 1,
        score: a.score,
        raw: a
      }));

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

  } catch (error) {
    if (error instanceof TypeError) { 
        throw new Error("Network error. Please check your connection.");
    }
    console.warn("Error fetching results:", error);
    throw error;
  }
};

export const fetchGamePhotos = async (gameId: string, apiKey: string): Promise<GamePhoto[]> => {
    const isV3 = isV3Key(apiKey);
    const baseUrl = getBaseUrl(apiKey);
    const headers = getAuthHeaders(apiKey);
    
    const fetchWithAuth = async (urlStr: string) => {
        const url = new URL(urlStr);
        url.searchParams.append('limit', '200');
        const res = await fetchWithRetry(url.toString(), { headers });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
    };

    try {
        const endpoint = isV3 ? `${baseUrl}/results/${gameId}/photos` : `${baseUrl}/games/${gameId}/photos`;
        const json = await fetchWithAuth(endpoint);
        const data = Array.isArray(json) ? json : (json.data || json.items || []);
        if (data.length > 0) return mapPhotos(data);
    } catch (e) {
        // Fallback to deep search via results
    }

    try {
        let resultsUrlStr = isV3 ? `${baseUrl}/results/${gameId}/teams` : `${baseUrl}/games/${gameId}/results`;
        const url = new URL(resultsUrlStr);
        if (isV3) url.searchParams.append('includeAnswers', 'true');
        url.searchParams.append('limit', '100');

        const response = await fetchWithRetry(url.toString(), { headers });
        
        if (response.ok) {
            const json = await response.json();
            const teams: LoquizTeamResult[] = Array.isArray(json) ? json : (json.data || json.items || []);
            const scrapedPhotos: any[] = [];
            teams.forEach(team => {
                if (team.answers && Array.isArray(team.answers)) {
                    team.answers.forEach(answer => {
                        let candidateUrl = answer.file || answer.image || answer.picture || answer.url || answer.media || answer.content;
                        if (!candidateUrl && typeof answer.answer === 'string' && (answer.answer.startsWith('http') || answer.answer.startsWith('data:'))) {
                            candidateUrl = answer.answer;
                        }
                        if (candidateUrl) {
                            scrapedPhotos.push({ ...answer, url: candidateUrl, teamName: team.name, team: { name: team.name } });
                        }
                    });
                }
            });
            if (scrapedPhotos.length > 0) {
                const mapped = mapPhotos(scrapedPhotos);
                return mapped.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);
            }
        }
    } catch (e) {
        console.warn("Deep photo search failed:", e);
    }

    return [];
};

const mapPhotos = (data: any[]): GamePhoto[] => {
    return data.map((item: any) => ({
        id: item.id || Math.random().toString(),
        url: item.url || item.large || item.image || item.picture || item.file || item.original || (typeof item.answer === 'string' && item.answer.startsWith('http') ? item.answer : undefined),
        thumbnailUrl: item.thumb || item.thumbnail || item.small,
        teamName: item.team?.name || item.teamName,
        taskTitle: item.question?.title || item.task?.title || item.taskTitle,
        timestamp: item.time || item.created
    })).filter((p: any) => p.url);
};