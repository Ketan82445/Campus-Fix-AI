import { PrismaClient, Status, Category } from '@prisma/client';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
  'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t',
  'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  'issue', 'problem', 'broken', 'not', 'working', 'please', 'fix', 'help', 'there', 'is'
]);

function tokenizeAndClean(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function calculateJaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  
  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionSize++;
    }
  }

  const unionSize = new Set([...tokensA, ...tokensB]).size;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

function normalizeLocationString(str?: string | null): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface CheckSimilarInput {
  title: string;
  description?: string;
  location: string;
  building?: string;
  floor?: string;
  room?: string;
  category?: Category;
  userId?: string;
}

export interface SimilarMatch {
  id: string;
  complaintNumber: string;
  title: string;
  description: string;
  category: string;
  location: string;
  building: string | null;
  floor: string | null;
  room: string | null;
  status: string;
  createdAt: Date;
  similarityScore: number;
  matchReasons: string[];
  upvoteCount: number;
  hasUpvoted: boolean;
}

export class ComplaintSimilarityService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find open/active complaints that closely match the new complaint being drafted.
   */
  async findSimilarComplaints(input: CheckSimilarInput): Promise<SimilarMatch[]> {
    const inputTitleTokens = tokenizeAndClean(input.title);
    const inputDescTokens = tokenizeAndClean(input.description || '');
    const combinedInputTokens = Array.from(new Set([...inputTitleTokens, ...inputDescTokens]));

    if (combinedInputTokens.length === 0 && !input.location && !input.room) {
      return [];
    }

    // Look for active complaints in non-closed states from the last 45 days
    const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);

    const activeComplaints = await this.prisma.complaint.findMany({
      where: {
        status: {
          notIn: [Status.CLOSED, Status.REJECTED]
        },
        createdAt: {
          gte: fortyFiveDaysAgo
        }
      },
      select: {
        id: true,
        complaintNumber: true,
        title: true,
        description: true,
        category: true,
        location: true,
        building: true,
        floor: true,
        room: true,
        status: true,
        createdAt: true,
        upvotes: {
          select: {
            userId: true
          }
        }
      },
      take: 60,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const matches: SimilarMatch[] = [];

    const normInputBuilding = normalizeLocationString(input.building);
    const normInputRoom = normalizeLocationString(input.room);
    const normInputLoc = normalizeLocationString(input.location);

    for (const comp of activeComplaints) {
      let score = 0;
      const reasons: string[] = [];

      // 1. Location Matching (Max 40 points)
      const normCompBuilding = normalizeLocationString(comp.building);
      const normCompRoom = normalizeLocationString(comp.room);
      const normCompLoc = normalizeLocationString(comp.location);

      let locationScore = 0;
      if (normInputRoom && normCompRoom && normInputRoom === normCompRoom) {
        locationScore += 25;
        reasons.push(`Exact room match: "${comp.room}"`);
      } else if (normInputLoc && normCompLoc && (normInputLoc.includes(normCompLoc) || normCompLoc.includes(normInputLoc))) {
        locationScore += 20;
        reasons.push(`Matching location area: "${comp.location}"`);
      }

      if (normInputBuilding && normCompBuilding && normInputBuilding === normCompBuilding) {
        locationScore += 15;
        reasons.push(`Same building: "${comp.building}"`);
      }

      score += Math.min(40, locationScore);

      // 2. Keyword & Text Similarity (Max 45 points)
      const compTokens = tokenizeAndClean(`${comp.title} ${comp.description}`);
      const jaccard = calculateJaccardSimilarity(combinedInputTokens, compTokens);

      const textScore = Math.round(jaccard * 45);
      if (textScore > 0) {
        score += textScore;
        // Find matching keywords to show user
        const matchedWords = combinedInputTokens.filter(t => compTokens.includes(t));
        if (matchedWords.length > 0) {
          reasons.push(`Key terms shared: ${matchedWords.slice(0, 3).map(w => `"${w}"`).join(', ')}`);
        }
      }

      // Title direct token overlap bonus
      const titleTokens = tokenizeAndClean(comp.title);
      const titleOverlap = inputTitleTokens.filter(t => titleTokens.includes(t));
      if (titleOverlap.length >= 2) {
        score += 10;
      }

      // 3. Category Match (Max 15 points)
      if (input.category && comp.category === input.category) {
        score += 15;
        reasons.push(`Same category: ${comp.category}`);
      }

      // Clamp score to 100
      const finalScore = Math.min(100, Math.round(score));

      // Threshold: at least 35% match or exact room + keyword
      if (finalScore >= 35) {
        const upvoteCount = comp.upvotes.length;
        const hasUpvoted = input.userId ? comp.upvotes.some(u => u.userId === input.userId) : false;

        matches.push({
          id: comp.id,
          complaintNumber: comp.complaintNumber,
          title: comp.title,
          description: comp.description,
          category: comp.category,
          location: comp.location,
          building: comp.building,
          floor: comp.floor,
          room: comp.room,
          status: comp.status,
          createdAt: comp.createdAt,
          similarityScore: finalScore,
          matchReasons: reasons,
          upvoteCount,
          hasUpvoted
        });
      }
    }

    // Sort by similarity descending, return top 5
    return matches.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 5);
  }
}
