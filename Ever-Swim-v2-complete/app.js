const question = document.getElementById("question");
const askBtn = document.getElementById("askBtn");
const answer = document.getElementById("answer");

askBtn.addEventListener("click", async () => {
  const text = question.value.trim();

  if (!text) {
    alert("질문을 입력해 주세요.");
    return;
  }

  askBtn.disabled = true;
  askBtn.textContent = "답변 생성 중...";
  answer.classList.remove("hidden");
  answer.textContent = "EverSwim 코치 AI가 질문을 확인하고 있습니다.";

  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({question:text})
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "서버 오류가 발생했습니다.");
    }

    answer.textContent = data.answer || "답변을 받지 못했습니다.";
  } catch (error) {
    answer.textContent = "연결 오류\n\n" + error.message;
  } finally {
    askBtn.disabled = false;
    askBtn.textContent = "답변 보기";
  }
});
