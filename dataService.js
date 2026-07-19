// EverSwim 데이터 통로
// 현재는 Netlify Functions를 사용하고,
// 나중에는 이 파일 내부만 수정해 Supabase로 전환합니다.

const DataService = {
  /**
   * EverSwim 코치 AI에게 질문을 보냅니다.
   * @param {string} question 회원이 입력한 질문
   * @returns {Promise<object>} AI 답변 데이터
   */
  async askCoach(question) {
    const cleanQuestion = String(question || "").trim();

    if (!cleanQuestion) {
      throw new Error("질문을 입력해 주세요.");
    }

    const response = await fetch(
      "/.netlify/functions/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: cleanQuestion,
        }),
      }
    );

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "서버의 응답 형식을 확인할 수 없습니다."
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
        "서버 오류가 발생했습니다."
      );
    }

    return {
      answer:
        data?.answer ||
        "답변을 받지 못했습니다.",

      incompleteReason:
        data?.incompleteReason || null,
    };
  },
};

window.DataService = DataService;
