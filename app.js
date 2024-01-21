// Module Imports
const express = require('express')
const { engine } = require('express-handlebars')
const bodyParser = require('body-parser')
const session = require('express-session')
const connectSqlite3 = require('connect-sqlite3')
const sqlite3 = require('sqlite3')
const Handlebars = require('handlebars')
const bcrypt = require('bcryptjs')

// Global Constants & Variables
const port = 3000
const app = express()
const db = new sqlite3.Database('database-ab.db')
const saltRounds = 12
const storedHashedPassword = '$2a$12$0twOEMc0xE0z/ZYIJXj0QuMbeYw4D1h5cxPeRBd13bTqcclwGEgEq'

// Middleware Configuration

app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './views')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const SQLiteStore = connectSqlite3(session)
app.use(
    session({
        store: new SQLiteStore({ db: 'session-db.db' }),
        saveUninitialized: false,
        resave: false,
        secret: 'THE SECRET: Jerome is amazing',
    })
)

// Utility Functions
Handlebars.registerHelper('eq', function (a, b) {
    return a === b
})

app.get('/', (req, res) => {
    console.log('SESSION: ', req.session)
    const model = {
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
    }
    res.render('landing-page.handlebars', model)
})

app.get('/about', (req, res) => {
    let model = {
        dbError: false,
        theError: '',
        education: [],
        experience: [],
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
    }

    // Get education data
    db.all('SELECT * FROM education', (error, theEducation) => {
        if (error) {
            model.dbError = true
            model.theError = error
        } else {
            model.education = theEducation
        }

        // Get experience data
        db.all('SELECT * FROM experience', (error, theExperience) => {
            if (error) {
                model.dbError = true
                model.theError = error
            } else {
                model.experience = theExperience
            }

            res.render('about.handlebars', model)
        })
    })
})

app.get('/contact', (req, res) => {
    const model = {
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
    }
    res.render('contact.handlebars', model)
})

app.get('/projects', (req, res) => {
    db.all('SELECT * FROM projects', (error, theProjects) => {
        if (error) {
            const model = {
                dbError: true,
                theError: error,
                projects: [],
                isLoggedIn: req.session.isLoggedIn,
                name: req.session.name,
                isAdmin: req.session.isAdmin,
            }
            res.render('projects.handlebars', model)
        } else {
            const model = {
                dbError: false,
                theError: '',
                projects: theProjects,
                isLoggedIn: req.session.isLoggedIn,
                name: req.session.name,
                isAdmin: req.session.isAdmin,
            }
            res.render('projects.handlebars', model)
        }
    })
})

app.get('/projects/:id', (req, res) => {
    const projectId = req.params.id
    db.get('SELECT * FROM projects WHERE pid=?', [projectId], (error, theProject) => {
        if (error) {
            console.log('ERROR: ', error)
            const model = {
                dbError: true,
                theError: error,
                isLoggedIn: req.session.isLoggedIn,
                name: req.session.name,
                isAdmin: req.session.isAdmin,
            }
            res.render('projectView.handlebars', model)
        } else {
            const model = {
                dbError: false,
                theError: '',
                project: theProject,
                isLoggedIn: req.session.isLoggedIn,
                name: req.session.name,
                isAdmin: req.session.isAdmin,
            }
            res.render('projectView.handlebars', model)
        }
    })
})

app.get('/projects/new', (req, res) => {
    if (req.session.isLoggedIn && req.session.isAdmin) {
        const model = {
            isLoggedIn: req.session.isLoggedIn,
            name: req.session.name,
            isAdmin: req.session.isAdmin,
        }
        res.render('newproject.handlebars', model)
    } else {
        res.redirect('/login')
    }
})

app.post('/projects/new', (req, res) => {
    const newp = [req.body.projname, req.body.projyear, req.body.projdesc, req.body.projtype, req.body.projimg]
    if (req.session.isLoggedIn && req.session.isAdmin) {
        db.run('INSERT INTO projects (pname, pyear, pdesc, ptype, pimgURL) VALUES (?,?,?,?,?)', newp, (error) => {
            if (error) {
                console.log('ERROR: ', error)
            } else {
                console.log('Line added into the projects table')
            }
            res.redirect('/projects')
        })
    } else {
        res.redirect('/login')
    }
})

app.get('/projects/update/:id', (req, res) => {
    const id = req.params.id
    db.get('SELECT * FROM projects WHERE pid=?', [id], (error, theProject) => {
        if (error) {
            console.log('ERROR: ', error)
            const model = {
                dbError: true,
                theError: error,
                projects: {},
                isLoggedIn: req.session.isLoggedIn,
                name: req.session.name,
                isAdmin: req.session.isAdmin,
            }
            res.render('modydyproject.handlebars', model)
        } else {
            const model = {
                dbError: false,
                theError: '',
                project: theProject,
                isLoggedIn: req.session.isLoggedIn,
                name: req.session.name,
                isAdmin: req.session.isAdmin,
                helpers: {
                    theTypeR(value) {
                        return value == 'Reasearch'
                    },
                    theTypeT(value) {
                        return value == 'Teaching'
                    },
                    theTypeO(value) {
                        return value == 'Other'
                    },
                },
            }
            res.render('modifyproject.handlebars', model)
        }
    })
})

app.post('/projects/update/:id', (req, res) => {
    const id = req.params.id
    const updatedData = [
        req.body.projname,
        req.body.projyear,
        req.body.projdesc,
        req.body.projtype,
        req.body.projimg,
        id,
    ]
    if (req.session.isLoggedIn && req.session.isAdmin) {
        db.run(
            'UPDATE projects SET pname=?, pyear=?, pdesc=?, ptype=?, pimgURL=? WHERE pid=?',
            updatedData,
            (error) => {
                if (error) {
                    console.log('ERROR: ', error)
                    // You might want to add more error handling here.
                    res.redirect('/projects')
                } else {
                    res.redirect('/projects')
                }
            }
        )
    } else {
        res.redirect('/login')
    }
})

app.get('/projects/delete/:id', (req, res) => {
    const id = req.params.id
    if (req.session.isLoggedIn && req.session.isAdmin) {
        db.run('DELETE FROM projects WHERE pid=?', [id], (error, theProjects) => {
            if (error) {
                const model = {
                    dbError: true,
                    theError: error,
                    isLoggedIn: req.session.isLoggedIn,
                    name: req.session.name,
                    isAdmin: req.session.isAdmin,
                }
                res.render('projects.handlebars', model)
            } else {
                res.redirect('/projects')
            }
        })
    } else {
        res.redirect('/login')
    }
})

app.get('/login', (req, res) => {
    const model = {
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
    }
    res.render('login.handlebars', model)
})

app.post('/login', (req, res) => {
    const { un, pw } = req.body
    const storedHashedPassword = '$2a$12$0twOEMc0xE0z/ZYIJXj0QuMbeYw4D1h5cxPeRBd13bTqcclwGEgEq'

    if (un === 'baar21pl') {
        bcrypt.compare(pw, storedHashedPassword, (err, result) => {
            if (err) {
                console.error('Error during password comparison:', err)
                return res.redirect('login')
            }
            if (result) {
                req.session.isAdmin = true
                req.session.isLoggedIn = true
                req.session.name = 'baar21pl'
                return res.redirect('/')
            } else {
                req.session.isAdmin = false
                req.session.isLoggedIn = false
                req.session.name = ''
                return res.redirect('login')
            }
        })
    } else {
        req.session.isAdmin = false
        req.session.isLoggedIn = false
        req.session.name = ''
        res.redirect('login')
    }
})

app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error('Error destroying session:', error)
        }
        res.redirect('/login')
    })
})

// Server Initialization
app.listen(port, () => {
    console.log(`Server running and listening on port ${port}`)
})

// D A T B A S E

// Create 'projects' table
db.run(
    'CREATE TABLE projects (pid INTEGER PRIMARY KEY, pname TEXT NOT NULL, pyear INTEGER NOT NULL, pdesc TEXT NOT NULL, ptype TEXT NOT NULL, pimgURL TEXT NOT NULL, prepoURL TEXT)',
    (error) => {
        if (error) {
            console.log('ERROR: ', error)
        } else {
            console.log('---> Table projects created!')

            const projectsEntries = [
                {
                    id: 1,
                    name: 'Personal CV showcase website',
                    year: 2023,
                    desc: 'We were assigned to develop a personal CV website, to be hosted locally, utilising only HTML and CSS, with minimal reliance on JavaScript.<br><br>I chose a minimalist design, resembling an A4 sheet, to present my information in a clear and clear manner. The colour palette was restricted to blue, black, and white.<br><br>I implemented a navigational bar to grant easy access to specific sections of my CV, allowing users to explore areas of interest in greater detail. This approach ensured a user-friendly experience while maintaining a professional and sleek appearance.',
                    type: 'programming',
                    url: '/img/project_images/cv_showcase.png',
                    repoURL: 'https://github.com/ArtanBajqinca/Personal-cv-website',
                },
                {
                    id: 2,
                    name: 'Connect Four Mobile Game',
                    year: 2023,
                    desc: 'As part of our Android course, our team developed a unique mobile version of the classic game Connect Four, themed around coins. Our goal was to create an engaging and user-friendly experience. <br><br> To achieve this, we utilized Figma, an advanced design tool, to craft a modern and simplistic interface that is intuitive for players of all ages. The game features captivating sound effects, adding to its appeal. <br><br> The development process involved Kotlin, a versatile and efficient programming language ideal for Android app development. We also integrated Jetpack Compose to streamline the user interface creation, ensuring smooth and responsive gameplay. <br><br> This project not only honed my technical skills in app development but also enhanced my teamwork and creative problem-solving abilities. It stands as a testament to my dedication and capability in crafting enjoyable and functional mobile applications.',
                    type: 'programming',
                    url: '/img/project_images/coinnect.png',
                    repoURL: 'https://github.com/ArtanBajqinca/Connect-four-game',
                },
                {
                    id: 3,
                    name: 'Poster',
                    year: 0,
                    desc: 'Poster for a travel agency',
                    type: 'graphic-design',
                    url: '/img/project_images/umrah191227.png',
                    repoURL: 'https://github.com/ArtanBajqinca/ArtanBajqinca-webdev-portfolio.git',
                },
                {
                    id: 4,
                    name: 'Poster',
                    year: 0,
                    desc: 'Poster for a lecture event',
                    type: 'graphic-design',
                    url: '/img/project_images/jonkoping_230807.png',
                    repoURL: 'https://github.com/ArtanBajqinca/ArtanBajqinca-webdev-portfolio.git',
                },
                {
                    id: 5,
                    name: 'Poster',
                    year: 0,
                    desc: 'Poster for a online course',
                    type: 'graphic-design',
                    url: '/img/project_images/arabiska_kurs.png',
                    repoURL: 'https://github.com/ArtanBajqinca/ArtanBajqinca-webdev-portfolio.git',
                },
                {
                    id: 6,
                    name: 'Poster',
                    year: 0,
                    desc: 'Poster for a charity fundraiser ',
                    type: 'graphic-design',
                    url: '/img/project_images/ramadan_kampanjen_2023.png',
                    repoURL: 'https://github.com/ArtanBajqinca/ArtanBajqinca-webdev-portfolio.git',
                },
                {
                    id: 8,
                    name: 'Database for a sneakerBrand business',
                    year: 2023,
                    desc: 'In my "Databases" course, we focused on learning how to build databases and use SQL, a language for managing data in a database. Our main project involved creating two types of plans for a database: a basic outline (conceptual model) and a more detailed plan (logical model). <br><br> From these plans, we built the actual database using SQL commands. We also added data to the database tables using more SQL commands. The project challenged us to write different types of SQL queries, from easy to more complex ones, to get specific information out of our database. <br><br> This project really helped me understand how databases are set up and how to use SQL to work with data, which are important skills in handling databases and analyzing data.',
                    type: 'programming',
                    url: '/img/project_images/database.png',
                    repoURL: null,
                },
                {
                    id: 7,
                    name: 'Profession Portfolio',
                    year: 2023,
                    desc: 'In my web development course, I created a "Professional Portfolio" website to show off my programming skills. This site is a personal display where people can learn about me, see my past work, and find how to contact me.<br><br> I built the site using HTML, CSS, Node.js, Express.js, and Handlebars. It has a modern, dark design that looks professional. The website includes my projects, some with links to the code, showing my coding skills.<br><br> This project is part of my class and shows my ability to mix technical know-how with creative design, making a portfolio that effectively showcases my professional abilities.',
                    type: 'programming',
                    url: '/img/project_images/portfolio.png',
                    repoURL: 'https://github.com/ArtanBajqinca/ArtanBajqinca-webdev-portfolio.git',
                },
            ]

            projectsEntries.forEach((oneProject) => {
                db.run(
                    'INSERT INTO projects (pid, pname, pyear, pdesc, ptype, pimgURL, prepoURL) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        oneProject.id,
                        oneProject.name,
                        oneProject.year,
                        oneProject.desc,
                        oneProject.type,
                        oneProject.url,
                        oneProject.repoURL,
                    ],
                    (error) => {
                        if (error) {
                            console.log('ERROR: ', error)
                        } else {
                            console.log('Line added into the projects table!')
                        }
                    }
                )
            })
        }
    }
)

// Create 'education' table
db.run(
    `CREATE TABLE education (
        eid INTEGER PRIMARY KEY AUTOINCREMENT, 
        ename TEXT NOT NULL, 
        edesc TEXT NOT NULL, 
        date TEXT NOT NULL
    )`,
    (error) => {
        if (error) {
            console.error('ERROR Creating Education Table: ', error)
        } else {
            console.log('Education table created successfully!')

            const educationEntries = [
                {
                    name: 'Bacheloring in Computer Engineer',
                    desc: "I've been studying Software Development and Mobile Platforms at Jönköping University, focusing on app and web systems with hands-on projects covering all stages of software development.",
                    date: '2021 - Ongoing',
                },
                {
                    name: 'Basic Science year',
                    desc: "I undertook the Basic Science Year at Jönköping's Technical College, strengthening my foundation in mathematics, physics, and chemistry, priming me for advanced engineering studies.",
                    date: '2021 - 2022',
                },
                {
                    name: 'High School degree in carpentry',
                    desc: 'With a background in traditional and modern carpentry, my degree underlines meticulous precision and excellence in all woodworking endeavors.',
                    date: '2017 - 2019',
                },
            ]

            educationEntries.forEach((entry) => {
                db.run(
                    'INSERT INTO Education (ename, edesc, date) VALUES (?, ?, ?)',
                    [entry.name, entry.desc, entry.date],
                    (error) => {
                        if (error) {
                            console.error('ERROR Inserting into Education Table: ', error)
                        } else {
                            console.log(`Added '${entry.name}' to the Education table.`)
                        }
                    }
                )
            })
        }
    }
)

// Create 'experiene' table
db.run(
    `CREATE TABLE experience (
        exid INTEGER PRIMARY KEY AUTOINCREMENT,
        exname TEXT NOT NULL,
        exdesc TEXT NOT NULL,
        exdate TEXT NOT NULL
    )`,
    (error) => {
        if (error) {
            console.log('ERROR creating Experience Table ', error)
        } else {
            console.log('Experience table created successfully!')

            const experienceEntires = [
                {
                    name: 'Course completed at University',
                    desc: 'Android development, C++, Databases, Data Structures and Algorithms, Object Oriented  Programming and also math courses such as Discrete Mathematic, Linear Algebra and Calculus in one variable',
                    date: 'Start 2021 - Ongoing',
                },
                {
                    name: 'Graphic designer for Islam.nu',
                    desc: 'Created event/course posters, edited videos, managed online courses, and developed social media graphics that aligned with the brands ethos.',
                    date: 'Start 2016 - Ongoing',
                },
                {
                    name: 'Experienced in various programs',
                    desc: 'Adobe Photoshop, Adobe Illustrator, Adobe Premier Pro, Adobe After Effects',
                    date: ' ',
                },
            ]

            experienceEntires.forEach((entry) => {
                db.run(
                    'INSERT INTO Experience (exname, exdesc, exdate) VALUES (?, ?, ?)',
                    [entry.name, entry.desc, entry.date],
                    (error) => {
                        if (error) {
                            console.log('ERROR inserting into Experience table: ', error)
                        } else {
                            console.log(`Added '${entry.name}' to the Experience table.`)
                        }
                    }
                )
            })
        }
    }
)
