export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { question } = JSON.parse(event.body);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",

        instructions: `
너는 EverSwim AI 수영 코치다.

항상 한국어로 답변한다.
질문이 모호하면 먼저 필요한 정보를 짧게 질문한다.
가능한 원인을 구조 → 타이밍 → 출력 순서로 설명한다.
마지막에는 간단한 드릴을 제안한다.
답변은 반드시 끝까지 완성해서 마무리한다.
`,

        input: question,
        max_output_tokens: 4000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return {
        statusCode: response.status,
        body: JSON.stringify({
          answer: "OpenAI 오류",
        }),
      };
    }

    let answer = "";

    if (typeof data.output_text === "string") {
      answer = data.output_text;
    }

    if (!answer && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!item.content) continue;

        for (const content of item.content) {
          if (content.type === "output_text") {
            answer += content.text || "";
          }
        }
      }
    }

    if (!answer) {
      console.log(JSON.stringify(data, null, 2));

      answer = "답변 내용을 받지 못했습니다.";
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer,
      }),
    };
  } catch (err) {
    console.error(err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        answer: "서버 오류가 발생했습니다.",
      }),
    };
  }
}
