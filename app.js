const question = document.getElementById("question");
const askBtn = document.getElementById("askBtn");
const answer = document.getElementById("answer");

async function askEverSwim() {
  const text = question.value.trim();

  if (!text) {
    alert("질문을 입력해 주세요.");
    question.focus();
    return;
  }

  askBtn.disabled = true;
  askBtn.textContent = "답변 생성 중...";

  answer.classList.remove("hidden");
  answer.textContent =
    "EverSwim 코치 AI가 질문을 확인하고 있습니다.";

  try {
    const data = await DataService.askCoach(text);

    let result =
      data?.answer ||
      "답변을 받지 못했습니다.";

    if (data?.incompleteReason === "max_output_tokens") {
      result +=
        "\n\n※ 답변 생성 한도에 도달해 일부 내용이 생략되었을 수 있습니다.";
    }

    answer.textContent = result;
  } catch (error) {
    answer.textContent =
      "연결 오류\n\n" +
      (error?.message ||
        "알 수 없는 오류가 발생했습니다.");
  } finally {
    askBtn.disabled = false;
    askBtn.textContent = "답변 보기";
  }
}

askBtn.addEventListener("click", askEverSwim);

question.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {
    event.preventDefault();
    askEverSwim();
  }
});
