const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')

// Directory where your Handlebars templates are
const VIEWS_DIR = path.join(__dirname, 'views')

// Directory to save compiled HTML files
const OUTPUT_DIR = path.join(__dirname, 'docs')

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Main layout to wrap around each page
const mainLayout = fs.readFileSync(path.join(VIEWS_DIR, 'layouts', 'main.handlebars'), 'utf8')
const compiledMain = Handlebars.compile(mainLayout)

// Register the "menu.handlebars" partial
const partialMenuContent = fs.readFileSync(path.join(VIEWS_DIR, 'partials', 'menu.handlebars'), 'utf8')
Handlebars.registerPartial('menu', partialMenuContent)

// List of all your Handlebars pages you want to compile
const pages = ['landing-page', 'about', 'contact', 'login', 'projects'] // Add other page names as needed

pages.forEach((page) => {
    const templatePath = path.join(VIEWS_DIR, `${page}.handlebars`)
    const templateContent = fs.readFileSync(templatePath, 'utf8')
    const compiledTemplate = Handlebars.compile(templateContent)

    // You can provide data here if needed
    const htmlContent = compiledTemplate({})

    const finalHtml = compiledMain({ body: htmlContent })
    fs.writeFileSync(path.join(OUTPUT_DIR, `${page}.html`), finalHtml)
})

console.log('Compilation completed.')
