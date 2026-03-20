interface Env {
  AI: Ai;
  API_KEY: string;
  ALLOWED_ORIGINS: string; // comma-separated
}

interface SummaryPayload {
  date: string;
  totalIncome: number;
  totalCosts: number;
  totalProfit: number;
  dailyProfitTarget: number;
  goalAchievementPct: number;
  productiveMinutes: number;
  wastedMinutes: number;
  activitiesCount: number;
  topActivities: { name: string; profit: number; minutes: number }[];
  streak: number;
  weeklyProfit: number;
  weeklyTarget: number;
  daysRemainingInWeek: number;
  dailyTargetToReachWeeklyGoal: number;
}

interface TTSPayload {
  text: string;
}

function corsHeaders(origin: string, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim());
  const isAllowed = allowed.includes(origin) || allowed.includes('*');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function unauthorized(origin: string, env: Env): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env) },
  });
}

function buildSystemPrompt(): string {
  return `Eres un coach motivacional estilo Kaizen para un emprendedor mexicano. Tu rol:
- Analiza las estadisticas del dia y da un resumen energetico y positivo
- Usa español mexicano natural (tuteo, expresiones coloquiales pero profesionales)
- Maximo 150 palabras
- Destaca logros especificos con numeros
- IMPORTANTE: el campo goalAchievementPct ya tiene el porcentaje calculado correctamente. Usalo directamente, NO lo recalcules. Por ejemplo si dice 90% es que alcanzo el 90% de su meta
- Si no alcanzo la meta, motivalo sin juzgar y sugiere una mejora concreta
- Si supero la meta, celebra y reta a mejorar manana
- Menciona el streak si es > 1 dia
- Menciona cuantos dias faltan en la semana y cuanto necesita producir por dia para alcanzar la meta semanal. Usa los campos daysRemainingInWeek y dailyTargetToReachWeeklyGoal
- Termina con una frase motivacional corta
- NO uses emojis
- NO uses markdown ni formato especial, solo texto plano`;
}

function buildUserPrompt(data: SummaryPayload): string {
  const topActs = data.topActivities
    .map(a => `- ${a.name}: $${a.profit} en ${a.minutes}min`)
    .join('\n');

  return `Estadisticas del dia ${data.date}:
- Ingreso total: $${data.totalIncome}
- Costos: $${data.totalCosts}
- Ganancia: $${data.totalProfit}
- Meta diaria: $${data.dailyProfitTarget}
- Logro de meta: ${data.goalAchievementPct}% (es decir, alcanzo el ${data.goalAchievementPct}% de su meta de $${data.dailyProfitTarget})
- Minutos productivos: ${data.productiveMinutes}
- Minutos desperdiciados: ${data.wastedMinutes}
- Actividades completadas: ${data.activitiesCount}
- Racha de dias: ${data.streak}
- Ganancia semanal acumulada: $${data.weeklyProfit} (meta semanal: $${data.weeklyTarget})
- Dias restantes en la semana (sin contar hoy): ${data.daysRemainingInWeek - 1}
- Falta para meta semanal: $${Math.max(0, data.weeklyTarget - data.weeklyProfit)}
- Para alcanzar meta semanal necesita producir: $${data.dailyTargetToReachWeeklyGoal} por dia los proximos ${data.daysRemainingInWeek - 1} dias

Top actividades:
${topActs || '(sin actividades registradas)'}

Genera el resumen motivacional del dia.`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Auth check
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (token !== env.API_KEY) {
      return unauthorized(origin, env);
    }

    try {
      if (url.pathname === '/summary' && request.method === 'POST') {
        return await handleSummary(request, env, cors);
      }

      if (url.pathname === '/tts' && request.method === 'POST') {
        return await handleTTS(request, env, cors);
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }
  },
};

async function handleSummary(
  request: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  const data = (await request.json()) as SummaryPayload;

  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(data) },
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  const summary = (response as { response: string }).response || '';

  return new Response(JSON.stringify({ summary }), {
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function handleTTS(
  request: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  const { text } = (await request.json()) as TTSPayload;

  if (!text || text.length > 1000) {
    return new Response(JSON.stringify({ error: 'Text required (max 1000 chars)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const audio = await env.AI.run('@cf/myshell/melotts' as Parameters<Ai['run']>[0], {
    prompt: text,
    language: 'es',
  });

  return new Response(audio as ReadableStream, {
    headers: {
      'Content-Type': 'audio/wav',
      ...cors,
    },
  });
}
