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
  if (typeof data?.output_text === "string") {
    return data.output_text.trim();
  }

  const parts = [];

  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (
        content?.type === "output_text" &&
        typeof content?.text === "string"
      ) {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

export default async (request) => {
  if (request.method !== "POST") {
    return json(
      { error: "POST 요청만 허용됩니다." },
      405
    );
  }

  try {
    const body = await request.json();
    const question = String(body?.question || "").trim();

    if (!question) {
      return json(
        { error: "질문을 입력해 주세요." },
        400
      );
    }

    const apiKey = String(
      process.env.OPENAI_API_KEY || ""
    ).trim();

    if (!apiKey) {
      return json(
        { error: "OPENAI_API_KEY가 등록되지 않았습니다." },
        500
      );
    }

    if (!/^[\x21-\x7E]+$/.test(apiKey)) {
      return json(
        {
          error:
            "OPENAI_API_KEY에 한글, 공백 또는 잘못된 문자가 포함되어 있습니다."
        },
        500
      );
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

          instructions: [
            "너는 EverSwim AI 수영 코치다.",
            "항상 자연스러운 한국어로 답변한다.",
            "사용자의 수영 수준과 증상을 먼저 파악한다.",
            "정보가 부족하면 단정하지 말고 짧은 역질문을 한다.",
            "원인을 구조, 타이밍, 출력 순서로 점검한다.",
            "모든 항목을 억지로 나열하지 말고 질문과 관련된 항목만 설명한다.",
            "바로 연습할 수 있는 간단한 드릴을 제시한다.",
            "답변을 중간에서 끝내지 말고 반드시 완결된 문장으로 마무리한다.",
            "답변은 핵심부터 설명하고 불필요하게 길게 늘이지 않는다."
          ].join("\n"),

          input: question,

          text: {
            format: {
              type: "text"
            }
          },

          max_output_tokens: 3000
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return json(
        {
          error:
            data?.error?.message ||
            "OpenAI API 오류가 발생했습니다."
        },
        response.status
      );
    }

    const answer = extractText(data);

    const incompleteReason =
      data?.incomplete_details?.reason || null;

    if (!answer) {
      return json(
        {
          error:
            incompleteReason === "max_output_tokens"
              ? "답변 생성 한도가 부족해 내용을 만들지 못했습니다."
              : "답변 내용을 받지 못했습니다.",
          incompleteReason
        },
        502
      );
    }

    return json({
      answer,
      status: data?.status || "completed",
      incompleteReason
    });
  } catch (error) {
    return json(
      {
        error:
          error?.message ||
          "서버 오류가 발생했습니다."
      },
      500
    );
  }
};
