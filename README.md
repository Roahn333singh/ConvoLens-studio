# 🧠 ConvoLens

[🔗 Link to Application](https://studio--visaige-8fpw9.us-central1.hosted.app/)

> ⚠️ **Note:** The backend is deployed on **Google Cloud Run**.  
> If you need access to the backend URL, kindly make a **request**.  
> The URL is not publicly shared to avoid resource overutilization.

---

## 🌐 About the Project

**ConvoLens** is a **Conversation Insight Platform** built using **Firebase Studio** on the frontend and deployed on **Google Cloud**.

It is a **cloud-native service** designed to extract structured insights from long-form audio conversations such as:
- 🗣️ Debates  
- 🧑‍💼 Meetings  
- 🎤 Interviews

It leverages cutting-edge technologies including:
- **Large Language Models (LLMs)**
- **Vector Search**
- **Graph Reasoning**

Together, these tools transform **unstructured dialogue** into **searchable, queryable knowledge**.

---

## 🧩 Project Structure

### 🔧 Frontend
- Built with **Firebase Studio**
- Hosted via **Firebase App Hosting**

### ⚙️ Backend
- Deployed on **Google Cloud Run**
- Integrates:
  - WhisperX/Assembly for transcription
  - LLM for insight extraction
  - Graph Transformer for knowledge structuring

If you're interested in backend logic, check out the core file:
[👉 `app.py`](https://github.com/Roahn333singh/ConvoLens/blob/main/app.py)

---

## 🖼️ Screenshots

<img width="1631" alt="image" src="https://github.com/user-attachments/assets/06c1dfe9-3556-4b49-8edc-dc81426d387d" />


<img width="996" alt="image" src="https://github.com/user-attachments/assets/dbcd1ac0-a86c-4cac-933a-4f9755ccf133" />


---

## 🚀 Get Started

To begin development or exploration, start with:

```ts
src/app/page.tsx
