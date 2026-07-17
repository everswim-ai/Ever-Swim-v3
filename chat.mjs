const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}

function extractText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];

  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string" && content.text.trim()) {
        parts.push(content.text.trim());
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

    const apiKey = String(
      process.env.OPENAI_API_KEY || ""
    ).trim();

    if (!apiKey) {
      return json({
        error: "OPENAI_API_KEY가 등록되지 않았습니다."
      }, 500);
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-5-mini",

          reasoning: {
            effort: "low"
          },

          instructions: [
            "너는 EverSwim AI 수영 코치다.",
            "항상 한국어로 답변한다.",
            "사용자의 상태에 필요한 정보가 부족하면 짧은 역질문을 먼저 한다.",
            "가능한 원인은 구조, 타이밍, 출력 순서로 판단한다.",
            "질문과 관련 없는 항목은 억지로 나열하지 않는다.",
            "바로 연습할 수 있는 간단한 드릴을 제시한다.",
            "답변은 반드시 완결된 문장으로 끝낸다."
          ].join("\n"),

          input: question,
          max_output_tokens: 4000
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return json({
        error:
          data?.error?.message ||
          "OpenAI API 오류가 발생했습니다."
      }, response.status);
    }

    const answer = extractText(data);

    if (!answer) {
      const reason =
        data?.incomplete_details?.reason ||
        data?.status ||
        "알 수 없음";

      return json({
        error: `답변 내용을 받지 못했습니다. 원인: ${reason}`
      }, 502);
    }

    return json({ answer });
  } catch (error) {
    return json({
      error:
        error?.message ||
        "서버 오류가 발생했습니다."
    }, 500);
  }
};
