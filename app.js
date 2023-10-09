const express = require("express");
const { engine } = require("express-handlebars");
const bodyParser = require("body-parser");
const session = require("express-session");
const connectSqlite3 = require("connect-sqlite3");
const sqlite3 = require("sqlite3");

// Configuration
const port = 8080;
const app = express();
const db = new sqlite3.Database("projects-ab.db");

// Middleware Configuration
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const SQLiteStore = connectSqlite3(session);
app.use(
  session({
    store: new SQLiteStore({ db: "session-db.db" }),
    saveUninitialized: false,
    resave: false,
    secret: "THE SECRET: Jerome is amazing",
  })
);

// Routes
app.get("/", (req, res) => {
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
  };
  res.render("home.handlebars", model);
});

app.get("/about", (req, res) => {
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
  };
  res.render("about.handlebars", model);
});

app.get("/contact", (req, res) => {
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
  };
  res.render("contact.handlebars", model);
});

app.get("/projects", (req, res) => {
  db.all("SELECT * FROM projects", (error, theProjects) => {
    if (error) {
      const model = {
        dbError: true,
        theError: error,
        projects: [],
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
      };
      // renders the page with the model
      res.render("projects.handlebars", model);
    } else {
      const model = {
        dbError: false,
        theError: "",
        projects: theProjects,
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
      };
      // renders the page with the model
      res.render("projects.handlebars", model);
    }
  });
});

app.get("/projects/new", (req, res) => {
  if (req.session.isLoggedIn == true && req.session.isAdmin == true) {
    const model = {
      isLoggedIn: req.session.isLoggedIn,
      name: req.session.name,
      isAdmin: req.session.isAdmin,
    };
    res.render("newproject.handlebars", model);
  } else {
    res.redirect("/login");
  }
});

app.post("/projects/new", (req, res) => {
  const newp = [
    req.body.projname,
    req.body.projyear,
    req.body.projdesc,
    req.body.projtype,
    req.body.projimg,
  ];
  if (req.session.isLoggedIn == true && req.session.isAdmin == true) {
    db.run(
      "INSERT INTO projects (pname, pyear, pdesc, ptype, pimgURL) VALUES (?,?,?,?,?)",
      newp,
      (error) => {
        if (error) {
          console.log("ERROR: ", error);
        } else {
          console.log("Line added into the projects table");
        }
        res.redirect("/projects");
      }
    );
  } else {
    res.redirect("/login");
  }
});

app.get("/projects/update/:id", (req, res) => {
  const id = req.params.id;
  db.get(
    "SELECT * FROM projects WHERE pid=?",
    [id],
    function (error, theProject) {
      if (error) {
        console.log("ERROR: ", error);
        const model = {
          dbError: true,
          theError: error,
          project: {},
          isLoggedIn: req.session.isLoggedIn,
          name: req.session.name,
          isAdmin: req.session.isAdmin,
        };
        res.render("modifyproject.handlebars", model);
      } else {
        const model = {
          dbError: false,
          theError: "",
          project: theProject,
          isLoggedIn: req.session.isLoggedIn,
          name: req.session.name,
          isAdmin: req.session.isAdmin,
          helpers: {
            theTypeR(value) {
              return value == "Research";
            },
            theTypeT(value) {
              return value == "Teaching";
            },
            theTypeO(value) {
              return value == "Other";
            },
          },
        };
        res.render("modifyproject.handlebars", model);
      }
    }
  );
});

app.post("/projects/update/:id", (req, res) => {
  const id = req.params.id;
  const newp = [
    req.body.projname,
    req.body.projyear,
    req.body.projdesc,
    req.body.projtype,
    req.body.projimg,
    id,
  ];
  if (req.session.isLoggedIn == true && req.session.isAdmin == true) {
    db.run(
      "UPDATE projects SET pname=?, pyear=?, pdesc=?, pimgURL=?, WHERE pid=?",
      newp,
      (error) => {
        if (error) {
          console.log("ERROR: ", error);
        } else {
          console.log("Project updated!");
        }
        res.redirect("/projects");
      }
    );
  }
});

app.get("/projects/delete/:id", (req, res) => {
  const id = req.params.id;
  if (req.session.isLoggedIn == true && req.session.isAdmin == true) {
    db.run("DELETE FROM projects WHERE pid=?", [id], (error, theProjects) => {
      if (error) {
        const model = {
          dbError: true,
          theError: error,
          isLoggedIn: req.session.isLoggedIn,
          name: req.session.name,
          isAdmin: req.session.isAdmin,
        };
        res.render("home.handlebars", model);
      } else {
        const model = {
          dbError: false,
          theError: "",
          isLoggedIn: req.session.isLoggedIn,
          name: req.session.name,
          isAdmin: req.session.isAdmin,
        };
        res.render("home.handlebars", model);
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
  };
  res.render("login.handlebars", model);
});

app.post("/login", (req, res) => {
  const { un, pw } = req.body;

  if (un === "baar21pl" && pw === "pass") {
    req.session.isAdmin = true;
    req.session.isLoggedIn = true;
    req.session.name = "baar21pl";
    res.redirect("/");
  } else {
    req.session.isAdmin = false;
    req.session.isLoggedIn = false;
    req.session.name = "";
    res.redirect("login");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Error destroying session:", error);
    }
    res.redirect("/login");
  });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running and listening on port ${port}`);
});

///////////////////
// D A T B A S E //
///////////////////

// Create 'projects' table
db.run(
  "CREATE TABLE projects (pid INTEGER PRIMARY KEY, pname TEXT NOT NULL, pyear INTEGER NOT NULL, pdesc TEXT NOT NULL, ptype TEXT NOT NULL, pimgURL TEXT NOT NULL)",
  (error) => {
    if (error) {
      console.log("ERROR: ", error);
    } else {
      console.log("---> Table projects created!");

      const projects = [
        {
          id: "1",
          name: "Counting people with a camera",
          type: "research",
          desc: "The purpose of this project is to count people passing through a corridor and to know how many are in the room at a certain time.",
          year: 2022,
          url: "/img/counting.png",
        },
        {
          id: "2",
          name: "Visualisation of 3D medical images",
          type: "research",
          desc: "The project makes a 3D model of the analysis of the body of a person and displays the detected health problems. It is useful for doctors to view in 3D their patients and the evolution of a disease.",
          year: 2012,
          url: "/img/medical.png",
        },
        {
          id: "3",
          name: "Multiple questions system",
          type: "teaching",
          desc: "During the lockdowns in France, this project was useful to test the students online with a Quizz system.",
          year: 2021,
          url: "/img/qcm07.png",
        },
        {
          id: "4",
          name: "Image comparison with the Local Dissimilarity Map",
          type: "research",
          desc: "The project is about finding and quantifying the differences between two images of the same size. The applications were numerous: satellite imaging, medical imaging,...",
          year: 2020,
          url: "/img/diaw02.png",
        },
        {
          id: "5",
          name: "Management system for students' internships",
          type: "teaching",
          desc: "This project was about the creation of a database to manage the students' internships.",
          year: 2012,
          url: "/img/management.png",
        },
      ];

      projects.forEach((oneProject) => {
        db.run(
          "INSERT INTO projects (pid, pname, pyear, pdesc, ptype, pimgURL) VALUES (?, ?, ?, ?, ?, ?)",
          [
            oneProject.id,
            oneProject.name,
            oneProject.year,
            oneProject.desc,
            oneProject.type,
            oneProject.url,
          ],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the projects table!");
            }
          }
        );
      });
    }
  }
);

// Create 'skills' table
db.run(
  "CREATE TABLE skills (sid INTEGER PRIMARY KEY, sname TEXT NOT NULL, sdesc TEXT NOT NULL, stype TEXT NOT NULL)",
  (error) => {
    if (error) {
      console.log("ERROR: ", error);
    } else {
      console.log("---> Table skills created!");

      const skills = [
        {
          id: "1",
          name: "PHP",
          type: "Programming language",
          desc: "Programming with PHP on the server side.",
        },
        {
          id: "2",
          name: "Python",
          type: "Programming language",
          desc: "Programming with Python.",
        },
        {
          id: "3",
          name: "Java",
          type: "Programming language",
          desc: "Programming with Java.",
        },
        {
          id: "4",
          name: "ImageJ",
          type: "Framework",
          desc: "Java Framework for Image Processing.",
        },
        {
          id: "5",
          name: "Javascript",
          type: "Programming language",
          desc: "Programming with Javascript on the client side.",
        },
        {
          id: "6",
          name: "Node",
          type: "Programming language",
          desc: "Programming with Javascript on the server side.",
        },
        {
          id: "7",
          name: "Express",
          type: "Framework",
          desc: "A framework for programming Javascript on the server side.",
        },
        {
          id: "8",
          name: "Scikit-image",
          type: "Library",
          desc: "A library for Image Processing with Python.",
        },
        {
          id: "9",
          name: "OpenCV",
          type: "Library",
          desc: "A library for Image Processing with Python.",
        },
      ];

      skills.forEach((oneSkill) => {
        db.run(
          "INSERT INTO skills (sid, sname, sdesc, stype) VALUES (?, ?, ?, ?)",
          [oneSkill.id, oneSkill.name, oneSkill.desc, oneSkill.type],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the skills table!");
            }
          }
        );
      });
    }
  }
);

// Create 'projectsSkills' table
db.run(
  "CREATE TABLE projectsSkills (psid INTEGER PRIMARY KEY, pid INTEGER, sid INTEGER, FOREIGN KEY (pid) REFERENCES projects (pid), FOREIGN KEY (sid) REFERENCES skills (sid))",
  (error) => {
    if (error) {
      console.log("ERROR: ", error);
    } else {
      console.log("---> Table projectsSkills created!");

      const projectsSkills = [
        { id: "1", pid: "1", sid: "2" },
        { id: "2", pid: "1", sid: "8" },
        { id: "3", pid: "1", sid: "9" },
        { id: "4", pid: "2", sid: "3" },
        { id: "5", pid: "2", sid: "4" },
        { id: "6", pid: "3", sid: "1" },
        { id: "7", pid: "4", sid: "2" },
        { id: "8", pid: "4", sid: "8" },
        { id: "9", pid: "4", sid: "9" },
        { id: "10", pid: "5", sid: "1" },
      ];

      projectsSkills.forEach((oneProjectSkill) => {
        db.run(
          "INSERT INTO projectsSkills (psid, pid, sid) VALUES (?, ?, ?)",
          [oneProjectSkill.id, oneProjectSkill.pid, oneProjectSkill.sid],
          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the projectsSkills table!");
            }
          }
        );
      });
    }
  }
);
