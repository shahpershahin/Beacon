async function run() {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAR_cUxdeoqPKj1xAzLw0u8_Ctb88cJ67g");
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) { console.error(e); }
}
run();
