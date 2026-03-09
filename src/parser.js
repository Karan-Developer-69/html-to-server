function parseHTML(htmlContent) {
    const serverMatch = htmlContent.match(/<server>([\s\S]*?)<\/server>/i);
    let serverCode = '';
    let cleanHTML = htmlContent;

    if (serverMatch) {
        serverCode = serverMatch[1].trim();
        // Remove the server block from the output html
        cleanHTML = htmlContent.replace(serverMatch[0], '');
    }

    // Inject dashboard bundle before </body> or at the end
    const dashboardScript = `<script src="/__baba__/dashboard.js"></script>`;
    if (cleanHTML.includes('</body>')) {
        cleanHTML = cleanHTML.replace('</body>', `${dashboardScript}\n</body>`);
    } else {
        cleanHTML += `\n${dashboardScript}`;
    }

    return { serverCode, cleanHTML };
}

module.exports = { parseHTML };
