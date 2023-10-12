app.get('/projects/update/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM projects WHERE pid=?', [id], (error, theProject) => {
    if (error) {
      console.log('ERROR: ', error);
      const model = {
        dbError: true,
        theError: error,
        projects: {},
        isLoggedIn: req.session.isLoggedIn,
        name: req.session.name,
        isAdmin: req.session.isAdmin,
      };
      res.render('modydyproject.handlebars', model);
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
            return value == 'Reasearch';
          },
          theTypeT(value) {
            return value == 'Teaching';
          },
          theTypeO(value) {
            return value == 'Other';
          },
        },
      };
      res.render('modifyproject.handlebars', model);
    }
  });
});

app.post('/projects/update/:id', (req, res) => {
  const id = req.params.id;
  const updatedData = [
    req.body.projname,
    req.body.projyear,
    req.body.projdesc,
    req.body.projtype,
    req.body.projimg,
    id,
  ];

  if (req.session.isLoggedIn && req.session.isAdmin) {
    db.run(
      'UPDATE projects SET pname=?, pyear=?, pdesc=?, ptype=?, pimgURL=? WHERE pid=?',
      updatedData,
      (error) => {
        if (error) {
          console.log('ERROR: ', error);
          // You might want to add more error handling here.
          res.redirect('/projects');
        } else {
          res.redirect('/projects');
        }
      },
    );
  } else {
    res.redirect('/login');
  }
});
