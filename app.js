const express = require("express"); // loads the package
const { engine } = require("express-handlebars"); // loads handlebars
const port = 1111; // defines the port
const app = express(); // creates the Express application

// defines handlebars engine
app.engine("handlebars", engine());
// defines the view engine to be handlebars
app.set("view engine", "handlebars");
// defines the views directory
app.set("views", "./views");
// define static directory "public"
app.use(express.static("public"));

// MODEL (DATA)
const humans = [
  { id: "0", name: "Jerome" },
  { id: "1", name: "Mira" },
  { id: "2", name: "Linus" },
];

// CONTROLLER (THE BOSS)
app.get("/", (request, response) => {
  const model = humans[0];
  response.render("humans.handlebars", model);
});

// runs the app and listens to the port
app.listen(port, () => {
  console.log(`Server running and listening on port ${port}`);
});
