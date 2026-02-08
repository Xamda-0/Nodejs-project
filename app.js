const express = require("express");
const path = require("path");

const app = express();
// const PORT = 3000;

// static files
app.use(express.static(path.join(__dirname, "public")))
app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));

});

app.listen(3000);

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
