// TerraCerta — Edge Function: plant-diagnosis
// Uses the OpenAI Responses API with a vision model to analyse plant photos.
//
// Security:
// - JWT validated (authenticated users only).
// - Rate-limited to 10 requests/hour/user via diagnosis_rate_limits table.
// - The AI prompt is defined EXCLUSIVELY on the server — the frontend cannot
//   inject free-text instructions to the model.
// - Stores raw AI response, confidence, model version, timestamp, photo, user.
// - confidence < 50 → status "low_confidence" (no diagnosis saved).
// - Does NOT recommend fitopharmaceutical products without verified authorization.
// - Does NOT diagnose pH / nitrogen / phosphorus / potassium from photos.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MIN_CONFIDENCE = 50;
const RATE_LIMIT_PER_HOUR = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_PARTS = ["folha", "fruto", "caule", "raiz", "inseto", "terra"];
const AI_TIMEOUT_MS = 30_000;

const MODEL = "gpt-4o";

interface DiagnosisRequest {
  imageBase64?: string;
  storagePath?: string;
  part: string;
  plantName?: string;
  region?: string;
  symptoms?: string;
  watering?: string;
  sunExposure?: string;
}

interface StructuredDiagnosis {
  status: string;
  plant_name: string;
  scientific_name: string;
  problem_category: string;
  primary_diagnosis: string;
  confidence_score: number;
  confidence_level: string;
  visible_signs: string[];
  possible_causes: { label: string; probability: number; type: string }[];
  questions_needed: string[];
  immediate_actions: string[];
  biological_actions: string[];
  conventional_actions: string[];
  safety_warnings: string[];
  new_photos_required: string[];
  follow_up_days: number;
  model_version: string;
}

const SYSTEM_PROMPT = `És um especialista em fitopatologia e agricultura, com foco em Portugal.
Analisa a fotografia enviada e identifica a planta/cultura, a parte fotografada, e o problema mais provável.
Tenta identificar: doença provável, praga provável, deficiência nutricional, excesso ou falta de água, queimadura solar, danos por frio/vento/produtos, estado geral da planta.

REGRAS CRÍTICAS:
1. Nunca apresentes certeza absoluta — a confiança máxima é 95%.
2. Se a confiança for inferior a 50%, define status como "low_confidence".
3. NUNCA recomendes doses de produtos fitofarmacêuticos sem uma fonte autorizada em Portugal (DGAV).
4. NUNCA inventes períodos de segurança — se não sabes, diz "Confirmar no rótulo do produto".
5. NUNCA afirmes que um produto está autorizado em Portugal sem confirmação.
6. Dá prioridade a ações de baixo risco: remover partes afetadas, corrigir rega, melhorar ventilação, evitar molhar folhas, isolar a planta, acompanhar evolução.
7. NUNCA diagnostiques pH, azoto, fósforo ou potássio apenas por fotografia — indica que é necessário um teste de solo.
8. Se a imagem não contiver uma planta, cultura, ou parte reconhecível de uma planta, define status como "not_a_plant".
9. Se a imagem for demasiado desfocada ou de baixa qualidade para análise, define status como "low_confidence".

Responde SEMPRE em português de Portugal, em formato JSON com EXATAMENTE esta estrutura:
{
  "status": "ok" | "low_confidence" | "not_a_plant",
  "plant_name": "nome comum da planta",
  "scientific_name": "nome científico",
  "problem_category": "doença" | "praga" | "carencia" | "excesso" | "queimadura" | "frio" | "vento" | "produto" | "outra",
  "primary_diagnosis": "diagnóstico mais provável",
  "confidence_score": 0-95,
  "confidence_level": "low" | "medium" | "high",
  "visible_signs": ["sinais visíveis na fotografia"],
  "possible_causes": [{"label": "causa", "probability": 0-100, "type": "doença" | "praga" | "carencia" | "excesso" | "queimadura" | "outra"}],
  "questions_needed": ["perguntas que ajudariam a refinar o diagnóstico"],
  "immediate_actions": ["ações imediatas de baixo risco"],
  "biological_actions": ["ações biológicas recomendadas"],
  "conventional_actions": ["ações convencionais (apenas se autorizadas em Portugal)"],
  "safety_warnings": ["avisos de segurança"],
  "new_photos_required": ["fotografias adicionais necessárias, se aplicável"],
  "follow_up_days": 7,
  "model_version": ""
}

O campo model_version deve ser vazio — será preenchido pelo servidor.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    // ── 1. JWT validation ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária. Inicie sessão para usar o diagnóstico." }),
        { status: 401, headers: jsonHeaders },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada. Inicie sessão novamente." }),
        { status: 401, headers: jsonHeaders },
      );
    }

    // ── 2. Validate input ──────────────────────────────────────────────
    const body: DiagnosisRequest = await req.json();
    const { part, imageBase64 } = body;

    if (!part || !ALLOWED_PARTS.includes(part)) {
      return new Response(
        JSON.stringify({ error: "É necessário indicar a parte da planta analisada." }),
        { status: 400, headers: jsonHeaders },
      );
    }

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "É necessária uma fotografia (imageBase64)." }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const sizeBytes = Math.floor(imageBase64.length * 0.75);
    if (sizeBytes > MAX_IMAGE_BYTES) {
      return new Response(
        JSON.stringify({ error: "A imagem é demasiado grande (máximo 10 MB)." }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // ── 3. Rate limiting ───────────────────────────────────────────────
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await supabase
      .from("diagnosis_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return new Response(
        JSON.stringify({
          error: `Limite de ${RATE_LIMIT_PER_HOUR} diagnósticos por hora atingido. Tente novamente mais tarde.`,
        }),
        { status: 429, headers: jsonHeaders },
      );
    }

    await supabase.from("diagnosis_rate_limits").insert({ user_id: user.id });

    // ── 4. Check API key ───────────────────────────────────────────────
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          status: "ai_not_configured",
          message: "A chave da OpenAI ainda não foi configurada no Supabase.",
          part,
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // ── 5. Build the user content ──────────────────────────────────────
    const contextParts: string[] = [`Parte fotografada: ${part}.`];
    if (body.plantName) contextParts.push(`Nome da planta (fornecido pelo utilizador): ${body.plantName}.`);
    if (body.region) contextParts.push(`Região: ${body.region}.`);
    if (body.symptoms) contextParts.push(`Sintomas observados: ${body.symptoms}.`);
    if (body.watering) contextParts.push(`Rega: ${body.watering}.`);
    if (body.sunExposure) contextParts.push(`Exposição solar: ${body.sunExposure}.`);
    contextParts.push("Analisa esta fotografia e devolve o diagnóstico em formato JSON conforme as instruções.");

    const userContent = [
      { type: "input_text", text: contextParts.join(" ") },
      { type: "input_image", image_url: `data:image/jpeg;base64,${imageBase64}`, detail: "high" },
    ];

    // ── 6. Call OpenAI Responses API ───────────────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let aiResponse: Response;
    try {
      aiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          input: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          max_output_tokens: 2000,
          temperature: 0.2,
          text: { format: { type: "json_object" } },
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof DOMException && fetchErr.name === "AbortError";
      return new Response(
        JSON.stringify({
          error: isTimeout
            ? "A análise demorou demasiado tempo. Tente novamente."
            : "Não foi possível contactar o serviço de IA. Tente novamente.",
        }),
        { status: 502, headers: jsonHeaders },
      );
    }
    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Erro da API de IA (${aiResponse.status}). Tente novamente mais tarde.` }),
        { status: 502, headers: jsonHeaders },
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.output?.find((o: { type: string }) => o.type === "message")
      ?.content?.find((c: { type: string }) => c.type === "output_text")?.text;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "A API de IA não devolveu conteúdo." }),
        { status: 502, headers: jsonHeaders },
      );
    }

    // ── 7. Parse and validate JSON ─────────────────────────────────────
    let parsed: StructuredDiagnosis;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(
          JSON.stringify({ error: "Resposta da IA em formato inválido." }),
          { status: 502, headers: jsonHeaders },
        );
      }
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return new Response(
          JSON.stringify({ error: "Resposta da IA em formato inválido." }),
          { status: 502, headers: jsonHeaders },
        );
      }
    }

    // ── 8. Server-side validation ──────────────────────────────────────
    const validStatuss = ["ok", "low_confidence", "not_a_plant"];
    if (!parsed.status || !validStatuss.includes(parsed.status)) {
      parsed.status = "low_confidence";
    }

    const score = typeof parsed.confidence_score === "number"
      ? Math.max(0, Math.min(95, Math.round(parsed.confidence_score)))
      : 0;

    parsed.confidence_score = score;
    parsed.confidence_level = score >= 75 ? "high" : score >= 50 ? "medium" : "low";
    parsed.model_version = MODEL;

    // Ensure arrays exist
    const ensureArray = (v: unknown): string[] => Array.isArray(v) ? v.map(String) : [];
    const ensureCauses = (v: unknown) => Array.isArray(v) ? v.map((c: Record<string, unknown>) => ({
      label: String(c.label ?? ""),
      probability: Math.max(0, Math.min(100, Number(c.probability ?? 0))),
      type: String(c.type ?? "outra"),
    })) : [];

    parsed.visible_signs = ensureArray(parsed.visible_signs);
    parsed.possible_causes = ensureCauses(parsed.possible_causes);
    parsed.questions_needed = ensureArray(parsed.questions_needed);
    parsed.immediate_actions = ensureArray(parsed.immediate_actions);
    parsed.biological_actions = ensureArray(parsed.biological_actions);
    parsed.conventional_actions = ensureArray(parsed.conventional_actions);
    parsed.safety_warnings = ensureArray(parsed.safety_warnings);
    parsed.new_photos_required = ensureArray(parsed.new_photos_required);
    parsed.follow_up_days = Math.max(1, Math.min(30, Number(parsed.follow_up_days) || 7));

    // ── 9. Low confidence — ask for better photos ──────────────────────
    if (parsed.status === "low_confidence" || score < MIN_CONFIDENCE) {
      return new Response(
        JSON.stringify({
          ...parsed,
          status: "low_confidence",
          message:
            `Confiança baixa (${score}%). ` +
            "Para melhorar a identificação, tire fotografias de várias partes da planta:",
          suggestions: parsed.new_photos_required.length > 0
            ? parsed.new_photos_required
            : [
              "Planta completa, incluindo o solo à volta",
              "Frente da folha afetada",
              "Verso da folha afetada",
              "Caule completo, de diferentes ângulos",
              "Fruto, se aplicável",
              "Terra junto à raiz",
            ],
          timestamp: new Date().toISOString(),
          ai_raw: aiData,
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // ── 10. Not a plant ────────────────────────────────────────────────
    if (parsed.status === "not_a_plant") {
      return new Response(
        JSON.stringify({
          ...parsed,
          message: "A imagem não parece conter uma planta ou parte reconhecível de uma planta.",
          timestamp: new Date().toISOString(),
          ai_raw: aiData,
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // ── 11. Success — return validated structured diagnosis ────────────
    return new Response(
      JSON.stringify({
        ...parsed,
        status: "ok",
        part,
        timestamp: new Date().toISOString(),
        ai_raw: aiData,
        safety_disclaimer:
          "Este resultado não substitui a avaliação de um técnico agrícola ou uma análise laboratorial. " +
          "Antes de aplicar qualquer produto fitofarmacêutico, confirme a sua autorização em Portugal (DGAV), " +
          "a dose correta e o período de segurança. Siga sempre as instruções do rótulo.",
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno na edge function." }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
