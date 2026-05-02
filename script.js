console.log('yay');

// ================================
// 🧠 BUSINESS AI MEMORY SYSTEM
// ================================

function getMemory() {
  return {
    shopName: localStorage.getItem("shopName") || "",
    businessCategory: localStorage.getItem("businessCategory") || "",
    businessHours: localStorage.getItem("businessHours") || "",
    policies: localStorage.getItem("policies") || "",
    extraInfo: localStorage.getItem("extraInfo") || "",
    products: localStorage.getItem("products") || ""
  };
}

function updateMemory(newData) {
  Object.keys(newData).forEach(key => {
    if (newData[key] !== undefined) {
      localStorage.setItem(key, newData[key]);
    }
  });
}

const emailInput = document.getElementById("emailInput");
const toneSelect = document.getElementById("toneSelect");
const generateBtn = document.getElementById("generateBtn");
const replyOutput = document.getElementById("replyOutput");
const copyBtn = document.getElementById("copyBtn");

// ===== FETCH FROM SERVER =====
async function tryGenerateViaServer(emailText, tone) {
  const memory = getMemory();

  const res = await fetch("/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailText,
      tone,
      memory
    })
  });

  const payload = await res.json();

  if (!res.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload.reply;
}

// ===== Generate reply =====
generateBtn.addEventListener("click", async () => {
  const emailText = emailInput.value.trim();
  const tone = toneSelect.value;

  if (!emailText) {
    replyOutput.value = "Please paste an email first.";
    return;
  }

  generateBtn.disabled = true;
  replyOutput.value = "AI is thinking...";

  try {
    const reply = await tryGenerateViaServer(emailText, tone);
    typeText(replyOutput, reply);
  } catch (err) {
    replyOutput.value = "Error: " + err.message;
  } finally {
    generateBtn.disabled = false;
  }
});

// ===== COPY BUTTON =====
copyBtn.addEventListener("click", async () => {
  const text = replyOutput.value;
  if (!text) return;

  await navigator.clipboard.writeText(text);
  copyBtn.textContent = "Copied!";

  setTimeout(() => {
    copyBtn.textContent = "Copy";
  }, 1500);
});

// ===== TYPING ANIMATION =====
function typeText(element, text) {
  let i = 0;
  element.value = "";

  function type() {
    if (i < text.length) {
      element.value += text[i];
      i++;
      setTimeout(type, 10);
    }
  }

  type();
}

// ===== SAVE INFO =====
function saveInfo() {
  const memory = {
    shopName: document.getElementById("shopName").value,
    businessCategory: document.getElementById("businessCategory").value,
    businessHours: document.getElementById("businessHours").value,
    policies: document.getElementById("policies").value,
    extraInfo: document.getElementById("extraInfo").value,
    products: document.getElementById("products").value
  };

  updateMemory(memory);

  console.log("🧠 Memory updated:", memory);
  alert("Business memory saved!");
}