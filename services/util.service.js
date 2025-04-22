import fs from 'fs'
import http from 'http'
import https from 'https'

export const utilService = {
	readJsonFile,
	writeJsonFile,
	download,
    httpGet,
	ensureDirectoryExists,
    makeId
}

function readJsonFile(path) {
    // Synchronously read the file at the given path
    const str = fs.readFileSync(path, 'utf8')
    
    // Parse the JSON string into an object/array
    const data = JSON.parse(str)
    
    return data
}

function writeJsonFile(path, json) {
    // Convert the object/array to a formatted JSON string
    const data = JSON.stringify(json, null, 2)  

    // Return a Promise (resolves/reject) depending on the success of the file write operation
    return new Promise((resolve, reject) => {
        // Write the JSON string at the specified path
        fs.writeFile(path, data, err => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function download(url, fileName) {
    // Return a Promise that resolves/rejects based on the download process
    return new Promise((resolve, reject) => {
		// Create writeable stream to the file
        const file = fs.createWriteStream(fileName)

        https.get(url, content => {
            // Pipe the response content directly into the file
            content.pipe(file)

            file.on('error', reject)

            // When file finished writing, close it and resolve
            file.on('finish', () => {
                file.close()  
                resolve()     
            })
        })
    })
}

function httpGet(url) {
    // Determine protocl based on the URL
    const protocol = url.startsWith('https') ? https : http
	// HTTP GET method to request data
    const options = {
        method: 'GET',  
    }

    // Return a Promise (resolves/rejects) based on the HTTP request
    return new Promise((resolve, reject) => {
        // Make an HTTP/HTTPS request
        const req = protocol.request(url, options, res => {
            let data = ''

            // Accumulate the data chunks as they come in
            res.on('data', chunk => {
                data += chunk
            })

            // Once all data is received, resolve with complete data
            res.on('end', () => {
                resolve(data)
            })
        })

        // Handle any errors during request
        req.on('error', err => {
            reject(err) 
        })

        // End the request to ensure it completes
        req.end()
    })
}

function ensureDirectoryExists(directoryPath) {
    // Check if the directory does not exist
    if (!fs.existsSync(directoryPath)) {
        // Create the directory recursively (for nested directories)
        fs.mkdirSync(directoryPath, { recursive: true })
    }
}

function makeId(length = 5) {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}