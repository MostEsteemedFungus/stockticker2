var http = require('http');
var url = require('url');
var { MongoClient } = require('mongodb');

var port = process.env.PORT || 3000;

const uri = "mongodb+srv://iviwebuser:spEYEderw3b@iviwebwebweb.qdqgdup.mongodb.net/?retryWrites=true&w=majority&appName=iviwebwebweb";
const dbName = 'Stock';
const collectionName = 'PublicCompanies';

console.log("Server is starting...");

http.createServer(async function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    const urlObj = url.parse(req.url, true);

    if (urlObj.pathname == "/") {
        res.write("<h1>Stock Search App</h1>");
        let s = `
            <form method='get' action='/process'>
                <label>Enter Company Name or Ticker: 
                    <input type='text' name='query' required>
                </label><br>
                <label><input type='radio' name='searchType' value='ticker' required> Ticker</label>
                <label><input type='radio' name='searchType' value='name'> Company Name</label><br>
                <input type='submit' value='Search'>
            </form>
        `;
        res.write(s);
        res.end();
    } 
    else if (urlObj.pathname == "/process") {
        const query = urlObj.query.query;
        const searchType = urlObj.query.searchType;

        if (!query || !searchType) {
            res.write("<p>Error: Missing input or selection.</p>");
            res.end();
            return;
        }

        const client = new MongoClient(uri);
        try {
            await client.connect();
            const db = client.db(dbName);
            const collection = db.collection(collectionName);

            const filter = searchType === 'ticker'
                ? { ticker: new RegExp(query, 'i') }
                : { name: new RegExp(query, 'i') };

            const results = await collection.find(filter).toArray();
            console.log("Search results:", results);

            res.write(`<h2>Search Results for "${query}" (${searchType})</h2>`);

            if (results.length === 0) {
                res.write("<p>No matching companies found.</p>");
            } else {
                res.write("<table border='1'><tr><th>Name</th><th>Ticker</th><th>Price</th></tr>");
                results.forEach(company => {
                    res.write(`<tr><td>${company.name}</td><td>${company.ticker}</td><td>$${company.stockPrice.toFixed(2)}</td></tr>`);
                });
                res.write("</table>");
            }

            res.write("<br><a href='/'>Search Again</a>");
            res.end();

        } catch (err) {
            console.error("Database error:", err);
            res.write("<p>Error connecting to the database.</p>");
            res.end();
        } finally {
            await client.close();
        }
    } 
    else {
        res.write("<h3>404 - Page not found</h3>");
        res.end();
    }

}).listen(port);