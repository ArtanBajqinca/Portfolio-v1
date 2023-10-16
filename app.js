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
const port = 80
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
    'CREATE TABLE projects (pid INTEGER PRIMARY KEY, pname TEXT NOT NULL, pyear INTEGER NOT NULL, pdesc TEXT NOT NULL, ptype TEXT NOT NULL, pimgURL TEXT NOT NULL)',
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
                    desc: 'Description',
                    type: 'programming',
                    url: '/img/proj-g/Cv-website.png',
                },
                {
                    id: 2,
                    name: 'Database for a sneakerBrand business',
                    year: 2023,
                    desc: 'Description',
                    type: 'programming',
                    url: '/img/proj-g/Logical-model.png',
                },
                {
                    id: 3,
                    name: ' ',
                    year: 0,
                    desc: 'Description',
                    type: 'graphic-design',
                    url: '/img/proj-g/Umrah191227.png',
                },
                {
                    id: 4,
                    name: ' ',
                    year: 0,
                    desc: 'Description',
                    type: 'graphic-design',
                    url: '/img/proj-g/Jonkoping_230807.png',
                },
                {
                    id: 5,
                    name: ' ',
                    year: 0,
                    desc: 'Description',
                    type: 'graphic-design',
                    url: '/img/proj-g/Arabiska-kurs.png',
                },
                {
                    id: 6,
                    name: ' ',
                    year: 0,
                    desc: 'Description',
                    type: 'graphic-design',
                    url: '/img/proj-g/Sahih_AlBukhari.png',
                },
            ]

            projectsEntries.forEach((oneProject) => {
                db.run(
                    'INSERT INTO projects (pid, pname, pyear, pdesc, ptype, pimgURL) VALUES (?, ?, ?, ?, ?, ?)',
                    [oneProject.id, oneProject.name, oneProject.year, oneProject.desc, oneProject.type, oneProject.url],
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
                    date: '2020 - 2021',
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
                    desc: 'C++, Databases, Data Structures and Algorithms, Object Oriented  Programming and also math courses such as Discrete Mathematic, Linear Algebra and Calculus in one variable',
                    date: 'Start 2021 - 2022',
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
