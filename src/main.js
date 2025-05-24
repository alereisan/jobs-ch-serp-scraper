import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';
import fs from 'fs';

await Actor.init();

// Get the input from the actor's input or use defaults
const rawInput = await Actor.getInput();
console.log('Raw input from Actor.getInput():', rawInput);

const input = (Object.keys(rawInput).length === 0) ? {
    keyword: 'Recruiter',
    sortBy: 'date',
    publicationDate: '1', // Default: last 24h
    page: 1,
    maxPages: 5,
    relevantTitles: [
        'recruiter', 'recruiting', 'talent acquisition', 'personalberater', 'headhunter', 'hr business partner', 'Stellenvermittlung', 'hr', 'personalberatung', 'payroll'
    ],
    location: '', // NEU: location als Input
    categories: [100, 104, 105] // NEU: categories als Input (Array)
} : rawInput;

console.log('Final input being used:', input);

const {
    keyword,
    sortBy,
    publicationDate,
    page,
    maxPages,
    relevantTitles,
    location,
    categories // NEU: categories aus Input
} = input;

console.log('Input:', input);

const normalize = str => str.replace(/\s+/g, ' ').trim();

// Filterfunktion für relevante Titel
const isRelevantJob = (title) => {
    if (!title) return false;
    const cleanTitle = title.toLowerCase();
    return relevantTitles.some(keyword => {
        const cleanKeyword = keyword.toLowerCase();
        if (cleanKeyword.split(' ').length > 1) {
            // Debug-Ausgabe
            if (cleanTitle.includes(cleanKeyword)) {
                console.log(`MATCH: "${cleanKeyword}" in "${cleanTitle}"`);
            } else {
                console.log(`NO MATCH: "${cleanKeyword}" in "${cleanTitle}"`);
            }
            return cleanTitle.includes(cleanKeyword);
        } else {
            const pattern = new RegExp(`\\b${cleanKeyword}\\b`, 'i');
            return pattern.test(cleanTitle);
        }
    });
};

// Kategorien-Parameter für die URL bauen
const categoryParams = Array.isArray(categories) && categories.length > 0
    ? categories.map(cat => `&category=${encodeURIComponent(cat)}`).join('')
    : '';

// Initialize the crawler
const crawler = new PlaywrightCrawler({
    launchContext: {
        launchOptions: {
            headless: true,
        },
    },
    // Function called for each URL
    async requestHandler({ page, request, log }) {
        log.info(`Processing ${request.url}...`);
        
        // Cookie-Banner akzeptieren, falls vorhanden
        const acceptButton = await page.$('button:has-text("Accept")');
        if (acceptButton) {
            await acceptButton.click();
            await page.waitForTimeout(500); // kurz warten, bis das Banner verschwindet
        }
        
        // Aktuelle Seite auslesen (aus userData oder URL)
        const currentPage = request.userData?.page || 1;
        
        // Wait for the job listings to load
        await page.waitForSelector('[data-cy="serp-item"]');
        
        // Extract job data, füge page hinzu
        const jobs = await page.$$eval('[data-cy="vacancy-serp-item"]', (elements) => {
            return elements.map((el) => {
                // Finde das nächste <a> in der Parent-Hierarchie
                let parent = el.parentElement;
                let url = null;
                while (parent) {
                    if (parent.tagName.toLowerCase() === 'a' && parent.href) {
                        url = parent.href;
                        break;
                    }
                    parent = parent.parentElement;
                }

                const divs = el.querySelectorAll('div');

                return {
                    title: divs[1]?.textContent?.trim() || null,
                    company: el.querySelector('strong')?.textContent?.trim() || null,
                    location: divs[2]?.querySelectorAll('div')[0]?.querySelector('p')?.textContent?.trim() || null,
                    url,
                    workload: divs[2]?.querySelectorAll('div')[1]?.querySelector('p')?.textContent?.trim() || null,
                    employmentType: divs[2]?.querySelectorAll('div')[2]?.querySelector('p')?.textContent?.trim() || null,
                    published: divs[0]?.textContent?.trim() || null,
                };
            });
        }).then(jobs => jobs.map(job => ({ ...job, page: currentPage })));

        // Filtere die Jobs nach relevanten Titeln
        const filteredJobs = jobs.filter(job => isRelevantJob(job.title));

        // Nach dem Extrahieren:
        console.log(filteredJobs);
        fs.writeFileSync(`debug-output-page${currentPage}.json`, JSON.stringify(filteredJobs, null, 2));
        await Actor.pushData(filteredJobs);

        // Pagination: nur wenn noch nicht maxPages erreicht
        if (currentPage < maxPages) {
            // Prüfe, ob ein Next-Button existiert
            const nextButton = await page.$('[data-cy="paginator-next"]');
            if (nextButton) {
                const nextPageUrl = await page.$eval('[data-cy="paginator-next"]', el => el.href);
                if (nextPageUrl) {
                    await crawler.addRequests([{
                        url: nextPageUrl,
                        userData: { page: currentPage + 1 }
                    }]);
                } else {
                    log.warning(`Keine weitere Seite gefunden nach Seite ${currentPage}.`);
                }
            } else {
                log.warning(`Keine weitere Seite gefunden nach Seite ${currentPage}.`);
            }
        }
    },
});

function buildSearchUrl(baseUrl, params) {
    const url = new URL('/en/vacancies/', baseUrl);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
        }
    });

    return url.toString();
}

const searchUrl = buildSearchUrl('https://www.jobs.ch', {
    'publication-date': publicationDate,
    'sort-by': sortBy,
    'term': keyword,
    'page': page,
    'location': location
});

console.log('Search URL:', searchUrl);

// Start the crawler
await crawler.run([{
    url: searchUrl,
    userData: { page }
}]);

await Actor.exit(); 