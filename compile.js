const fs = require('fs')
const path = require('path')
const handlebars = require('handlebars')

// Define the directory paths
const VIEWS_DIR = path.join(__dirname, 'views')
const PARTIALS_DIR = path.join(VIEWS_DIR, 'partials')
const PUBLIC_DIR = path.join(__dirname, 'public')

// Read all partial files and register them
const partials = fs.readdirSync(PARTIALS_DIR)
partials.forEach((partial) => {
    const partialName = path.parse(partial).name
    const partialPath = path.join(PARTIALS_DIR, partial)
    const partialContent = fs.readFileSync(partialPath, 'utf8')
    handlebars.registerPartial(partialName, partialContent)
})

// Compile the templates
const compileTemplates = () => {
    const templateFiles = fs.readdirSync(VIEWS_DIR)
    templateFiles.forEach((templateFile) => {
        if (templateFile.endsWith('.handlebars')) {
            const templateName = path.parse(templateFile).name
            const templatePath = path.join(VIEWS_DIR, templateFile)
            const templateContent = fs.readFileSync(templatePath, 'utf8')
            const compiledTemplate = handlebars.compile(templateContent)
            const outputHtml = compiledTemplate()
            const outputFile = path.join(PUBLIC_DIR, `${templateName}.html`)
            fs.writeFileSync(outputFile, outputHtml)
        }
    })
}

// Run the template compilation
compileTemplates()
console.log('Compilation completed.')
