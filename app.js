const express = require("express"); // loads the express package
const { engine } = require("express-handlebars"); // loads handlebars for Express
const port = 8080; // defines the port
const app = express(); // creates the Express application

// defines handlebars engine
app.engine("handlebars", engine());
// defines the view engine to be handlebars
app.set("view engine", "handlebars");
// defines the views directory
app.set("views", "./views");

// define static directory "public" to access css/ and img/
app.use(express.static("public"));

// MODEL (DATA)
const humans = [
  { id: "0", name: "Jerome" },
  { id: "1", name: "Mira" },
  { id: "2", name: "Linus" },
  { id: "3", name: "Susanne" },
  { id: "4", name: "Jasmin" },
];

// CONTROLLER (THE BOSS)
app.get("/", function (request, response) {
  response.render("home.handlebars");
});

app.get("/humans", (request, response) => {
  const model = { listHumans: humans };
  response.render("humans.handlebars", model);
});

app.get("/humans/:id", (request, response) => {
  const id = request.params.id;
  const model = humans[id];
  response.render("human.handlebars", model);
});

// runs the app and listens to the port
app.listen(port, () => {
  console.log(`Server running and listening on port ${port}`);
});
