async function run() {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAR_cUxdeoqPKj1xAzLw0u8_Ctb88cJ67g");
  const data = await response.json();
  const validModels = data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"));
  validModels.forEach(m => console.log(m.name));
}
run();
