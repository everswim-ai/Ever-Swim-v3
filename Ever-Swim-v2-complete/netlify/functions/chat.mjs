const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

function extractText(data) {
  if (typeof data?.output_text === "string") return data.output_text.trim();

  const parts = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

export default async (request) => {
  if (request.method !== "POST") {
    return json({ error: "POST 요청만 허용됩니다." }, 405);
  }

  try {
    const body = await request.json();
    const question = String(body?.question || "").trim();

    if (!question) {
      return json({ error: "질문을 입력해 주세요." }, 400);
    }

    const apiKey = String(process.env.OPENAI_API_KEY || "").trim();

    if (!apiKey) {
      return json({ error: "OPENAI_API_KEY가 등록되지 않았습니다." }, 500);
    }

    if (!/^[\x21-\x7E]+$/.test(apiKey)) {
      return json({
        error: "OPENAI_API_KEY에 한글, 공백 또는 잘못된 문자가 포함되어 있습니다."
      }, 500);
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        instructions: [
          "너는 EverSwim AI 수영 코치다.",
          "항상 한국어로 답변한다.",
          "가능한 원인을 구조, 타이밍, 출력 순서로 점검한다.",
          "정보가 부족하면 단정하지 말고 짧은 역질문을 한다.",
          "바로 연습할 수 있는 간단한 드릴을 제시한다."
        ].join("\n"),
        input: question,
        max_output_tokens: 900
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return json({ error: data?.error?.message || "OpenAI API 오류" }, response.status);
    }

    const answer = extractText(data);

    if (!answer) {
      return json({ error: "답변 내용을 받지 못했습니다." }, 502);
    }

    return json({ answer });
  } catch (error) {
    return json({ error: error?.message || "서버 오류가 발생했습니다." }, 500);
  }
};
